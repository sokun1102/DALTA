// scripts/updateCategoriesTech.js
// Script để cập nhật categories cho app bán đồ công nghệ
// Xóa category "Nội thất" và các category không phù hợp
// Chạy: node src/scripts/updateCategoriesTech.js

import mongoose from "mongoose";
import dotenv from "dotenv";
import Category from "../models/Category.js";
import Product from "../models/Product.js";

dotenv.config();

const MONGODB_URI = process.env.MONGO_URI || process.env.MONGODB_URI || "mongodb://localhost:27017/ecommerce";

// Categories phù hợp với đồ công nghệ
const techCategories = [
  "Điện thoại",
  "Laptop",
  "Tablet",
  "Smartwatch",
  "Tai nghe",
  "Loa",
  "Phụ kiện",
  "Gaming",
  "Camera",
  "Màn hình",
  "Bàn phím",
  "Chuột",
];

// Categories cần xóa (không phù hợp với đồ công nghệ)
const categoriesToDelete = [
  "Nội thất",
  "Furniture",
  "Đồ nội thất",
  "Nội thất văn phòng",
];

const updateCategoriesTech = async () => {
  try {
    // Kết nối MongoDB
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ Connected to MongoDB\n");

    console.log("📋 Bắt đầu cập nhật categories...\n");

    // 1. Xóa các categories không phù hợp
    console.log("🗑️  Xóa categories không phù hợp:");
    console.log("=".repeat(60));
    let deletedCount = 0;
    
    for (const categoryName of categoriesToDelete) {
      try {
        const category = await Category.findOne({ name: categoryName });
        if (category) {
          // Kiểm tra xem có products nào đang dùng category này không
          const productsCount = await Product.countDocuments({ category_id: category._id });
          
          if (productsCount > 0) {
            console.log(`  ⚠️  Category "${categoryName}" có ${productsCount} sản phẩm, cần xử lý trước khi xóa`);
            // Chuyển products sang category "Phụ kiện" (hoặc category mặc định)
            const defaultCategory = await Category.findOne({ name: "Phụ kiện" });
            if (defaultCategory) {
              await Product.updateMany(
                { category_id: category._id },
                { category_id: defaultCategory._id }
              );
              console.log(`     → Đã chuyển ${productsCount} sản phẩm sang category "Phụ kiện"`);
            }
          }
          
          await Category.findByIdAndDelete(category._id);
          console.log(`  ✅ Đã xóa: "${categoryName}"`);
          deletedCount++;
        } else {
          console.log(`  ℹ️  Không tìm thấy: "${categoryName}"`);
        }
      } catch (error) {
        console.error(`  ❌ Lỗi khi xóa "${categoryName}":`, error.message);
      }
    }

    console.log(`\n📊 Đã xóa ${deletedCount} categories\n`);

    // 2. Tạo/đảm bảo các categories công nghệ tồn tại
    console.log("➕ Tạo/đảm bảo categories công nghệ:");
    console.log("=".repeat(60));
    let createdCount = 0;
    let existingCount = 0;
    const categoryMap = {};

    for (const categoryName of techCategories) {
      try {
        let category = await Category.findOne({ name: categoryName });
        
        if (!category) {
          category = await Category.create({ name: categoryName });
          console.log(`  ➕ Created: "${categoryName}"`);
          createdCount++;
        } else {
          console.log(`  ℹ️  Found: "${categoryName}"`);
          existingCount++;
        }
        
        categoryMap[categoryName] = category._id;
      } catch (error) {
        console.error(`  ❌ Lỗi khi tạo "${categoryName}":`, error.message);
      }
    }

    console.log(`\n📊 Created: ${createdCount}, Existing: ${existingCount}, Total: ${techCategories.length}\n`);

    // 3. Kiểm tra và báo cáo products không có category hợp lệ
    console.log("🔍 Kiểm tra products:");
    console.log("=".repeat(60));
    
    const allProducts = await Product.find().populate('category_id');
    const invalidProducts = [];
    
    for (const product of allProducts) {
      if (!product.category_id) {
        invalidProducts.push({ product: product.name, issue: "Không có category" });
      } else {
        const categoryName = product.category_id.name || "";
        if (!techCategories.includes(categoryName)) {
          invalidProducts.push({ 
            product: product.name, 
            issue: `Category "${categoryName}" không phù hợp`,
            currentCategory: categoryName
          });
        }
      }
    }

    if (invalidProducts.length > 0) {
      console.log(`  ⚠️  Tìm thấy ${invalidProducts.length} sản phẩm có vấn đề:`);
      invalidProducts.forEach((item, index) => {
        console.log(`     ${index + 1}. ${item.product} - ${item.issue}`);
        if (item.currentCategory) {
          console.log(`        → Chuyển sang "Phụ kiện"?`);
        }
      });
    } else {
      console.log(`  ✅ Tất cả products đều có category hợp lệ`);
    }

    // 4. Hiển thị danh sách categories cuối cùng
    console.log("\n📋 Danh sách categories hiện tại:");
    console.log("=".repeat(60));
    const finalCategories = await Category.find().sort({ name: 1 });
    finalCategories.forEach((cat, index) => {
      console.log(`  ${index + 1}. ${cat.name} (ID: ${cat._id})`);
    });

    console.log("\n" + "=".repeat(60));
    console.log(`\n🎉 Hoàn thành!`);
    console.log(`   ✅ Categories công nghệ: ${finalCategories.length}`);
    console.log(`   🗑️  Đã xóa: ${deletedCount} categories không phù hợp`);
    console.log(`   ➕ Đã tạo: ${createdCount} categories mới`);

    await mongoose.connection.close();
    console.log("\n✅ Disconnected from MongoDB");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

updateCategoriesTech();

