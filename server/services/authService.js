const User = require("../models/User");
const Member = require("../models/Member");
const jwt = require("jsonwebtoken");

/**
 * Generate a unique member ID.
 * Format: STU-YYYY-XXXX (student) or STF-YYYY-XXXX (staff)
 */
async function generateMemberId(type = "student") {
  const year = new Date().getFullYear();
  const prefix = type === "staff" ? "STF" : "STU";
  
  // Find the highest existing member ID with the same prefix and year
  const lastMember = await Member.findOne({
    id: { $regex: `^${prefix}-${year}-` },
  })
    .sort({ id: -1 })
    .lean();

  let nextNum = 1;
  if (lastMember) {
    const parts = lastMember.id.split("-");
    nextNum = parseInt(parts[2], 10) + 1;
  }

  return `${prefix}-${year}-${String(nextNum).padStart(4, "0")}`;
}

/**
 * Register a new user (always role = LibraryMember).
 * Auto-creates a Member record and links it via memberId.
 */
async function register({ fullName, email, password }) {
  const existing = await User.findOne({ email });
  if (existing) {
    const error = new Error("A user with this email already exists.");
    error.statusCode = 409;
    throw error;
  }

  const memberType = "student";
  const department = "";
  const memberId = await generateMemberId(memberType);

  // Create the Member record (backward compatibility with Librarian/Admin features)
  await Member.create({
    id: memberId,
    name: fullName,
    type: memberType,
    department,
    email,
    activeLoans: 0,
  });

  const user = await User.create({
    fullName,
    email,
    password,
    role: "LibraryMember",
    memberId,
    memberType,
    department,
  });

  return { user };
}

/**
 * Login: authenticate by email + password, return user + token.
 */
async function login({ email, password }) {
  const user = await User.findOne({ email });
  if (!user) {
    const error = new Error("Invalid email or password.");
    error.statusCode = 401;
    throw error;
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    const error = new Error("Invalid email or password.");
    error.statusCode = 401;
    throw error;
  }

  const token = generateToken(user);
  return { user, token };
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

/**
 * Generate a JWT for a user.
 */
function generateToken(user) {
  return jwt.sign(
    { id: user._id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );
}

module.exports = {
  register,
  login,
  changePassword,
  generateToken,
};