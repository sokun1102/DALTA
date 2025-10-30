import jwt from "jsonwebtoken";
import User from "../models/User.js";

// Verify JWT and attach user id to request
export default async function auth(req, res, next) {
  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.substring(7) : null;
    if (!token) {
      return res.status(401).json({ success: false, message: "No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;
    
    // Lấy thông tin user để truyền vào req
    const user = await User.findById(decoded.id);
    req.user = user;
    
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: "Invalid or expired token" });
  }
}


