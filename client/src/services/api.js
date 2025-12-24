import axios from "axios";

const API = axios.create({
  baseURL: "http://10.106.23.17:5000/api", // Port 5000 - port của backend server
  timeout: 30000, // 30 giây - tăng timeout cho các request phức tạp như thống kê
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
  updateOrderStatus: (id, status) => API.put(`/orders/${id}/status`, { status }),
  getRevenueStats: (startDate, endDate) => {
    const params = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    return API.get('/orders/stats/revenue', { 
      params,
      timeout: 60000 // 60 giây cho request thống kê phức tạp
    });
  }
};

// Helper cho reviews
export const reviewAPI = {
  getProductReviews: (productId) => API.get(`/reviews/product/${productId}`),
  getUserReview: (productId) => API.get(`/reviews/product/${productId}/user`),
  createOrUpdateReview: (productId, payload) =>
    API.post(`/reviews/product/${productId}`, payload),
  deleteReview: (reviewId) => API.delete(`/reviews/${reviewId}`),
};

export default API;

// Summary: axios instance + setAuthToken + orderAPI helper (copy)
