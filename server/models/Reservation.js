const mongoose = require("mongoose");

const reservationSchema = new mongoose.Schema(
  {
    // Book info (denormalized for performance)
    bookId: { type: mongoose.Schema.Types.ObjectId, ref: "Book", required: true },
    bookTitle: { type: String, required: true },
    bookCoverColor: { type: String, default: "#6D28D9" },
    isbn: { type: String, default: "" },

    // Member info (denormalized)
    memberId: { type: String, required: true },
    memberName: { type: String, required: true },
    memberEmail: { type: String, default: "" },
    memberType: { type: String, enum: ["student", "staff"], required: true },

    // Reservation lifecycle dates
    reservedAt: { type: Date, default: Date.now },
    expiresAt: {
      type: Date,
      default: () => {
        const d = new Date();
        d.setDate(d.getDate() + 7);
        return d;
      },
    },
    approvedAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
    notifiedAt: { type: Date, default: null },

    // Queue management
    position: { type: Number, default: 1 },

    // Status lifecycle:
    //   pending  → approved / rejected / cancelled
    //   approved → completed / cancelled
    //   notified → approved / cancelled  (after librarian notifies member)
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "cancelled", "completed", "notified"],
      default: "pending",
    },

    // Rejection reason (optional)
    rejectionReason: { type: String, default: "" },

    // General notes
    notes: { type: String, default: "" },
  },
  { timestamps: true }
);

// Index for efficient book-queue lookups
reservationSchema.index({ bookId: 1, status: 1, position: 1 });
// Index for member lookups
reservationSchema.index({ memberId: 1, status: 1 });

module.exports = mongoose.model("Reservation", reservationSchema);
