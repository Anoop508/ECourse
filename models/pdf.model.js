const mongoose = require("mongoose");

const PdfSchema = new mongoose.Schema({
  title: { type: String, required: true },
  s3Key: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Pdf", PdfSchema);
