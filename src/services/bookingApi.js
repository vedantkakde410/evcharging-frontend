import request from "./api";

export const bookingApi = {
  getUserBookings: (userId) => request(`/users/${userId}/bookings`),
};

export default bookingApi;
