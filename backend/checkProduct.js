import mongoose from "mongoose";
import Product from "./src/models/Product.js";
import dotenv from "dotenv";

dotenv.config();

const productId = "68e909ba5b489ac371460385";

async function checkProduct() {
  try {
    // Kết nối database
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || "mongodb://localhost:27017/ecommerce";
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ Connected to MongoDB");

    // Tìm product
    const product = await Product.findById(productId);
    
    if (!product) {
      console.log(`❌ Product với ID ${productId} không tồn tại`);
      process.exit(1);
    }

    console.log("\n📦 THÔNG TIN PRODUCT:");
    console.log("=".repeat(50));
    console.log(`ID: ${product._id}`);
    console.log(`Tên: ${product.name}`);
    console.log(`SKU: ${product.sku}`);
    console.log(`Giá: ${product.price?.toLocaleString('vi-VN')}đ`);
    console.log(`Stock tổng (in_stock): ${product.in_stock}`);
    
    console.log("\n🎨 VARIATIONS:");
    console.log("=".repeat(50));
    if (!product.variations || product.variations.length === 0) {
      console.log("⚠️  Product không có variations");
    } else {
      product.variations.forEach((variation, index) => {
        console.log(`\nVariation ${index + 1}:`);
        console.log(`  - Màu: ${variation.color || 'N/A'}`);
        console.log(`  - Size: ${variation.size || 'N/A'}`);
        console.log(`  - Stock: ${variation.stock || 0}`);
      });
      
      // Tính tổng stock từ variations
      const totalVariationStock = product.variations.reduce((sum, v) => sum + (v.stock || 0), 0);
      console.log(`\n📊 Tổng stock từ variations: ${totalVariationStock}`);
      console.log(`📊 Stock tổng (in_stock): ${product.in_stock}`);
      
      // Kiểm tra sự khác biệt
      if (totalVariationStock !== product.in_stock) {
        console.log(`\n⚠️  CẢNH BÁO: Stock không khớp!`);
        console.log(`   - Tổng stock từ variations: ${totalVariationStock}`);
        console.log(`   - in_stock trong database: ${product.in_stock}`);
        console.log(`   - Chênh lệch: ${Math.abs(totalVariationStock - product.in_stock)}`);
      } else {
        console.log(`\n✅ Stock khớp nhau`);
      }
    }

    console.log("\n" + "=".repeat(50));
    console.log("📋 DỮ LIỆU ĐẦY ĐỦ:");
    console.log(JSON.stringify(product.toObject(), null, 2));

    await mongoose.disconnect();
    console.log("\n✅ Đã ngắt kết nối database");
    
  } catch (error) {
    console.error("❌ Lỗi:", error);
    process.exit(1);
  }
}

checkProduct();

