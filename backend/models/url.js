const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema(
  {
    action: { type: String, enum: ["CREATED", "EDITED", "DELETED"], required: true },
    by: { type: mongoose.Schema.Types.ObjectId, ref: "user" },
    timestamp: { type: Number, default: Date.now },
  },
  { _id: false }
);

const urlSchema = new mongoose.Schema(
  {
    shortId: {
      type: String,
      required: true,
      unique: true,
    },
    redirectURL: {
      type: String,
      required: true,
    },
    visitHistory: [
      { 
        timestamp: { type: Number, default: Date.now },
        userAgent: { type: String },
        ip: { type: String }
      }
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
    },
    auditLog: [auditLogSchema],
  },
  { timestamps: true }
);

const URL = mongoose.model("url", urlSchema);
module.exports = URL;
