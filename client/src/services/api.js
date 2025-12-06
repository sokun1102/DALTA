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
  updateOrderStatus: (id, status) => API.put(`/orders/${id}/status`, { status }),
  getRevenueStats: (startDate, endDate) => {
    const params = {};
    if (startDate && startDate !== null && startDate !== '') {
      params.startDate = startDate;
    }
    if (endDate && endDate !== null && endDate !== '') {
      params.endDate = endDate;
    }
    return API.get('/orders/stats/revenue', { params });
  }
};

// Thêm các hàm helper cho payment methods
export const paymentMethodAPI = {
  getPaymentMethods: () => API.get('/payment-methods'),
  getPaymentMethodById: (id) => API.get(`/payment-methods/${id}`),
  createPaymentMethod: (data) => API.post('/payment-methods', data),
  updatePaymentMethod: (id, data) => API.put(`/payment-methods/${id}`, data),
  deletePaymentMethod: (id) => API.delete(`/payment-methods/${id}`),
  setDefaultPaymentMethod: (id) => API.put(`/payment-methods/${id}/default`),
};

// Thêm các hàm helper cho reviews
export const reviewAPI = {
  getProductReviews: (productId) => API.get(`/reviews/product/${productId}`),
  getUserReview: (productId) => API.get(`/reviews/product/${productId}/user`),
  createOrUpdateReview: (productId, data) => API.post(`/reviews/product/${productId}`, data),
  deleteReview: (reviewId) => API.delete(`/reviews/${reviewId}`),
};

export default API;
