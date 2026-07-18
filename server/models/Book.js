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
  },
  { timestamps: true }
);

module.exports = mongoose.model("Book", bookSchema);