# 🛒 E-Commerce API Endpoints Documentation

## 📋 **Tổng quan**
Base URL: `http://localhost:5000/api`

---

## 🔐 **Authentication Endpoints**
**Base:** `/api/auth`

| Method | Full URL | Description | Body |
|--------|----------|-------------|------|
| POST | `http://localhost:5000/api/auth/register` | Đăng ký user mới | `{name, email, phone_number, password_hash}` |
| POST | `http://localhost:5000/api/auth/login` | Đăng nhập | `{email, password}` |
| POST | `http://localhost:5000/api/auth/logout` | Đăng xuất | - |
| GET | `http://localhost:5000/api/auth/users` | Lấy danh sách users | - |
| GET | `http://localhost:5000/api/auth/users/:id` | Lấy user theo ID | - |

---

## 📦 **Product Endpoints**
**Base:** `/api/products`

| Method | Full URL | Description | Body |
|--------|----------|-------------|------|
| GET | `http://localhost:5000/api/products` | Lấy tất cả sản phẩm | - |
| GET | `http://localhost:5000/api/products/:id` | Lấy sản phẩm theo ID | - |
| POST | `http://localhost:5000/api/products` | Tạo sản phẩm mới | `{name, description, price, sku, in_stock, category_id, variations}` |
| PUT | `http://localhost:5000/api/products/:id` | Cập nhật sản phẩm | `{name, description, price, sku, in_stock, category_id, variations}` |
| DELETE | `http://localhost:5000/api/products/:id` | Xóa sản phẩm | - |

### 📝 **Product Body Example:**
```json
{
  "name": "iPhone 15",
  "description": "Điện thoại thông minh Apple",
  "price": 25000000,
  "sku": "IP15-001",
  "in_stock": 50,
  "category_id": "CATEGORY_ID",
  "variations": [
    {"size": "128GB", "color": "Đen", "stock": 20},
    {"size": "256GB", "color": "Trắng", "stock": 30}
  ]
}
```

---

## 📂 **Category Endpoints**
**Base:** `/api/categories`

| Method | Full URL | Description | Body |
|--------|----------|-------------|------|
| GET | `http://localhost:5000/api/categories` | Lấy tất cả danh mục | - |
| GET | `http://localhost:5000/api/categories/:id` | Lấy danh mục theo ID | - |
| POST | `http://localhost:5000/api/categories` | Tạo danh mục mới | `{name, parent_id?}` |
| PUT | `http://localhost:5000/api/categories/:id` | Cập nhật danh mục | `{name, parent_id?}` |
| DELETE | `http://localhost:5000/api/categories/:id` | Xóa danh mục | - |

### 📝 **Category Body Example:**
```json
{
  "name": "Điện thoại",
  "parent_id": "PARENT_CATEGORY_ID" // optional
}
```

---

## 🛒 **Cart Endpoints** *(Coming Soon)*
**Base:** `/api/carts`

| Method | Full URL | Description | Body |
|--------|----------|-------------|------|
| GET | `http://localhost:5000/api/carts` | Lấy giỏ hàng của user | - |
| POST | `http://localhost:5000/api/carts` | Thêm sản phẩm vào giỏ | `{user_id, items}` |
| PUT | `http://localhost:5000/api/carts` | Cập nhật giỏ hàng | `{items}` |
| DELETE | `http://localhost:5000/api/carts` | Xóa giỏ hàng | - |

---

## 📋 **Order Endpoints** *(Coming Soon)*
**Base:** `/api/orders`

| Method | Full URL | Description | Body |
|--------|----------|-------------|------|
| GET | `http://localhost:5000/api/orders` | Lấy tất cả đơn hàng | - |
| GET | `http://localhost:5000/api/orders/:id` | Lấy đơn hàng theo ID | - |
| POST | `http://localhost:5000/api/orders` | Tạo đơn hàng mới | `{user_id, items, shipping_address, shipping_method, payment_method}` |
| PUT | `http://localhost:5000/api/orders/:id` | Cập nhật trạng thái đơn hàng | `{status}` |
| DELETE | `http://localhost:5000/api/orders/:id` | Hủy đơn hàng | - |

---

## ⭐ **Review Endpoints** *(Coming Soon)*
**Base:** `/api/reviews`

| Method | Full URL | Description | Body |
|--------|----------|-------------|------|
| GET | `http://localhost:5000/api/reviews` | Lấy tất cả đánh giá | - |
| GET | `http://localhost:5000/api/reviews/product/:id` | Lấy đánh giá theo sản phẩm | - |
| POST | `http://localhost:5000/api/reviews` | Tạo đánh giá mới | `{user_id, product_id, rating, comment}` |
| PUT | `http://localhost:5000/api/reviews/:id` | Cập nhật đánh giá | `{rating, comment}` |
| DELETE | `http://localhost:5000/api/reviews/:id` | Xóa đánh giá | - |

---

## 🎯 **Promotion Endpoints** *(Coming Soon)*
**Base:** `/api/promotions`

| Method | Full URL | Description | Body |
|--------|----------|-------------|------|
| GET | `http://localhost:5000/api/promotions` | Lấy tất cả khuyến mãi | - |
| GET | `http://localhost:5000/api/promotions/:id` | Lấy khuyến mãi theo ID | - |
| POST | `http://localhost:5000/api/promotions` | Tạo khuyến mãi mới | `{name, description, discount_type, discount_value, start_date, end_date}` |
| PUT | `http://localhost:5000/api/promotions/:id` | Cập nhật khuyến mãi | - |
| DELETE | `http://localhost:5000/api/promotions/:id` | Xóa khuyến mãi | - |

---

## 🧪 **Testing với Postman**

### 1. **Tạo Category trước:**
```bash
POST http://localhost:5000/api/categories
Content-Type: application/json

{
  "name": "Điện thoại"
}
```

### 2. **Tạo Product:**
```bash
POST http://localhost:5000/api/products
Content-Type: application/json

{
  "name": "iPhone 15",
  "description": "Điện thoại thông minh Apple",
  "price": 25000000,
  "sku": "IP15-001",
  "in_stock": 50,
  "category_id": "CATEGORY_ID_FROM_STEP_1",
  "variations": [
    {"size": "128GB", "color": "Đen", "stock": 20},
    {"size": "256GB", "color": "Trắng", "stock": 30}
  ]
}
```

### 3. **Lấy tất cả sản phẩm:**
```bash
GET http://localhost:5000/api/products
```

---

## 📊 **Response Format**

### ✅ **Success Response:**
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

### ❌ **Error Response:**
```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error message"
}
```

---

## 🔄 **Status Codes**
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `404` - Not Found
- `500` - Internal Server Error

---

*📝 Last updated: Tuần 4 - Dự án Thương Mại Điện Tử*
