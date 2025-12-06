import jwt from "jsonwebtoken";
import User from "../models/User.js";

// Optional auth middleware - không bắt buộc token, nhưng sẽ gán userId nếu có token hợp lệ
export default async function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization || "";
    console.log("🔐 optionalAuth - Authorization header:", authHeader ? "Present" : "Missing");
    const token = authHeader.startsWith("Bearer ") ? authHeader.substring(7) : null;
    
    if (!token) {
      // Không có token, tiếp tục request nhưng không có userId
      console.log("⚠️ optionalAuth - No token found");
      req.userId = null;
      req.user = null;
      return next();
    }

    // Có token, kiểm tra và decode
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.userId = decoded.id;
      console.log("✅ optionalAuth - Token verified, userId:", decoded.id);
      
      // Lấy thông tin user để truyền vào req
      const user = await User.findById(decoded.id);
      req.user = user;
      console.log("✅ optionalAuth - User found:", user?.email);
    } catch (err) {
      // Token không hợp lệ, tiếp tục nhưng không có userId
      console.log("❌ optionalAuth - Token verification failed:", err.message);
      req.userId = null;
      req.user = null;
    }
    
    next();
  } catch (err) {
    // Lỗi khác, tiếp tục nhưng không có userId
    req.userId = null;
    req.user = null;
    next();
  }
}

