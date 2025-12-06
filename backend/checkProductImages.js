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
  
  // Lấy tất cả products
  const products = await Product.find();
  console.log(`📦 Tổng số sản phẩm: ${products.length}\n`);
  
  // Đường dẫn thư mục uploads
  const uploadDirs = [
    path.join(__dirname, "src", "uploads", "products"),
    path.join(__dirname, "uploads", "products"),
    path.join(__dirname, "backend", "uploads", "products")
  ];
  
  let productsWithImages = 0;
  let productsWithValidImages = 0;
  let productsWithInvalidImages = 0;
  let productsWithoutImages = 0;
  
  const invalidProducts = [];
  const validProducts = [];
  
  for (const product of products) {
    if (!product.imageUrl) {
      productsWithoutImages++;
      continue;
    }
    
    productsWithImages++;
    
    // Lấy tên file từ imageUrl (ví dụ: /uploads/products/prod_123.jpg -> prod_123.jpg)
    const filename = product.imageUrl.split('/').pop();
    
    // Kiểm tra file có tồn tại không
    let fileExists = false;
    let foundPath = null;
    
    for (const uploadDir of uploadDirs) {
      const filePath = path.join(uploadDir, filename);
      if (fs.existsSync(filePath)) {
        fileExists = true;
        foundPath = filePath;
        break;
      }
    }
    
    if (fileExists) {
      productsWithValidImages++;
      validProducts.push({
        id: product._id,
        name: product.name,
        sku: product.sku,
        imageUrl: product.imageUrl,
        filePath: foundPath
      });
    } else {
      productsWithInvalidImages++;
      invalidProducts.push({
        id: product._id,
        name: product.name,
        sku: product.sku,
        imageUrl: product.imageUrl,
        filename: filename
      });
    }
  }
  
  // Hiển thị kết quả
  console.log("=".repeat(60));
  console.log("📊 BÁO CÁO KIỂM TRA ẢNH SẢN PHẨM");
  console.log("=".repeat(60));
  console.log(`✅ Sản phẩm có ảnh hợp lệ: ${productsWithValidImages}`);
  console.log(`❌ Sản phẩm có ảnh không tồn tại: ${productsWithInvalidImages}`);
  console.log(`📭 Sản phẩm không có ảnh: ${productsWithoutImages}`);
  console.log(`📦 Tổng số sản phẩm: ${products.length}\n`);
  
  if (invalidProducts.length > 0) {
    console.log("=".repeat(60));
    console.log("❌ DANH SÁCH SẢN PHẨM CÓ ẢNH KHÔNG TỒN TẠI:");
    console.log("=".repeat(60));
    invalidProducts.forEach((p, index) => {
      console.log(`\n${index + 1}. ${p.name} (SKU: ${p.sku})`);
      console.log(`   ID: ${p.id}`);
      console.log(`   ImageUrl: ${p.imageUrl}`);
      console.log(`   File không tìm thấy: ${p.filename}`);
    });
  }
  
  if (validProducts.length > 0 && invalidProducts.length > 0) {
    console.log("\n" + "=".repeat(60));
    console.log("✅ DANH SÁCH SẢN PHẨM CÓ ẢNH HỢP LỆ (mẫu 5 sản phẩm đầu):");
    console.log("=".repeat(60));
    validProducts.slice(0, 5).forEach((p, index) => {
      console.log(`\n${index + 1}. ${p.name} (SKU: ${p.sku})`);
      console.log(`   ImageUrl: ${p.imageUrl}`);
      console.log(`   File path: ${p.filePath}`);
    });
    if (validProducts.length > 5) {
      console.log(`\n... và ${validProducts.length - 5} sản phẩm khác`);
    }
  }
  
  // Kiểm tra các file trong thư mục uploads
  console.log("\n" + "=".repeat(60));
  console.log("📁 KIỂM TRA FILE TRONG THƯ MỤC UPLOADS:");
  console.log("=".repeat(60));
  
  const existingFiles = [];
  for (const uploadDir of uploadDirs) {
    if (fs.existsSync(uploadDir)) {
      const files = fs.readdirSync(uploadDir);
      if (files.length > 0) {
        console.log(`\n📂 ${uploadDir}:`);
        files.forEach(file => {
          const filePath = path.join(uploadDir, file);
          const stats = fs.statSync(filePath);
          console.log(`   - ${file} (${(stats.size / 1024).toFixed(2)} KB)`);
          existingFiles.push({
            filename: file,
            path: filePath,
            size: stats.size
          });
        });
      }
    }
  }
  
  if (existingFiles.length === 0) {
    console.log("\n⚠️  Không có file ảnh nào trong thư mục uploads!");
    console.log("💡 Bạn cần upload ảnh mới qua Postman hoặc thêm imageUrl thủ công.");
  } else {
    console.log(`\n📊 Tổng số file ảnh có sẵn: ${existingFiles.length}`);
    
    // Kiểm tra xem có file nào không được sử dụng không
    const usedFilenames = validProducts.map(p => p.imageUrl.split('/').pop());
    const unusedFiles = existingFiles.filter(f => !usedFilenames.includes(f.filename));
    
    if (unusedFiles.length > 0) {
      console.log(`\n📌 Có ${unusedFiles.length} file ảnh chưa được sử dụng:`);
      unusedFiles.forEach(f => {
        console.log(`   - ${f.filename}`);
      });
    }
  }
  
  console.log("\n" + "=".repeat(60));
  console.log("💡 KẾT LUẬN:");
  console.log("=".repeat(60));
  
  if (invalidProducts.length > 0) {
    console.log(`\n❌ Có ${invalidProducts.length} sản phẩm có ảnh bị mất.`);
    console.log("   Bạn có thể:");
    console.log("   1. Upload ảnh mới qua Postman (POST /api/products/:id/image)");
    console.log("   2. Cập nhật imageUrl thủ công qua API (PUT /api/products/:id)");
    console.log("   3. Chạy script map lại ảnh nếu có file ảnh mới");
  } else if (productsWithoutImages > 0) {
    console.log(`\n📭 Có ${productsWithoutImages} sản phẩm chưa có ảnh.`);
    console.log("   Bạn có thể upload ảnh qua Postman (POST /api/products/:id/image)");
  } else {
    console.log("\n✅ Tất cả sản phẩm đều có ảnh hợp lệ!");
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

