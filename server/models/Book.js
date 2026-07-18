const mongoose = require("mongoose");

const bookSchema = new mongoose.Schema(
  {
    isbn: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    author: { type: String, required: true },
    category: { type: String, required: true },
    publisher: { type: String, required: true },
    year: { type: Number, required: true },
    edition: { type: String, default: "" },
    pages: { type: Number, default: 0 },
    language: { type: String, default: "English" },
    description: { type: String, default: "" },
    shelfLocation: { type: String, default: "" },
    totalCopies: { type: Number, required: true, default: 1 },
    availableCopies: { type: Number, required: true, default: 1 },
    borrowCount: { type: Number, default: 0 },
    coverColor: { type: String, default: "#6D28D9" },
    status: {
      type: String,
      enum: ["available", "low-stock", "checked-out", "reserved"],
      default: "available",
    },
  },
  { timestamps: true }
);

// Pre-save hook: auto-compute status based on availableCopies
bookSchema.pre("save", function () {
  if (this.availableCopies <= 0) {
    this.status = "checked-out";
  } else if (this.availableCopies <= 2) {
    this.status = "low-stock";
  } else {
    this.status = "available";
  }
});

module.exports = mongoose.model("Book", bookSchema);