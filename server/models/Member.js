const mongoose = require("mongoose");

const memberSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    type: { type: String, enum: ["student", "staff"], required: true },
    department: { type: String, default: "" },
    email: { type: String, default: "" },
    activeLoans: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Member", memberSchema);