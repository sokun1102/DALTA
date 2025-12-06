import mongoose from "mongoose";
import dotenv from "dotenv";
import Product from "./src/models/Product.js";

dotenv.config();

// Kết nối MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(async () => {
  console.log("✅ MongoDB connected\n");
  
  // Tìm tất cả products có imageUrl là URL internet (bắt đầu bằng http:// hoặc https://)
  const products = await Product.find({
    imageUrl: { $regex: /^https?:\/\// }
  });
  
  console.log(`📦 Tìm thấy ${products.length} sản phẩm đang dùng URL internet\n`);
  
  if (products.length === 0) {
    console.log("✅ Không có sản phẩm nào đang dùng URL internet!");
    await mongoose.connection.close();
    process.exit(0);
  }
  
  // Hiển thị danh sách sản phẩm sẽ được xóa URL
  console.log("=".repeat(60));
  console.log("📋 DANH SÁCH SẢN PHẨM SẼ XÓA URL INTERNET:");
  console.log("=".repeat(60));
  products.forEach((p, index) => {
    console.log(`${index + 1}. ${p.name} (SKU: ${p.sku})`);
    console.log(`   URL hiện tại: ${p.imageUrl}`);
  });
  console.log();
  
  // Xóa imageUrl (set về null hoặc undefined)
  let clearedCount = 0;
  
  console.log("=".repeat(60));
  console.log("🔄 BẮT ĐẦU XÓA URL INTERNET:");
  console.log("=".repeat(60));
  console.log();
  
  for (const product of products) {
    product.imageUrl = undefined; // hoặc null
    await product.save();
    clearedCount++;
    
    console.log(`✅ [${clearedCount}/${products.length}] Đã xóa URL của "${product.name}"`);
  }
  
  console.log();
  console.log("=".repeat(60));
  console.log("📊 KẾT QUẢ:");
  console.log("=".repeat(60));
  console.log(`✅ Đã xóa URL internet của ${clearedCount} sản phẩm`);
  console.log(`\n💡 Bây giờ bạn có thể upload ảnh local qua Postman:`);
  console.log(`   POST /api/products/:id/image`);
  console.log(`\n   Hoặc cập nhật imageUrl thủ công:`);
  console.log(`   PUT /api/products/:id`);
  console.log(`   Body: { "imageUrl": "/uploads/products/ten-file.jpg" }`);
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

