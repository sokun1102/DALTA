import mongoose from "mongoose";
import Product from "./src/models/Product.js";
import dotenv from "dotenv";

dotenv.config();

async function checkAllProducts() {
  try {
    // Kết nối database
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || "mongodb://localhost:27017/ecommerce";
    await mongoose.connect(mongoUri);
    console.log("✅ Connected to MongoDB\n");

    // Tìm tất cả products
    const products = await Product.find();
    console.log(`📦 Tổng số products: ${products.length}\n`);

    const issues = [];

    products.forEach((product, index) => {
      console.log(`\n${"=".repeat(60)}`);
      console.log(`Product ${index + 1}: ${product.name} (ID: ${product._id})`);
      console.log(`SKU: ${product.sku}`);
      console.log(`Stock tổng (in_stock): ${product.in_stock}`);
      
      if (product.variations && product.variations.length > 0) {
        console.log(`\nVariations:`);
        let totalVariationStock = 0;
        
        product.variations.forEach((variation, vIndex) => {
          const stock = variation.stock || 0;
          totalVariationStock += stock;
          console.log(`  ${vIndex + 1}. Màu: ${variation.color || 'N/A'}, Size: ${variation.size || 'N/A'}, Stock: ${stock}`);
        });
        
        console.log(`\nTổng stock từ variations: ${totalVariationStock}`);
        console.log(`Stock tổng (in_stock): ${product.in_stock}`);
        
        // Kiểm tra sự khác biệt
        if (totalVariationStock !== product.in_stock) {
          const diff = Math.abs(totalVariationStock - product.in_stock);
          console.log(`⚠️  CẢNH BÁO: Stock không khớp! Chênh lệch: ${diff}`);
          issues.push({
            productId: product._id.toString(),
            productName: product.name,
            in_stock: product.in_stock,
            totalVariationStock: totalVariationStock,
            difference: diff,
            variations: product.variations
          });
        } else {
          console.log(`✅ Stock khớp nhau`);
        }
      } else {
        console.log(`⚠️  Product không có variations`);
      }
    });

    // Tóm tắt
    console.log(`\n\n${"=".repeat(60)}`);
    console.log(`📊 TÓM TẮT:`);
    console.log(`Tổng số products: ${products.length}`);
    console.log(`Số products có vấn đề: ${issues.length}`);
    
    if (issues.length > 0) {
      console.log(`\n⚠️  CÁC PRODUCT CÓ VẤN ĐỀ:`);
      issues.forEach((issue, index) => {
        console.log(`\n${index + 1}. ${issue.productName} (ID: ${issue.productId})`);
        console.log(`   - in_stock: ${issue.in_stock}`);
        console.log(`   - Tổng stock từ variations: ${issue.totalVariationStock}`);
        console.log(`   - Chênh lệch: ${issue.difference}`);
      });
    }

    // Tìm product có ID tương tự
    const targetId = "68e909ba5b489ac371460385";
    console.log(`\n\n🔍 Tìm product có ID: ${targetId}`);
    const targetProduct = products.find(p => p._id.toString().includes(targetId.substring(0, 10)));
    if (targetProduct) {
      console.log(`✅ Tìm thấy product tương tự: ${targetProduct.name} (ID: ${targetProduct._id})`);
    } else {
      console.log(`❌ Không tìm thấy product với ID tương tự`);
    }

    await mongoose.disconnect();
    console.log("\n✅ Đã ngắt kết nối database");
    
  } catch (error) {
    console.error("❌ Lỗi:", error);
    process.exit(1);
  }
}

checkAllProducts();

