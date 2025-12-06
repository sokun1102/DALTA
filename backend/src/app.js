import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.js";
import path from "path";
import { fileURLToPath } from "url";
import productRoutes from "./routes/products.js";
import categoryRoutes from "./routes/categories.js";
import cartRoutes from "./routes/cart.js";
import orderRoutes from "./routes/orders.js";
import paymentMethodRoutes from "./routes/paymentMethods.js";
import reviewRoutes from "./routes/reviews.js";

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Static uploads
const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Serve files saved under backend/src/uploads (your current files live here)
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
// Serve files saved under backend/uploads
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));
// Legacy fallback: in case files were saved under backend/backend/uploads previously
app.use("/uploads", express.static(path.join(__dirname, "..", "backend", "uploads")));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/payment-methods", paymentMethodRoutes);
app.use("/api/reviews", reviewRoutes);

// Kết nối MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log("✅ MongoDB connected"))
.catch((err) => console.error("❌ MongoDB connection error:", err));

export default app;
