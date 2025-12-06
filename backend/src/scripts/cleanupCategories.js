// scripts/cleanupCategories.js
// Script để chỉ giữ lại 4 categories chính: Điện thoại, Laptop, Tablet, Phụ kiện
// Chạy: node src/scripts/cleanupCategories.js

import mongoose from "mongoose";
import dotenv from "dotenv";
import Category from "../models/Category.js";
import Product from "../models/Product.js";

dotenv.config();

const MONGODB_URI = process.env.MONGO_URI || process.env.MONGODB_URI || "mongodb://localhost:27017/ecommerce";

// 4 categories chính cần giữ lại
const mainCategories = [
  "Điện thoại",
  "Laptop",
  "Tablet",
  "Phụ kiện",
];

// Mapping để chuyển products từ categories cũ sang categories mới
const categoryMapping = {
  "Smartwatch": "Phụ kiện",
  "Tai nghe": "Phụ kiện",
  "Loa": "Phụ kiện",
  "Gaming": "Laptop", // Gaming laptop -> Laptop
  "Camera": "Phụ kiện",
  "Màn hình": "Phụ kiện",
  "Bàn phím": "Phụ kiện",
  "Chuột": "Phụ kiện",
};

const cleanupCategories = async () => {
  try {
    // Kết nối MongoDB
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ Connected to MongoDB\n");

    console.log("📋 Bắt đầu dọn dẹp categories...\n");

    // 1. Lấy tất cả categories
    const allCategories = await Category.find();
    const mainCategoryMap = {};
    const categoriesToDelete = [];

    // Tạo map cho main categories
    for (const categoryName of mainCategories) {
      const category = await Category.findOne({ name: categoryName });
      if (category) {
        mainCategoryMap[categoryName] = category._id;
        console.log(`✅ Found main category: "${categoryName}"`);
      } else {
        // Tạo nếu chưa có
        const newCategory = await Category.create({ name: categoryName });
        mainCategoryMap[categoryName] = newCategory._id;
        console.log(`➕ Created main category: "${categoryName}"`);
      }
    }

    // 2. Xác định categories cần xóa và chuyển products
    console.log("\n🔄 Chuyển products sang categories chính:");
    console.log("=".repeat(60));
    
    for (const category of allCategories) {
      const categoryName = category.name;
      
      // Nếu không phải main category
      if (!mainCategories.includes(categoryName)) {
        const targetCategory = categoryMapping[categoryName] || "Phụ kiện";
        const targetCategoryId = mainCategoryMap[targetCategory];
        
        if (targetCategoryId) {
          // Đếm products
          const productsCount = await Product.countDocuments({ category_id: category._id });
          
          if (productsCount > 0) {
            // Chuyển products
            await Product.updateMany(
              { category_id: category._id },
              { category_id: targetCategoryId }
            );
            console.log(`  ✅ Chuyển ${productsCount} sản phẩm từ "${categoryName}" → "${targetCategory}"`);
          }
          
          // Đánh dấu để xóa
          categoriesToDelete.push({ _id: category._id, name: categoryName });
        }
      }
    }

    // 3. Xóa các categories không cần thiết
    console.log("\n🗑️  Xóa categories không cần thiết:");
    console.log("=".repeat(60));
    let deletedCount = 0;
    
    for (const category of categoriesToDelete) {
      try {
        await Category.findByIdAndDelete(category._id);
        console.log(`  ✅ Đã xóa: "${category.name}"`);
        deletedCount++;
      } catch (error) {
        console.error(`  ❌ Lỗi khi xóa "${category.name}":`, error.message);
      }
    }

    // 4. Hiển thị danh sách categories cuối cùng
    console.log("\n📋 Danh sách categories cuối cùng:");
    console.log("=".repeat(60));
    const finalCategories = await Category.find().sort({ name: 1 });
    finalCategories.forEach((cat, index) => {
      const productsCount = Product.countDocuments({ category_id: cat._id });
      console.log(`  ${index + 1}. ${cat.name} (ID: ${cat._id})`);
    });

    // 5. Thống kê products theo category
    console.log("\n📊 Thống kê products theo category:");
    console.log("=".repeat(60));
    for (const categoryName of mainCategories) {
      const categoryId = mainCategoryMap[categoryName];
      const count = await Product.countDocuments({ category_id: categoryId });
      console.log(`  ${categoryName}: ${count} sản phẩm`);
    }

    console.log("\n" + "=".repeat(60));
    console.log(`\n🎉 Hoàn thành!`);
    console.log(`   ✅ Categories chính: ${finalCategories.length}`);
    console.log(`   🗑️  Đã xóa: ${deletedCount} categories`);
    console.log(`   📊 Tổng categories: ${finalCategories.length}`);

    await mongoose.connection.close();
    console.log("\n✅ Disconnected from MongoDB");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

cleanupCategories();

