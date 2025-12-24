# 📮 Hướng dẫn sử dụng Postman để thêm sản phẩm

## 🎯 Mục tiêu
Đăng nhập và thêm sản phẩm vào database thông qua Postman.

---

## 📋 **Bước 1: Đăng nhập để lấy Token**

### Request Setup:
- **Method**: `POST`
- **URL**: `http://192.168.1.229:5000/api/auth/login`
  - *(Hoặc `http://localhost:5000/api/auth/login` nếu chạy local)*

### Headers:
```
Content-Type: application/json
```

### Body (raw JSON):
```json
{
  "email": "admin@example.com",
  "password": "123456"
}
```

### Response mẫu:
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4ZjA2NTEzMTNhZTU2YWNmNjk4ZmQ5ZCIsImlhdCI6MTczNDU2Nzg5MCwiZXhwIjoxNzM0NTcxNDkwfQ.xxx",
    "user": {
      "id": "68f0651313ae56acf698fd9d",
      "name": "Admin User",
      "email": "admin@example.com",
      "role": "admin"
    }
  }
}
```

**👉 Copy token từ `data.token` để dùng ở bước sau!**

---

## 📂 **Bước 2: Lấy Category ID (nếu chưa có)**

### Request Setup:
- **Method**: `GET`
- **URL**: `http://192.168.1.229:5000/api/categories`

### Headers:
*(Không cần header gì cả)*

### Response mẫu:
```json
{
  "success": true,
  "data": [
    {
      "_id": "68e909ba5b489ac371460385",
      "name": "Điện thoại",
      "createdAt": "2024-01-01T00:00:00.000Z"
    },
    {
      "_id": "68e909ba5b489ac371460386",
      "name": "Phụ kiện",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

**👉 Copy `_id` của category bạn muốn (ví dụ: "68e909ba5b489ac371460385")**

---

## ➕ **Bước 3: Thêm sản phẩm**

### Request Setup:
- **Method**: `POST`
- **URL**: `http://192.168.1.229:5000/api/products`

### Headers:
```
Content-Type: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4ZjA2NTEzMTNhZTU2YWNmNjk4ZmQ5ZCIsImlhdCI6MTczNDU2Nzg5MCwiZXhwIjoxNzM0NTcxNDkwfQ.xxx
```

**⚠️ Lưu ý:** Thay `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` bằng **token thật** từ Bước 1!

### Body (raw JSON) - Ví dụ iPhone:
```json
{
  "name": "iPhone 16 Pro Max",
  "description": "iPhone 16 Pro Max với chip A18 Pro, màn hình Super Retina XDR 6.7 inch, hỗ trợ 5G, camera Pro 48MP.",
  "price": 32990000,
  "sku": "IP16PM-256",
  "in_stock": 23,
  "category_id": "68e909ba5b489ac371460385",
  "variations": [
    {"size": "256GB", "color": "Đen", "stock": 10},
    {"size": "256GB", "color": "Trắng", "stock": 8},
    {"size": "256GB", "color": "Xanh", "stock": 5}
  ]
}
```

### Body (raw JSON) - Ví dụ Phụ kiện:
```json
{
  "name": "AirPods Pro 2",
  "description": "Tai nghe AirPods Pro 2 với chống ồn chủ động, Adaptive Audio, sạc MagSafe.",
  "price": 6490000,
  "sku": "APP-2ND-001",
  "in_stock": 20,
  "category_id": "68e909ba5b489ac371460386",
  "variations": [
    {"size": "Default", "color": "Trắng", "stock": 20}
  ]
}
```

### Response thành công:
```json
{
  "success": true,
  "message": "Product created successfully",
  "data": {
    "_id": "68f0651313ae56acf698fd9e",
    "name": "iPhone 16 Pro Max",
    "price": 32990000,
    "sku": "IP16PM-256",
    "in_stock": 23,
    "variations": [
      {"size": "256GB", "color": "Đen", "stock": 10},
      {"size": "256GB", "color": "Trắng", "stock": 8},
      {"size": "256GB", "color": "Xanh", "stock": 5}
    ],
    "createdAt": "2024-12-19T10:30:00.000Z"
  }
}
```

---

## 🖼️ **Bước 4: Upload ảnh cho sản phẩm**

Sau khi tạo sản phẩm, bạn có thể upload ảnh local cho sản phẩm đó.

### Request Setup:
- **Method**: `POST`
- **URL**: `http://192.168.1.229:5000/api/products/:id/image`
  - Thay `:id` bằng **Product ID** từ response của Bước 3 (ví dụ: `68f0651313ae56acf698fd9e`)

### Headers:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4ZjA2NTEzMTNhZTU2YWNmNjk4ZmQ5ZCIsImlhdCI6MTczNDU2Nzg5MCwiZXhwIjoxNzM0NTcxNDkwfQ.xxx
```

**⚠️ Lưu ý:** 
- Thay token bằng **token thật** từ Bước 1
- **KHÔNG** thêm header `Content-Type` (Postman sẽ tự động set khi chọn form-data)

### Body:
1. Chọn tab **Body**
2. Chọn **form-data** (không phải raw JSON)
3. Thêm key `image` với type là **File** (click vào dropdown bên phải key, chọn "File")
4. Click **Select Files** và chọn file ảnh từ máy tính

**Hỗ trợ định dạng:** `.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`

### Response thành công:
```json
{
  "success": true,
  "message": "Image uploaded",
  "data": {
    "imageUrl": "/uploads/products/prod_1760703581540.jpg"
  }
}
```

**👉 Ảnh sẽ được lưu vào `backend/src/uploads/products/` và tự động map với sản phẩm!**

### Cách 2: Cập nhật imageUrl thủ công (nếu đã có file ảnh sẵn)

Nếu bạn đã có file ảnh trong thư mục `backend/src/uploads/products/`, bạn có thể cập nhật `imageUrl` trực tiếp:

- **Method**: `PUT`
- **URL**: `http://192.168.1.229:5000/api/products/:id`

### Headers:
```
Content-Type: application/json
Authorization: Bearer <token>
```

### Body (raw JSON):
```json
{
  "imageUrl": "/uploads/products/prod_1760703581540.jpg"
}
```

**⚠️ Lưu ý:** Đảm bảo file ảnh đã tồn tại trong thư mục `backend/src/uploads/products/` trước khi cập nhật!

---

## ⚠️ **Lỗi thường gặp:**

### 1. **Lỗi 401 "No token provided"**
- **Nguyên nhân**: Chưa thêm header `Authorization`
- **Cách fix**: Thêm header `Authorization: Bearer <token>` vào request

### 2. **Lỗi 401 "Invalid or expired token"**
- **Nguyên nhân**: 
  - Token đã hết hạn (token có thời hạn 1 giờ)
  - Token không đúng format
  - JWT_SECRET không khớp
- **Cách fix**: 
  1. **Đăng nhập lại** để lấy token mới (khuyến nghị):
     ```
     POST http://192.168.1.229:5000/api/auth/login
     Body: {"email": "admin@example.com", "password": "123456"}
     → Copy token mới
     ```
  2. **Kiểm tra format header:**
     - Đúng: `Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
     - Sai: `Authorization: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (thiếu "Bearer ")
     - Sai: `Authorization: Bearer: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (có dấu ":")
  3. **Tăng thời hạn token** (nếu cần): Xem phần "Tùy chọn: Tăng thời hạn token" bên dưới

### 3. **Lỗi 403 "Access denied. Admin only"**
- **Nguyên nhân**: User chưa có quyền admin
- **Cách fix**: Chạy script:
  ```bash
  cd backend
  npm run set-admin-email admin@example.com
  ```

### 3. **Lỗi 400 "Category not found"**
- **Nguyên nhân**: `category_id` không đúng
- **Cách fix**: Kiểm tra lại `category_id` từ Bước 2

### 4. **Lỗi 400 "SKU already exists"**
- **Nguyên nhân**: `sku` đã tồn tại trong database
- **Cách fix**: Đổi `sku` thành giá trị khác (ví dụ: "IP16PM-256-2")

### 5. **Lỗi 404 "Product not found" (khi upload ảnh)**
- **Nguyên nhân**: Product ID không đúng hoặc sản phẩm không tồn tại
- **Cách fix**: Kiểm tra lại Product ID từ response của Bước 3

### 6. **Lỗi khi upload ảnh**
- **Nguyên nhân**: 
  - Chưa chọn file ảnh
  - File quá lớn
  - Định dạng file không được hỗ trợ
- **Cách fix**: 
  - Đảm bảo đã chọn file trong form-data
  - Kiểm tra định dạng file (chỉ hỗ trợ: jpg, jpeg, png, webp, gif)
  - Giảm kích thước file nếu quá lớn

---

## 💡 **Tips:**

1. **Lưu token vào biến môi trường Postman:**
   - Sau khi login, vào tab **Tests** → Thêm script:
   ```javascript
   if (pm.response.code === 200) {
       const jsonData = pm.response.json();
       pm.environment.set("token", jsonData.data.token);
   }
   ```
   - Sau đó dùng `{{token}}` trong header `Authorization: Bearer {{token}}`

2. **Tạo Collection trong Postman:**
   - Tạo collection "E-Commerce API"
   - Thêm các request: Login, Get Categories, Create Product
   - Dễ quản lý và tái sử dụng

3. **Kiểm tra sản phẩm đã tạo:**
   - `GET http://192.168.1.229:5000/api/products` (không cần token)
   - `GET http://192.168.1.229:5000/api/products/:id` (xem chi tiết 1 sản phẩm)

4. **Xem ảnh đã upload:**
   - Sau khi upload, ảnh sẽ có URL: `http://192.168.1.229:5000/uploads/products/ten-file.jpg`
   - Bạn có thể mở URL này trong browser để xem ảnh

---

*📝 Last updated: 2024-12-19*

