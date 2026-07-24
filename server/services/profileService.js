const User = require("../models/User");

/**
 * Get profile for the authenticated user.
 */
async function getProfile(userId) {
  const user = await User.findById(userId).lean();
  if (!user) {
    const error = new Error("User not found.");
    error.statusCode = 404;
    throw error;
  }
  return { user };
}

/**
 * Update profile fields for the authenticated user.
 * Allowed fields: fullName, email, phoneNumber, department, memberType, profilePicture
 */
async function updateProfile(userId, updates) {
  const user = await User.findById(userId);
  if (!user) {
    const error = new Error("User not found.");
    error.statusCode = 404;
    throw error;
  }

  // Allowed updatable fields
  const allowed = ["fullName", "phoneNumber", "department", "memberType", "profilePicture"];

  // Email requires uniqueness check
  if (updates.email !== undefined && updates.email !== user.email) {
    const existing = await User.findOne({ email: updates.email, _id: { $ne: userId } });
    if (existing) {
      const error = new Error("A user with this email already exists.");
      error.statusCode = 409;
      throw error;
    }
    allowed.push("email");
  }

  for (const field of allowed) {
    if (updates[field] !== undefined) {
      user[field] = updates[field];
    }
  }

  await user.save();
  return { user };
}

/**
 * Upload or replace profile picture (base64-encoded).
 */
async function uploadAvatar(userId, avatarBase64) {
  const user = await User.findById(userId);
  if (!user) {
    const error = new Error("User not found.");
    error.statusCode = 404;
    throw error;
  }

  // Validate base64 format
  const base64Pattern = /^data:image\/(jpeg|jpg|png|gif|webp);base64,/;
  if (!base64Pattern.test(avatarBase64)) {
    const error = new Error("Avatar must be a valid base64-encoded image (JPEG, PNG, GIF, or WebP).");
    error.statusCode = 400;
    throw error;
  }

  // Check size (5MB max for base64 string)
  const base64Data = avatarBase64.split(",")[1] || "";
  if (base64Data.length > 5 * 1024 * 1024) {
    const error = new Error("Avatar image must not exceed 5MB.");
    error.statusCode = 400;
    throw error;
  }

  user.profilePicture = avatarBase64;
  await user.save();

  return { user };
}

/**
 * Change password for authenticated user.
 */
async function changePassword(userId, { currentPassword, newPassword }) {
  const user = await User.findById(userId);
  if (!user) {
    const error = new Error("User not found.");
    error.statusCode = 404;
    throw error;
  }

  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) {
    const error = new Error("Current password is incorrect.");
    error.statusCode = 400;
    throw error;
  }

  user.password = newPassword;
  await user.save();

  return { message: "Password changed successfully." };
}

module.exports = {
  getProfile,
  updateProfile,
  uploadAvatar,
  changePassword,
};
