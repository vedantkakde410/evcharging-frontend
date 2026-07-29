import { requestRoot, requestTextRoot } from "./api";

async function writeAndNormalize(url, options) {
  const message = await requestTextRoot(url, options);
  return { ok: !message.startsWith("Error"), message };
}

export const ownerApi = {
  getRevenue: (ownerId) => requestRoot(`/owner/reports/revenue/${ownerId}`),
  getEnergy: (ownerId) => requestRoot(`/owner/reports/energy/${ownerId}`),
  getBookings: (ownerId) => requestRoot(`/owner/reports/bookings/${ownerId}`),

  // Known backend bug (API_REFERENCE.md): the INSERT statement binds two
  // placeholders for three columns (owner_id is never set) — this call is
  // expected to return {ok: false} until that's fixed server-side.
  addStation: (station) =>
    writeAndNormalize("/owner/stations", {
      method: "POST",
      body: JSON.stringify(station),
    }),

  addCharger: (charger) =>
    writeAndNormalize("/owner/chargers", {
      method: "POST",
      body: JSON.stringify(charger),
    }),

  updatePrice: (chargerId, pricePerKwh) =>
    writeAndNormalize(`/owner/chargers/${chargerId}/price`, {
      method: "PUT",
      body: JSON.stringify({ pricePerKwh }),
    }),
};

export default ownerApi;
