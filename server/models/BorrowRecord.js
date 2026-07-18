const mongoose = require("mongoose");

const borrowRecordSchema = new mongoose.Schema(
  {
    bookId: { type: mongoose.Schema.Types.ObjectId, ref: "Book", required: true },
    bookTitle: { type: String, required: true },
    bookCoverColor: { type: String, default: "#6D28D9" },
    isbn: { type: String, default: "" },
    memberId: { type: String, required: true },
    memberName: { type: String, required: true },
    memberType: { type: String, enum: ["student", "staff"], required: true },
    borrowDate: { type: Date, required: true },
    dueDate: { type: Date, default: null },
    returnDate: { type: Date, default: null },
    status: {
      type: String,
      enum: ["borrowed", "returned", "overdue", "reserved"],
      default: "borrowed",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("BorrowRecord", borrowRecordSchema);