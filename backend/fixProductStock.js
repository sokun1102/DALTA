import mongoose from "mongoose";
import Product from "./src/models/Product.js";
import dotenv from "dotenv";

dotenv.config();

async function fixProductStock() {
  try {
    // Kết nối database
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || "mongodb://localhost:27017/ecommerce";
    await mongoose.connect(mongoUri);
    console.log("✅ Connected to MongoDB\n");

    // Tìm tất cả products
    const products = await Product.find();
    console.log(`📦 Đang kiểm tra ${products.length} products...\n`);

    let fixedCount = 0;

    for (const product of products) {
      if (product.variations && product.variations.length > 0) {
        // Tính tổng stock từ variations
        const totalVariationStock = product.variations.reduce((sum, v) => sum + (v.stock || 0), 0);
        
        // Kiểm tra sự khác biệt
        if (totalVariationStock !== product.in_stock) {
          console.log(`\n🔧 Sửa product: ${product.name} (ID: ${product._id})`);
          console.log(`   - Stock cũ (in_stock): ${product.in_stock}`);
          console.log(`   - Tổng stock từ variations: ${totalVariationStock}`);
          console.log(`   - Chênh lệch: ${Math.abs(totalVariationStock - product.in_stock)}`);
          
          // Cập nhật in_stock
          product.in_stock = totalVariationStock;
          await product.save();
          
          console.log(`   ✅ Đã cập nhật in_stock thành: ${product.in_stock}`);
          fixedCount++;
        }
      }
    }

    console.log(`\n${"=".repeat(60)}`);
    console.log(`📊 TÓM TẮT:`);
    console.log(`Tổng số products đã kiểm tra: ${products.length}`);
    console.log(`Số products đã sửa: ${fixedCount}`);
    
    if (fixedCount === 0) {
      console.log(`✅ Tất cả products đều đúng!`);
    }

    await mongoose.disconnect();
    console.log("\n✅ Đã ngắt kết nối database");
    
  } catch (error) {
    console.error("❌ Lỗi:", error);
    process.exit(1);
  }
}

fixProductStock();

