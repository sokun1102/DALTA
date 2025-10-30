import User from "../models/User.js";

// Middleware to check if user is admin
export default async function adminAuth(req, res, next) {
  try {
    if (!req.userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (user.role !== 'admin') {
      return res.status(403).json({ success: false, message: "Access denied. Admin role required." });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}
