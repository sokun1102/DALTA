import mongoose from "mongoose";
import dotenv from "dotenv";
import Product from "./src/models/Product.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Kết nối MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(async () => {
  console.log("✅ MongoDB connected\n");
  
  // Đường dẫn thư mục uploads
  const uploadDir = path.join(__dirname, "src", "uploads", "products");
  
  if (!fs.existsSync(uploadDir)) {
    console.log("❌ Thư mục uploads không tồn tại!");
    await mongoose.connection.close();
    process.exit(1);
  }
  
  // Lấy tất cả file ảnh có sẵn
  const imageFiles = fs.readdirSync(uploadDir).filter(file => {
    const ext = path.extname(file).toLowerCase();
    return ['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(ext);
  });
  
  if (imageFiles.length === 0) {
    console.log("⚠️  Không có file ảnh nào trong thư mục uploads!");
    await mongoose.connection.close();
    process.exit(0);
  }
  
  console.log(`📁 Tìm thấy ${imageFiles.length} file ảnh:\n`);
  imageFiles.forEach((file, index) => {
    console.log(`   ${index + 1}. ${file}`);
  });
  console.log();
  
  // Lấy tất cả products chưa có ảnh local (có imageUrl là URL internet)
  const products = await Product.find({
    imageUrl: { $regex: /^https?:\/\// }
  }).sort({ createdAt: 1 }); // Sắp xếp theo thời gian tạo (cũ nhất trước)
  
  console.log(`📦 Tìm thấy ${products.length} sản phẩm đang dùng URL internet\n`);
  
  if (products.length === 0) {
    console.log("✅ Tất cả sản phẩm đã có ảnh local hoặc không có ảnh!");
    await mongoose.connection.close();
    process.exit(0);
  }
  
  // Map file ảnh với sản phẩm
  const mappingCount = Math.min(imageFiles.length, products.length);
  let mappedCount = 0;
  
  console.log("=".repeat(60));
  console.log("🔄 BẮT ĐẦU MAP ẢNH VỚI SẢN PHẨM:");
  console.log("=".repeat(60));
  console.log();
  
  for (let i = 0; i < mappingCount; i++) {
    const imageFile = imageFiles[i];
    const product = products[i];
    
    // Tạo đường dẫn mới cho ảnh
    const newImageUrl = `/uploads/products/${imageFile}`;
    
    // Cập nhật imageUrl của sản phẩm
    product.imageUrl = newImageUrl;
    await product.save();
    
    mappedCount++;
    
    console.log(`✅ [${mappedCount}/${mappingCount}] Đã map ảnh "${imageFile}" với sản phẩm:`);
    console.log(`   - Tên: ${product.name}`);
    console.log(`   - SKU: ${product.sku}`);
    console.log(`   - ID: ${product._id}`);
    console.log(`   - ImageUrl mới: ${newImageUrl}`);
    console.log();
  }
  
  console.log("=".repeat(60));
  console.log("📊 KẾT QUẢ:");
  console.log("=".repeat(60));
  console.log(`✅ Đã map ${mappedCount} sản phẩm với ảnh`);
  
  if (imageFiles.length > products.length) {
    const unusedImages = imageFiles.slice(products.length);
    console.log(`\n📌 Còn ${unusedImages.length} file ảnh chưa được sử dụng:`);
    unusedImages.forEach(file => {
      console.log(`   - ${file}`);
    });
    console.log("\n💡 Bạn có thể upload ảnh mới qua Postman cho các sản phẩm còn lại.");
  } else if (products.length > imageFiles.length) {
    const remainingProducts = products.length - imageFiles.length;
    console.log(`\n📌 Còn ${remainingProducts} sản phẩm chưa có ảnh local.`);
    console.log("💡 Bạn có thể upload ảnh mới qua Postman cho các sản phẩm này.");
  }
  
  console.log("\n");
  
  // Đóng kết nối
  await mongoose.connection.close();
  console.log("✅ Đã đóng kết nối MongoDB");
  process.exit(0);
})
.catch((err) => {
  console.error("❌ MongoDB connection error:", err);
  process.exit(1);
});

