const express = require("express");
const router = express.Router();
const Access = require('../models/access.model')
const UserModel = require('../models/user.model');
const pdfModel = require('../models/pdf.model')
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
async function listOfRequestedPdfAccess(req, res) {
  try {
    const listOfRequestedPdfAccess = await Access.find();
    const list = await Promise.all(
      listOfRequestedPdfAccess.map(async (item) => {
        const user = await UserModel.findOne({ _id: item.userId });
        const pdf = await pdfModel.findOne({ _id: item.pdfId });
        return { userId: user?._id, pdfId: pdf?._id, userName: user?.name, pdfTitle: pdf?.title, pdfAccess: item.status }
      })
    );


    res.status(200).json({
      listOfRequestedPdfAccess: list,
    })

  } catch (err) {
    res.status(500).json({ err: err, message: 'Something went wrong' })
  }
};

async function getListofPdfAsPerUserWise(req, res) {
  const { userId } = req.body;

  try {

    const pdfList = await pdfModel.find();

    const accessList = await Access.find({ userId });
    console.log('hi', accessList);
    const accessMap = {};
    accessList.forEach(item => {
      accessMap[item.pdfId.toString()] = item.status;
    });

    // console.log('accessMap', accessMap);
    // 4. Merge PDFs with status
    const result = pdfList.map(pdf => {
      // console.log('pdf', pdf);
      const access = accessMap[pdf._id.toString()];

      console.log('access', access);
      // console.log(typeof(access));

      const hasAccess = access &&  access === ('Approved');
 
      return {
        _id: pdf._id,
        title: pdf.title,
        status: access && (access === 'Approved' || 'Rejected' || 'pending') ? access : "need access",
        s3Key: hasAccess ? pdf.s3Key : null
      };
    });


    res.status(200).json(result);
  }
  catch(err){
        res.status(500).json({
            message: "Something went wrong",
            error: err
        })
    }

}

// Request access
async function requestpdfAccess(req, res) {
  const { pdfId, userId } = req.body;
  try {
    const existing = await Access.findOne({ userId: userId, pdfId: pdfId });
    if (existing) return res.status(400).json({ message: "Already requested or has access" });

    await Access.create({ userId: userId, pdfId: pdfId });
    res.status(201).json({ message: "Access requested successfully" });
  }
  catch (err) {
    res.status(500).json({
      message: "Something went wrong",
      error: err
    })
  }
};

// Request pdfAccess
async function pdfAccess(req, res) {
  const { userId, pdfId, access } = req.body;
  try {
    const accessDetails = await Access.findOne({ userId, pdfId });

    const isUpdated = await Access.updateOne(
      { _id: accessDetails._id },
      {
        $set:
        {
          status: access === true ? 'Approved' : 'Rejected',
          grantedAt: Date.now(),
        }
      })
    res.status(200).json({
      message: isUpdated?.modifiedCount >= 1 && "Access status updated Succcessfully."
    })

  } catch (err) {
    res.status(500).json({
      err: err,
      message: 'Something went wrong'
    })
  }

}


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
module.exports = { requestpdfAccess, listOfRequestedPdfAccess, pdfAccess, getListofPdfAsPerUserWise }
