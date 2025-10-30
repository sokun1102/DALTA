// models/Promotion.js
import mongoose from "mongoose";

const promotionSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    discount_type: { 
      type: String, 
      enum: ['percentage', 'fixed_amount'], 
      required: true 
    },
    discount_value: { type: Number, required: true },
    start_date: { type: Date, required: true },
    end_date: { type: Date, required: true },
    product_ids: [{ 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Product' 
    }],
    category_ids: [{ 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Category' 
    }]
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

const Promotion = mongoose.model("Promotion", promotionSchema);
export default Promotion;
