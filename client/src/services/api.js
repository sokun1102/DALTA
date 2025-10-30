import axios from "axios";

const API = axios.create({
  baseURL: "http://192.168.2.23:5000/api", // nhớ thêm http://
  timeout: 5000, // tùy chọn: giúp tránh treo nếu backend không phản hồi
});

export const setAuthToken = (token) => {
  if (token) {
    API.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } else {
    delete API.defaults.headers.common["Authorization"];
  }
};

// Thêm các hàm helper cho orders
export const orderAPI = {
  getAllOrders: () => API.get('/orders'),
  getMyOrders: () => API.get('/orders/user-orders'), // endpoint cho user
  getOrderById: (id) => API.get(`/orders/${id}`),
  updateOrderStatus: (id, status) => API.put(`/orders/${id}/status`, { status })
};

export default API;
