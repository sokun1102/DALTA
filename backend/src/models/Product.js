// models/Product.js
import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    sku: { type: String, required: true, unique: true },
    in_stock: { type: Number, required: true, default: 0 },
    imageUrl: { type: String },
    category_id: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Category', 
      required: true 
    },
    variations: [{
      size: { type: String },
      color: { type: String },
      ram: { type: String },
      stock: { type: Number, default: 0 }
    }]
  },
  { timestamps: true, versionKey: false }
);

// Indexes để tối ưu queries
productSchema.index({ category_id: 1 }); // Tìm sản phẩm theo category
productSchema.index({ sku: 1 }); // Unique index đã có trong schema
productSchema.index({ in_stock: 1 }); // Filter sản phẩm còn hàng
productSchema.index({ name: "text", description: "text" }); // Text search

const Product = mongoose.model("Product", productSchema);
export default Product;
