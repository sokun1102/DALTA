import jwt from "jsonwebtoken";

export const authMiddleware = (req, res, next) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    return res.status(401).json({ message: "Access denied, no token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // lưu thông tin user vào request để dùng tiếp
    next(); // cho đi tiếp
  } catch (err) {
    res.status(401).json({ message: "Invalid or expired token" });
  }
};
