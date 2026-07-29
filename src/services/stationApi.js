import request, { requestText } from "./api";

export const stationApi = {
  getStations: () => request("/stations"),

  getChargers: (id) => request(`/stations/${id}/chargers`),

  getReviews: (id) => request(`/stations/${id}/reviews`),

  // Backend returns 200 with a plain-text "Review added successfully" or
  // "Error: ..." body either way (API_REFERENCE.md) — normalize to
  // {ok, message} so callers don't need to know about the text quirk.
  addReview: async (id, review) => {
    const message = await requestText(`/stations/${id}/review`, {
      method: "POST",
      body: JSON.stringify(review),
    });

    return { ok: !message.startsWith("Error"), message };
  },
};

export default stationApi;
