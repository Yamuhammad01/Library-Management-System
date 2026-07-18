const jwt = require("jsonwebtoken");
const User = require("../models/User");

/**
 * Middleware: Authenticate user via JWT from Authorization header.
 * Attaches `req.user` with the user document (without password).
 */
async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Authentication required. No token provided." });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ error: "Authentication failed. User not found." });
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Token expired. Please log in again." });
    }
    if (err.name === "JsonWebTokenError") {
      return res.status(401).json({ error: "Invalid token." });
    }
    return res.status(500).json({ error: "Authentication error." });
  }
}

/**
 * Middleware: Restrict access to specific roles.
 * Must be used after `authenticate`.
 * @param  {...string} roles - Allowed roles (e.g., "Admin", "Librarian")
 */
function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required." });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: "Forbidden. You do not have permission to access this resource.",
        requiredRoles: roles,
        yourRole: req.user.role,
      });
    }
    next();
  };
}

module.exports = { authenticate, authorize };