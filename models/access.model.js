const mongoose = require("mongoose");

const AccessSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  pdfId: { type: mongoose.Schema.Types.ObjectId, ref: "Pdf", required: true },
  status: { type: String, enum: ["pending","approved","rejected"], default: "pending" },
  grantedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  grantedAt: { type: Date },
  requestedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Access", AccessSchema);
