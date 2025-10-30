import Category from "../models/Category.js";

// 👉 Get all categories
export const getCategories = async (req, res) => {
  try {
    const categories = await Category.find().populate('parent_id', 'name');
    res.json({ success: true, data: categories });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// 👉 Get single category
export const getCategoryById = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id).populate('parent_id', 'name');
    if (!category) return res.status(404).json({ success: false, message: "Category not found" });
    
    res.json({ success: true, data: category });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// 👉 Create category
export const createCategory = async (req, res) => {
  try {
    const { name, parent_id } = req.body;
    
    if (!name) {
      return res.status(400).json({ success: false, message: "Category name is required" });
    }

    // If parent_id is provided, check if it exists
    if (parent_id) {
      const parentCategory = await Category.findById(parent_id);
      if (!parentCategory) {
        return res.status(400).json({ success: false, message: "Parent category not found" });
      }
    }

    const newCategory = new Category({ name, parent_id });
    await newCategory.save();

    res.status(201).json({
      success: true,
      message: "Category created successfully",
      data: newCategory
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// 👉 Update category
export const updateCategory = async (req, res) => {
  try {
    const category = await Category.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!category) return res.status(404).json({ success: false, message: "Category not found" });
    
    res.json({
      success: true,
      message: "Category updated successfully",
      data: category
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// 👉 Delete category
export const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);
    
    if (!category) return res.status(404).json({ success: false, message: "Category not found" });
    
    res.json({ success: true, message: "Category deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
