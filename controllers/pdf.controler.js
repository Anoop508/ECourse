const express = require("express");
const router = express.Router();
const auth = require("../middleware/authUser");
const Pdf = require("../models/Pdf");
const Access = require("../models/Access");
const AWS = require("aws-sdk");
const { PDFDocument, rgb } = require("pdf-lib");

AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});

const s3 = new AWS.S3();

// List PDFs with access status
router.get("/my-pdfs", auth, async (req, res) => {
  const pdfs = await Pdf.find();
  const access = await Access.find({ userId: req.user._id });
  const list = pdfs.map(pdf => {
    const a = access.find(x => x.pdfId.toString() === pdf._id.toString());
    return {
      id: pdf._id,
      title: pdf.title,
      status: a ? a.status : "none"
    };
  });
  res.json(list);
});

// Request access
router.post("/request-access", auth, async (req, res) => {
  const { pdfId } = req.body;
  const existing = await Access.findOne({ userId: req.user._id, pdfId });
  if (existing) return res.status(400).json({ message: "Already requested or has access" });

  await Access.create({ userId: req.user._id, pdfId });
  res.json({ message: "Access requested" });
});

// Get PDF with watermark if approved
router.get("/:id", auth, async (req, res) => {
  const pdfId = req.params.id;
  const access = await Access.findOne({ userId: req.user._id, pdfId, status: "approved" });
  if (!access) return res.status(403).json({ message: "No access" });

  const pdf = await Pdf.findById(pdfId);
  if (!pdf) return res.status(404).json({ message: "PDF not found" });

  // Get PDF from S3
  const s3Object = await s3.getObject({ Bucket: process.env.AWS_BUCKET_NAME, Key: pdf.s3Key }).promise();
  const inputBuffer = s3Object.Body;

  // Add watermark
  const pdfDoc = await PDFDocument.load(inputBuffer);
  const pages = pdfDoc.getPages();
  const watermarkText = `User: ${req.user.email} | ${new Date().toLocaleString()}`;

  pages.forEach(page => {
    const { width, height } = page.getSize();
    page.drawText(watermarkText, {
      x: width / 4,
      y: height / 2,
      size: 30,
      color: rgb(0.75, 0.75, 0.75),
      rotate: { type: "degrees", angle: 45 },
      opacity: 0.3
    });
  });

  const watermarkedPdf = await pdfDoc.save();

  // Upload temporary watermarked PDF to S3
  const tempKey = `temp/${req.user._id}-${Date.now()}.pdf`;
  await s3.putObject({
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: tempKey,
    Body: watermarkedPdf,
    ContentType: "application/pdf"
  }).promise();

  // Generate signed URL
  const signedUrl = s3.getSignedUrl("getObject", {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: tempKey,
    Expires: 600 // 10 minutes
  });

  res.json({ url: signedUrl });
});

module.exports = router;
