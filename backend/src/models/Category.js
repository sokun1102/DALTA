// models/Category.js
import mongoose from "mongoose";

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    parent_id: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Category', 
      default: null 
    }
  },
  { timestamps: true, versionKey: false }
);

// Indexes để tối ưu queries
categorySchema.index({ name: 1 }); // Unique index đã có trong schema
categorySchema.index({ parent_id: 1 }); // Tìm categories con

const Category = mongoose.model("Category", categorySchema);
export default Category;
