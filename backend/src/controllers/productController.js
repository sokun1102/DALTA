import Product from "../models/Product.js";
import Category from "../models/Category.js";

// 👉 Get all products
export const getProducts = async (req, res) => {
  try {
    const products = await Product.find().populate('category_id', 'name');
    res.json({ success: true, data: products });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// 👉 Get single product
export const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('category_id', 'name');
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });
    
    res.json({ success: true, data: product });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// 👉 Create product
export const createProduct = async (req, res) => {
  try {
    const { name, description, price, sku, in_stock, category_id, variations, imageUrl } = req.body;
    
    if (!name || !description || !price || !sku || !category_id) {
      return res.status(400).json({ success: false, message: "Please provide all required fields" });
    }

    // Check if category exists
    const category = await Category.findById(category_id);
    if (!category) {
      return res.status(400).json({ success: false, message: "Category not found" });
    }

    const newProduct = new Product({ name, description, price, sku, in_stock, category_id, variations, imageUrl });
    await newProduct.save();

    res.status(201).json({
      success: true,
      message: "Product created successfully",
      data: newProduct
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// 👉 Update product
export const updateProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });
    
    res.json({
      success: true,
      message: "Product updated successfully",
      data: product
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// 👉 Delete product
export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });
    
    res.json({ success: true, message: "Product deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
