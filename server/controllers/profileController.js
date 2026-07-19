const profileService = require("../services/profileService");

/**
 * GET /api/profile
 * Returns the authenticated user's profile.
 */
async function getProfile(req, res, next) {
  try {
    const data = await profileService.getProfile(req.user._id);
    res.json(data);
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/profile
 * Updates the authenticated user's profile.
 */
async function updateProfile(req, res, next) {
  try {
    const data = await profileService.updateProfile(req.user._id, req.body);
    res.json({ message: "Profile updated successfully.", user: data.user });
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({ error: err.message });
    }
    next(err);
  }
}

/**
 * PUT /api/profile/change-password
 * Changes the authenticated user's password.
 */
async function changePassword(req, res, next) {
  try {
    const { currentPassword, newPassword } = req.body;
    const errors = {};
    if (!currentPassword) errors.currentPassword = "Current password is required.";
    if (!newPassword) errors.newPassword = "New password is required.";
    else if (newPassword.length < 6) errors.newPassword = "New password must be at least 6 characters.";

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ error: "Validation failed.", errors });
    }

    const result = await profileService.changePassword(req.user._id, {
      currentPassword,
      newPassword,
    });
    res.json(result);
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({ error: err.message });
    }
    next(err);
  }
}

module.exports = {
  getProfile,
  updateProfile,
  changePassword,
};