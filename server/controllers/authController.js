const authService = require("../services/authService");

/**
 * POST /api/auth/register
 * Register a new LibraryMember
 */
async function register(req, res, next) {
  try {
    const { fullName, email, password } = req.body;

    // Validation
    const errors = {};
    if (!fullName || !fullName.trim()) errors.fullName = "Full name is required.";
    if (!email || !email.trim()) errors.email = "Email is required.";
    if (!password) errors.password = "Password is required.";
    else if (password.length < 6) errors.password = "Password must be at least 6 characters.";

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ error: "Validation failed.", errors });
    }

    const result = await authService.register({ fullName, email, password });
    res.status(201).json({ message: "Registration successful. Please log in.", user: result.user });
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({ error: err.message });
    }
    next(err);
  }
}

/**
 * POST /api/auth/login
 * Authenticate and return JWT
 */
async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    const errors = {};
    if (!email) errors.email = "Email is required.";
    if (!password) errors.password = "Password is required.";

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ error: "Validation failed.", errors });
    }

    const result = await authService.login({ email, password });
    res.json({
      message: "Login successful.",
      user: result.user,
      token: result.token,
    });
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({ error: err.message });
    }
    next(err);
  }
}

/**
 * GET /api/auth/me
 * Return current authenticated user
 */
async function getMe(req, res) {
  res.json({ user: req.user });
}

/**
 * POST /api/auth/logout
 * Client-side logout (clear token on client)
 */
async function logout(req, res) {
  res.json({ message: "Logged out successfully." });
}

/**
 * POST /api/auth/change-password
 * Change current user's password
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

    const result = await authService.changePassword(req.user._id, {
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
  register,
  login,
  getMe,
  logout,
  changePassword,
};