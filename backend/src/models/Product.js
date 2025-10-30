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
      stock: { type: Number, default: 0 }
    }]
  },
  { timestamps: true }
);

const Product = mongoose.model("Product", productSchema);
export default Product;
