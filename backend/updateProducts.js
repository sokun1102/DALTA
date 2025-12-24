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
  
  // ============================================
  // BƯỚC 1: XÓA 3 SẢN PHẨM
  // ============================================
  const productsToDelete = [
    "Bàn làm việc gỗ tự nhiên",
    "Tủ quần áo 3 cánh MDF",
    "Ghế sofa góc L vải nỉ cao cấp"
  ];
  
  console.log("=".repeat(60));
  console.log("🗑️  BƯỚC 1: XÓA SẢN PHẨM");
  console.log("=".repeat(60));
  console.log();
  
  let deletedCount = 0;
  for (const productName of productsToDelete) {
    const product = await Product.findOne({ name: productName });
    if (product) {
      await Product.findByIdAndDelete(product._id);
      deletedCount++;
      console.log(`✅ [${deletedCount}/${productsToDelete.length}] Đã xóa: ${productName} (SKU: ${product.sku})`);
    } else {
      console.log(`⚠️  Không tìm thấy: ${productName}`);
    }
  }
  
  console.log(`\n📊 Đã xóa ${deletedCount}/${productsToDelete.length} sản phẩm\n`);
  
  // ============================================
  // BƯỚC 2: ĐẢM BẢO CATEGORIES TỒN TẠI
  // ============================================
  console.log("=".repeat(60));
  console.log("📂 BƯỚC 2: KIỂM TRA CATEGORIES");
  console.log("=".repeat(60));
  console.log();
  
  const categoryNames = ["Điện thoại", "Tablet"];
  const categoryMap = {};
  
  for (const name of categoryNames) {
    let category = await Category.findOne({ name });
    if (!category) {
      category = await Category.create({ name });
      console.log(`✅ Đã tạo category: ${name}`);
    } else {
      console.log(`ℹ️  Category đã tồn tại: ${name}`);
    }
    categoryMap[name] = category._id;
  }
  console.log();
  
  // ============================================
  // BƯỚC 3: THÊM SẢN PHẨM MỚI
  // ============================================
  console.log("=".repeat(60));
  console.log("➕ BƯỚC 3: THÊM SẢN PHẨM MỚI");
  console.log("=".repeat(60));
  console.log();
  
  const newProducts = [
    // iPhone 17
    {
      name: "iPhone 17",
      description: "iPhone 17 với chip A19, màn hình Super Retina XDR 6.1 inch, hỗ trợ 5G, camera Pro 48MP, pin lớn hơn, sạc nhanh 30W.",
      price: 24990000,
      sku: "IP17-128",
      categoryName: "Điện thoại",
      in_stock: 25,
      variations: [
        { color: "Đen", size: "128GB", stock: 10 },
        { color: "Trắng", size: "128GB", stock: 8 },
        { color: "Xanh", size: "128GB", stock: 7 }
      ]
    },
    // 4 sản phẩm điện thoại nữa
    {
      name: "OPPO Find X8",
      description: "OPPO Find X8 với chip Snapdragon 8 Gen 3, màn hình AMOLED 6.78 inch, camera Hasselblad 50MP, sạc nhanh 100W.",
      price: 19990000,
      sku: "OPPO-X8-256",
      categoryName: "Điện thoại",
      in_stock: 20,
      variations: [
        { color: "Đen", size: "256GB", stock: 8 },
        { color: "Xanh", size: "256GB", stock: 7 },
        { color: "Trắng", size: "256GB", stock: 5 }
      ]
    },
    {
      name: "Vivo X100 Pro",
      description: "Vivo X100 Pro với chip MediaTek Dimensity 9300, màn hình AMOLED 6.78 inch, camera Zeiss 50MP, pin 5400mAh.",
      price: 18990000,
      sku: "VIVO-X100P-256",
      categoryName: "Điện thoại",
      in_stock: 18,
      variations: [
        { color: "Đen", size: "256GB", stock: 10 },
        { color: "Xanh", size: "256GB", stock: 8 }
      ]
    },
    {
      name: "OnePlus 13",
      description: "OnePlus 13 với chip Snapdragon 8 Gen 3, màn hình Fluid AMOLED 6.82 inch, camera 50MP, sạc nhanh 100W SuperVOOC.",
      price: 17990000,
      sku: "OP-13-256",
      categoryName: "Điện thoại",
      in_stock: 15,
      variations: [
        { color: "Đen", size: "256GB", stock: 8 },
        { color: "Xanh", size: "256GB", stock: 7 }
      ]
    },
    {
      name: "Realme GT 6",
      description: "Realme GT 6 với chip Snapdragon 8s Gen 3, màn hình AMOLED 6.78 inch, camera 50MP, sạc nhanh 120W.",
      price: 12990000,
      sku: "RM-GT6-256",
      categoryName: "Điện thoại",
      in_stock: 22,
      variations: [
        { color: "Đen", size: "256GB", stock: 12 },
        { color: "Vàng", size: "256GB", stock: 10 }
      ]
    },
    // 3 sản phẩm tablet
    {
      name: "iPad Pro 13 inch M4",
      description: "iPad Pro 13 inch với chip Apple M4, màn hình Liquid Retina XDR 13 inch, hỗ trợ Apple Pencil Pro, Magic Keyboard.",
      price: 32990000,
      sku: "IPAD-PRO13-M4",
      categoryName: "Tablet",
      in_stock: 12,
      variations: [
        { color: "Bạc", size: "256GB", stock: 5 },
        { color: "Xám", size: "256GB", stock: 4 },
        { color: "Vàng", size: "256GB", stock: 3 }
      ]
    },
    {
      name: "Samsung Galaxy Tab S10 Ultra",
      description: "Samsung Galaxy Tab S10 Ultra với chip Snapdragon 8 Gen 3, màn hình Super AMOLED 14.6 inch, hỗ trợ S-Pen, pin 11200mAh.",
      price: 29990000,
      sku: "SGT-S10U-256",
      categoryName: "Tablet",
      in_stock: 10,
      variations: [
        { color: "Đen", size: "256GB", stock: 5 },
        { color: "Bạc", size: "256GB", stock: 5 }
      ]
    },
    {
      name: "Xiaomi Pad 7 Pro",
      description: "Xiaomi Pad 7 Pro với chip Snapdragon 8 Gen 2, màn hình LCD 12.1 inch 144Hz, camera 50MP, pin 10000mAh, sạc nhanh 120W.",
      price: 12990000,
      sku: "XM-PAD7P-256",
      categoryName: "Tablet",
      in_stock: 16,
      variations: [
        { color: "Đen", size: "256GB", stock: 8 },
        { color: "Xanh", size: "256GB", stock: 8 }
      ]
    }
  ];
  
  let createdCount = 0;
  for (const p of newProducts) {
    const category_id = categoryMap[p.categoryName];
    if (!category_id) {
      console.log(`⚠️  Không tìm thấy category: ${p.categoryName} cho sản phẩm ${p.name}`);
      continue;
    }
    
    // Kiểm tra xem SKU đã tồn tại chưa
    const existingProduct = await Product.findOne({ sku: p.sku });
    if (existingProduct) {
      console.log(`⚠️  SKU ${p.sku} đã tồn tại, bỏ qua: ${p.name}`);
      continue;
    }
    
    const product = new Product({
      name: p.name,
      description: p.description,
      price: p.price,
      sku: p.sku,
      category_id,
      in_stock: p.in_stock,
      variations: p.variations || []
    });
    
    await product.save();
    createdCount++;
    console.log(`✅ [${createdCount}/${newProducts.length}] Đã thêm: ${p.name} (SKU: ${p.sku}, Category: ${p.categoryName})`);
  }
  
  console.log(`\n📊 Đã thêm ${createdCount}/${newProducts.length} sản phẩm mới\n`);
  
  // ============================================
  // TỔNG KẾT
  // ============================================
  console.log("=".repeat(60));
  console.log("📊 TỔNG KẾT");
  console.log("=".repeat(60));
  console.log(`✅ Đã xóa: ${deletedCount} sản phẩm`);
  console.log(`✅ Đã thêm: ${createdCount} sản phẩm mới`);
  console.log(`\n💡 Bạn có thể upload ảnh cho các sản phẩm mới qua Postman:`);
  console.log(`   POST /api/products/:id/image`);
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

