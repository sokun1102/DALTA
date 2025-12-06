// scripts/createSampleProducts.js
// Script để tạo dataset sản phẩm mẫu (có variations)
// Chạy: node backend/src/scripts/createSampleProducts.js
// Yêu cầu: đã cấu hình biến môi trường MONGO_URI hoặc MONGODB_URI

import mongoose from "mongoose";
import dotenv from "dotenv";
import Product from "../models/Product.js";
import Category from "../models/Category.js";

dotenv.config();

const MONGODB_URI =
  process.env.MONGO_URI ||
  process.env.MONGODB_URI ||
  "mongodb://localhost:27017/ecommerce";

const categoriesToEnsure = [
  "Điện thoại",
  "Laptop",
  "Tablet",
  "Phụ kiện",
];

const sampleProducts = [
  {
    name: "iPhone 15 Pro Max",
    description:
      "iPhone 15 Pro Max với chip A17 Pro, màn hình Super Retina XDR 6.7 inch, hỗ trợ 5G, camera Pro 48MP.",
    price: 32990000,
    sku: "IP15PM-256",
    imageUrl:
      "https://images.pexels.com/photos/18069242/pexels-photo-18069242.jpeg",
    categoryName: "Điện thoại",
    variations: [
      { color: "Đen", size: "256GB", stock: 10 },
      { color: "Trắng", size: "256GB", stock: 8 },
      { color: "Xanh", size: "256GB", stock: 5 },
    ],
  },
  {
    name: "Samsung Galaxy S24 Ultra",
    description:
      "Galaxy S24 Ultra với màn hình Dynamic AMOLED 2X, camera zoom 100x, pin lớn, hỗ trợ S-Pen.",
    price: 29990000,
    sku: "SSG-S24U-256",
    imageUrl:
      "https://images.pexels.com/photos/404280/pexels-photo-404280.jpeg",
    categoryName: "Điện thoại",
    variations: [
      { color: "Đen", size: "256GB", stock: 12 },
      { color: "Tím", size: "256GB", stock: 7 },
    ],
  },
  {
    name: "MacBook Pro 14 M3",
    description:
      "MacBook Pro 14 inch chip Apple M3, màn hình Liquid Retina XDR, thời lượng pin lên đến 18 giờ.",
    price: 45990000,
    sku: "MBP14-M3-16-512",
    imageUrl:
      "https://images.pexels.com/photos/18105/pexels-photo.jpg",
    categoryName: "Laptop",
    variations: [
      { color: "Bạc", size: "16GB / 512GB", stock: 6 },
      { color: "Xám", size: "16GB / 512GB", stock: 4 },
    ],
  },
  {
    name: "iPad Air 5 Wi-Fi",
    description:
      "iPad Air 5 chip M1, màn hình Liquid Retina 10.9 inch, hỗ trợ Apple Pencil 2.",
    price: 16990000,
    sku: "IPAD-AIR5-64",
    imageUrl:
      "https://images.pexels.com/photos/1334603/pexels-photo-1334603.jpeg",
    categoryName: "Tablet",
    variations: [
      { color: "Xanh dương", size: "64GB", stock: 10 },
      { color: "Hồng", size: "64GB", stock: 5 },
    ],
  },
  {
    name: "AirPods Pro 2",
    description:
      "Tai nghe AirPods Pro 2 với chống ồn chủ động, Adaptive Audio, sạc MagSafe.",
    price: 6490000,
    sku: "APP-2ND",
    imageUrl:
      "https://images.pexels.com/photos/788946/pexels-photo-788946.jpeg",
    categoryName: "Phụ kiện",
    variations: [
      { color: "Trắng", size: "Default", stock: 20 },
    ],
  },
  {
    name: "Chuột Logitech MX Master 3S",
    description:
      "Chuột không dây Logitech MX Master 3S, cảm biến 8K DPI, hỗ trợ Flow, sạc USB-C.",
    price: 2690000,
    sku: "LOGI-MX3S",
    imageUrl:
      "https://images.pexels.com/photos/2047905/pexels-photo-2047905.jpeg",
    categoryName: "Phụ kiện",
    variations: [
      { color: "Đen", size: "Default", stock: 15 },
      { color: "Xám", size: "Default", stock: 10 },
    ],
  },
];

async function ensureCategories() {
  const categoryMap = {};

  for (const name of categoriesToEnsure) {
    let category = await Category.findOne({ name });
    if (!category) {
      category = await Category.create({ name });
      console.log(`✅ Created category: ${name}`);
    } else {
      console.log(`ℹ️  Found existing category: ${name}`);
    }
    categoryMap[name] = category._id;
  }

  return categoryMap;
}

async function createSampleProducts() {
  try {
    console.log("🔌 Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    const categoryMap = await ensureCategories();

    const createdOrUpdated = [];

    for (const p of sampleProducts) {
      const category_id = categoryMap[p.categoryName];
      if (!category_id) {
        console.warn(
          `⚠️  Không tìm thấy category cho sản phẩm: ${p.name} (categoryName=${p.categoryName})`
        );
        continue;
      }

      const in_stock =
        Array.isArray(p.variations) && p.variations.length > 0
          ? p.variations.reduce((sum, v) => sum + (v.stock || 0), 0)
          : 0;

      const update = {
        name: p.name,
        description: p.description,
        price: p.price,
        sku: p.sku,
        imageUrl: p.imageUrl,
        category_id,
        in_stock,
        variations: p.variations || [],
      };

      const product = await Product.findOneAndUpdate(
        { sku: p.sku },
        update,
        { upsert: true, new: true }
      );

      createdOrUpdated.push(product);
      console.log(
        `✅ Upsert product: ${product.name} (sku=${product.sku}, in_stock=${product.in_stock})`
      );
    }

    console.log(
      `\n🎉 Đã tạo/cập nhật ${createdOrUpdated.length} sản phẩm mẫu.`
    );

    await mongoose.disconnect();
    console.log("✅ Disconnected from MongoDB");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error when creating sample products:", error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

createSampleProducts();


