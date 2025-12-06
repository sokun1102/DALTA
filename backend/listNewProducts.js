import mongoose from "mongoose";
import dotenv from "dotenv";
import Product from "./src/models/Product.js";
import Category from "./src/models/Category.js";

dotenv.config();

// Kết nối MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(async () => {
  console.log("✅ MongoDB connected\n");
  
  // Lấy tất cả sản phẩm mới (không có ảnh)
  const newProducts = await Product.find({
    $or: [
      { imageUrl: { $exists: false } },
      { imageUrl: null },
      { imageUrl: "" }
    ]
  }).populate('category_id', 'name').sort({ createdAt: -1 });
  
  console.log("=".repeat(60));
  console.log("📦 DANH SÁCH SẢN PHẨM CHƯA CÓ ẢNH");
  console.log("=".repeat(60));
  console.log(`Tổng số: ${newProducts.length} sản phẩm\n`);
  
  // Nhóm theo category
  const byCategory = {};
  newProducts.forEach(p => {
    const catName = p.category_id?.name || "Chưa phân loại";
    if (!byCategory[catName]) {
      byCategory[catName] = [];
    }
    byCategory[catName].push(p);
  });
  
  // Hiển thị theo category
  for (const [categoryName, products] of Object.entries(byCategory)) {
    console.log(`\n📂 ${categoryName} (${products.length} sản phẩm):`);
    console.log("-".repeat(60));
    products.forEach((p, index) => {
      console.log(`\n${index + 1}. ${p.name}`);
      console.log(`   SKU: ${p.sku}`);
      console.log(`   ID: ${p._id}`);
      console.log(`   Giá: ${p.price.toLocaleString('vi-VN')} VNĐ`);
      console.log(`   Tồn kho: ${p.in_stock}`);
      console.log(`   Upload ảnh: POST /api/products/${p._id}/image`);
    });
  }
  
  console.log("\n" + "=".repeat(60));
  console.log("💡 HƯỚNG DẪN UPLOAD ẢNH:");
  console.log("=".repeat(60));
  console.log("1. Đăng nhập để lấy token:");
  console.log("   POST /api/auth/login");
  console.log("   Body: { \"email\": \"admin@example.com\", \"password\": \"123456\" }");
  console.log("\n2. Upload ảnh cho từng sản phẩm:");
  console.log("   POST /api/products/:id/image");
  console.log("   Headers: Authorization: Bearer <token>");
  console.log("   Body: form-data, key: image, type: File");
  console.log();
  
  // Đóng kết nối
  await mongoose.connection.close();
  console.log("✅ Đã đóng kết nối MongoDB");
  process.exit(0);
})
.catch((err) => {
  console.error("❌ MongoDB connection error:", err);
  process.exit(1);
});

