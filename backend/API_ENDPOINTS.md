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

### 📦 **Dataset Examples - Điện thoại:**

#### iPhone 15 Pro Max
```json
{
  "name": "iPhone 16 Pro Max",
  "description": "iPhone 16 Pro Max với chip A18 Pro, màn hình Super Retina XDR 6.7 inch, hỗ trợ 5G, camera Pro 48MP.",
  "price": 32990000,
  "sku": "IP16PM-256",
  "in_stock": 23,
  "category_id": "CATEGORY_ID",
  "variations": [
    {"size": "256GB", "color": "Đen", "stock": 10},
    {"size": "256GB", "color": "Trắng", "stock": 8},
    {"size": "256GB", "color": "Xanh", "stock": 5}
  ]
}
```

#### Samsung Galaxy S24 Ultra
```json
{
  "name": "Samsung Galaxy S24 Ultra",
  "description": "Điện thoại Samsung flagship với bút S Pen, màn hình Dynamic AMOLED 2X 6.8 inch, camera 200MP.",
  "price": 28990000,
  "sku": "SGS24U-512",
  "in_stock": 35,
  "category_id": "CATEGORY_ID",
  "variations": [
    {"size": "256GB", "color": "Đen", "stock": 15},
    {"size": "256GB", "color": "Tím", "stock": 12},
    {"size": "512GB", "color": "Đen", "stock": 8}
  ]
}
```

#### Xiaomi 14 Pro
```json
{
  "name": "Xiaomi 14 Pro",
  "description": "Điện thoại Xiaomi cao cấp với chip Snapdragon 8 Gen 3, màn hình AMOLED 6.73 inch, camera Leica 50MP.",
  "price": 12000000,
  "sku": "XM14-003",
  "in_stock": 60,
  "category_id": "CATEGORY_ID",
  "variations": [
    {"size": "256GB", "color": "Tím", "stock": 30},
    {"size": "512GB", "color": "Đen", "stock": 30}
  ]
}
```

### 💻 **Dataset Examples - Laptop:**

#### MacBook Pro 14 inch
```json
{
  "name": "MacBook Pro 14 inch",
  "description": "MacBook Pro 14 inch với chip M3 Pro, màn hình Liquid Retina XDR, 18 giờ pin.",
  "price": 54990000,
  "sku": "MBP14-M3",
  "in_stock": 15,
  "category_id": "CATEGORY_ID",
  "variations": [
    {"size": "512GB", "color": "Bạc", "stock": 8},
    {"size": "1TB", "color": "Xám", "stock": 7}
  ]
}
```

#### Dell XPS 15
```json
{
  "name": "Dell XPS 15",
  "description": "Laptop Dell XPS 15 với Intel Core i7, màn hình OLED 15.6 inch, card đồ họa RTX 4050.",
  "price": 42990000,
  "sku": "DXP15-001",
  "in_stock": 20,
  "category_id": "CATEGORY_ID",
  "variations": [
    {"size": "512GB", "color": "Bạc", "stock": 12},
    {"size": "1TB", "color": "Đen", "stock": 8}
  ]
}
```

### 📱 **Dataset Examples - Tablet:**

#### iPad Air 11 inch
```json
{
  "name": "iPad Air 11 inch",
  "description": "iPad Air 11 inch với chip M2, màn hình Liquid Retina, hỗ trợ Apple Pencil và Magic Keyboard.",
  "price": 18990000,
  "sku": "IPAD-AIR-11",
  "in_stock": 30,
  "category_id": "CATEGORY_ID",
  "variations": [
    {"size": "128GB", "color": "Xanh", "stock": 15},
    {"size": "256GB", "color": "Tím", "stock": 15}
  ]
}
```

### 🎧 **Dataset Examples - Phụ kiện:**

#### AirPods Pro 2
```json
{
  "name": "AirPods Pro 2",
  "description": "Tai nghe AirPods Pro 2 với chống ồn chủ động, Adaptive Audio, sạc MagSafe.",
  "price": 6490000,
  "sku": "APP-2ND-001",
  "in_stock": 20,
  "category_id": "CATEGORY_ID",
  "variations": [
    {"size": "Default", "color": "Trắng", "stock": 20}
  ]
}
```

#### Cốc sạc nhanh 20W
```json
{
  "name": "Cốc sạc nhanh 20W",
  "description": "Cốc sạc nhanh 20W, hỗ trợ sạc nhanh cho iPhone và Android.",
  "price": 390000,
  "sku": "CHARGER-20W-001",
  "in_stock": 50,
  "category_id": "CATEGORY_ID",
  "variations": [
    {"size": "Default", "color": "Trắng", "stock": 30},
    {"size": "Default", "color": "Đen", "stock": 20}
  ]
}
```

#### Cáp USB-C to Lightning 1m
```json
{
  "name": "Cáp USB-C to Lightning 1m",
  "description": "Cáp sạc USB-C to Lightning dài 1m, hỗ trợ sạc nhanh PD.",
  "price": 290000,
  "sku": "CABLE-CL-1M-001",
  "in_stock": 100,
  "category_id": "CATEGORY_ID",
  "variations": [
    {"size": "1m", "color": "Trắng", "stock": 60},
    {"size": "2m", "color": "Trắng", "stock": 40}
  ]
}
```

#### Ốp lưng iPhone 15 Pro Max
```json
{
  "name": "Ốp lưng iPhone 15 Pro Max",
  "description": "Ốp lưng silicon chống sốc cho iPhone 15 Pro Max.",
  "price": 250000,
  "sku": "CASE-IP15PM-001",
  "in_stock": 80,
  "category_id": "CATEGORY_ID",
  "variations": [
    {"size": "iPhone 15 Pro Max", "color": "Đen", "stock": 30},
    {"size": "iPhone 15 Pro Max", "color": "Trong suốt", "stock": 30},
    {"size": "iPhone 15 Pro Max", "color": "Xanh Navy", "stock": 20}
  ]
}
```

#### Chuột Logitech MX Master 3S
```json
{
  "name": "Chuột Logitech MX Master 3S",
  "description": "Chuột không dây Logitech MX Master 3S với cảm biến Darkfield, pin sạc 70 ngày.",
  "price": 2490000,
  "sku": "LOG-MX3S-001",
  "in_stock": 40,
  "category_id": "CATEGORY_ID",
  "variations": [
    {"size": "Default", "color": "Đen", "stock": 25},
    {"size": "Default", "color": "Hồng", "stock": 15}
  ]
}
```

#### Bàn phím cơ Keychron K8
```json
{
  "name": "Bàn phím cơ Keychron K8",
  "description": "Bàn phím cơ Keychron K8 không dây, switch Gateron, hỗ trợ đa thiết bị.",
  "price": 2990000,
  "sku": "KEY-K8-001",
  "in_stock": 25,
  "category_id": "CATEGORY_ID",
  "variations": [
    {"size": "TKL", "color": "Đen", "stock": 15},
    {"size": "TKL", "color": "Trắng", "stock": 10}
  ]
}
```

#### Loa Bluetooth JBL Flip 6
```json
{
  "name": "Loa Bluetooth JBL Flip 6",
  "description": "Loa Bluetooth JBL Flip 6 chống nước IPX7, pin 12 giờ, âm thanh JBL Pro Sound.",
  "price": 3490000,
  "sku": "JBL-FLIP6-001",
  "in_stock": 35,
  "category_id": "CATEGORY_ID",
  "variations": [
    {"size": "Default", "color": "Đen", "stock": 20},
    {"size": "Default", "color": "Xanh", "stock": 15}
  ]
}
```

#### Pin dự phòng 20000mAh
```json
{
  "name": "Pin dự phòng 20000mAh",
  "description": "Pin dự phòng 20000mAh, hỗ trợ sạc nhanh PD 20W, 2 cổng USB-A và 1 cổng USB-C.",
  "price": 890000,
  "sku": "POWER-20K-001",
  "in_stock": 60,
  "category_id": "CATEGORY_ID",
  "variations": [
    {"size": "20000mAh", "color": "Đen", "stock": 40},
    {"size": "20000mAh", "color": "Trắng", "stock": 20}
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

### ⚠️ **QUAN TRỌNG: Authentication Required**

Các endpoint **POST, PUT, DELETE** cho Products yêu cầu:
- ✅ User phải **đăng nhập** (có token)
- ✅ User phải có **role = "admin"**

---

### **Bước 0: Đăng nhập để lấy Token**

**Request:**
```bash
POST http://localhost:5000/api/auth/login
Content-Type: application/json
```

**Body (raw JSON):**
```json
{
  "email": "admin@example.com",
  "password": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "...",
      "name": "Admin User",
      "email": "admin@example.com",
      "role": "admin"
    }
  }
}
```

**👉 Copy token từ response để dùng ở các bước sau!**

---

### **Bước 1: Tạo Category**

**Request:**
```bash
POST http://localhost:5000/api/categories
Content-Type: application/json
```

**Body (raw JSON):**
```json
{
  "name": "Điện thoại"
}
```

**Response sẽ trả về `_id` của category → Copy ID này để dùng ở bước 2!**

---

### **Bước 2: Tạo Product (CẦN TOKEN!)**

**Request:**
```bash
POST http://localhost:5000/api/products
Content-Type: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**⚠️ Lưu ý:** Thay `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` bằng **token thật** từ Bước 0!

**Body (raw JSON):**
```json
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

**Trong Postman:**
1. Chọn tab **Headers**
2. Thêm header: `Authorization` = `Bearer <token_của_bạn>`
3. Hoặc dùng tab **Authorization** → Type: **Bearer Token** → Paste token vào

---

### **Bước 3: Lấy tất cả sản phẩm (KHÔNG CẦN TOKEN)**

**Request:**
```bash
GET http://localhost:5000/api/products
```

**Không cần header Authorization vì đây là endpoint public.**

---

### 🔧 **Nếu gặp lỗi "No token provided" (401):**

1. Kiểm tra đã thêm header `Authorization` chưa
2. Đảm bảo format đúng: `Bearer <token>` (có khoảng trắng sau "Bearer")
3. Token có thể đã hết hạn → Đăng nhập lại để lấy token mới
4. User phải có `role: "admin"` → Nếu chưa, dùng script: `npm run set-admin-email <email>`

---

### 🔧 **Nếu gặp lỗi "Invalid or expired token" (401):**

**Nguyên nhân:**
- Token đã hết hạn (token có thời hạn **1 giờ**)
- Token không đúng format
- JWT_SECRET không khớp

**Cách fix:**

1. **Đăng nhập lại để lấy token mới** (khuyến nghị):
   ```bash
   POST http://localhost:5000/api/auth/login
   Content-Type: application/json
   
   {
     "email": "admin@example.com",
     "password": "123456"
   }
   ```
   → Copy token mới từ response và dùng lại

2. **Kiểm tra format header trong Postman:**
   - ✅ **Đúng**: `Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
   - ❌ **Sai**: `Authorization: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (thiếu "Bearer ")
   - ❌ **Sai**: `Authorization: Bearer: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (có dấu ":" thừa)

3. **Trong Postman, kiểm tra:**
   - Tab **Headers**: Key = `Authorization`, Value = `Bearer <token>` (có khoảng trắng)
   - Hoặc tab **Authorization**: Type = `Bearer Token`, Token = `<token>` (không cần "Bearer")

4. **Nếu muốn tăng thời hạn token** (cho development):
   - Sửa file `backend/src/controllers/authController.js`
   - Đổi `expiresIn: "1h"` thành `expiresIn: "24h"` hoặc `expiresIn: "7d"`

---

### 🔧 **Nếu gặp lỗi "Access denied. Admin only" (403):**

User của bạn chưa có quyền admin. Cách fix:

**Option 1: Dùng script trong backend:**
```bash
cd backend
npm run set-admin-email admin@example.com
```

**Option 2: Sửa trực tiếp trong MongoDB:**
```javascript
db.users.updateOne(
  { email: "admin@example.com" },
  { $set: { role: "admin" } }
)
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
