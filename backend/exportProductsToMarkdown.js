import mongoose from "mongoose";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import Product from "./src/models/Product.js";
import Category from "./src/models/Category.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const MONGODB_URI =
  process.env.MONGO_URI ||
  process.env.MONGODB_URI ||
  "mongodb://localhost:27017/ecommerce";

async function exportProductsToMarkdown() {
  try {
    console.log("🔌 Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB\n");

    // Lấy tất cả products với populate category
    const products = await Product.find()
      .populate("category_id", "name")
      .sort({ "category_id.name": 1, name: 1 });

    console.log(`📦 Found ${products.length} products\n`);

    // Nhóm theo category
    const productsByCategory = {};
    products.forEach((product) => {
      const categoryName = product.category_id?.name || "Chưa phân loại";
      if (!productsByCategory[categoryName]) {
        productsByCategory[categoryName] = [];
      }
      productsByCategory[categoryName].push(product);
    });

    // Tạo markdown content
    let markdown = "# DATASET SẢN PHẨM - TỪ DATABASE\n\n";
    markdown += `*Xuất ngày: ${new Date().toLocaleString("vi-VN")}*\n\n`;
    markdown += `**Tổng số sản phẩm:** ${products.length} sản phẩm\n\n`;
    markdown += "---\n\n";

    // Đếm số lượng theo category
    const categoryCounts = {};
    Object.keys(productsByCategory).forEach((cat) => {
      categoryCounts[cat] = productsByCategory[cat].length;
    });

    // Emoji cho từng category
    const categoryEmojis = {
      "Điện thoại": "📱",
      "Tablet": "📱",
      "Laptop": "💻",
      "Phụ kiện": "🎧",
      "Chưa phân loại": "❓",
    };

    let productNumber = 1;

    // Xuất theo từng category
    for (const [categoryName, categoryProducts] of Object.entries(
      productsByCategory
    )) {
      const emoji = categoryEmojis[categoryName] || "📦";
      markdown += `## ${emoji} ${categoryName.toUpperCase()}\n\n`;
      markdown += `*${categoryProducts.length} sản phẩm*\n\n`;

      categoryProducts.forEach((product) => {
        markdown += `### ${productNumber}. ${product.name}\n\n`;
        markdown += `- **Tên:** ${product.name}\n`;
        markdown += `- **Mô tả:** ${product.description}\n`;
        markdown += `- **Giá:** ${product.price.toLocaleString("vi-VN")} VNĐ\n`;
        markdown += `- **SKU:** ${product.sku}\n`;
        markdown += `- **Tồn kho:** ${product.in_stock} sản phẩm\n`;

        if (product.variations && product.variations.length > 0) {
          markdown += `- **Biến thể:**\n`;
          product.variations.forEach((variation) => {
            const parts = [];
            if (variation.color) parts.push(variation.color);
            if (variation.size) parts.push(variation.size);
            if (variation.ram) parts.push(`${variation.ram} RAM`);
            const variationDesc = parts.join(" - ") || "Default";
            markdown += `  - ${variationDesc}: ${variation.stock || 0} sản phẩm\n`;
          });
        } else {
          markdown += `- **Biến thể:** Không có\n`;
        }

        if (product.imageUrl) {
          markdown += `- **Ảnh:** ${product.imageUrl}\n`;
        }

        markdown += `\n`;
        productNumber++;
      });

      markdown += "---\n\n";
    }

    // Tổng kết
    markdown += "## 📊 TỔNG KẾT\n\n";
    markdown += `- **Tổng số sản phẩm:** ${products.length} sản phẩm\n\n`;
    Object.entries(categoryCounts).forEach(([cat, count]) => {
      const emoji = categoryEmojis[cat] || "📦";
      markdown += `- **${emoji} ${cat}:** ${count} sản phẩm\n`;
    });

    markdown += "\n---\n\n";
    markdown += `*Dataset được xuất từ database vào: ${new Date().toLocaleString("vi-VN")}*\n`;

    // Ghi file
    const outputPath = path.join(__dirname, "PRODUCTS_DATASET.md");
    fs.writeFileSync(outputPath, markdown, "utf-8");

    console.log("=".repeat(60));
    console.log("📤 EXPORT PRODUCTS TO MARKDOWN");
    console.log("=".repeat(60));
    console.log(`✅ Đã export ${products.length} sản phẩm`);
    console.log(`📂 File: ${outputPath}`);
    console.log("\n📊 Theo danh mục:");
    Object.entries(categoryCounts).forEach(([cat, count]) => {
      console.log(`   - ${cat}: ${count} sản phẩm`);
    });
    console.log("=".repeat(60));

    await mongoose.disconnect();
    console.log("\n✅ Disconnected from MongoDB");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error exporting products:", error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

exportProductsToMarkdown();

