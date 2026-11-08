import { ApiError, readRawBody, requireMethod, sendError } from './_lib/http.js';
import addBookingToCalendar from './_lib/routes/addBookingToCalendar.js';
import bookingStats from './_lib/routes/bookingStats.js';
import checkAvailability from './_lib/routes/checkAvailability.js';
import createBooking from './_lib/routes/createBooking.js';
import data from './_lib/routes/data.js';
import manageStaff from './_lib/routes/manageStaff.js';
import paystackWebhook from './_lib/routes/paystackWebhook.js';
import prepareReceiptUpload from './_lib/routes/prepareReceiptUpload.js';
import sendBookingConfirmation from './_lib/routes/sendBookingConfirmation.js';
import sendPaidBookingSlack from './_lib/routes/sendPaidBookingSlack.js';
import submitReceipt from './_lib/routes/submitReceipt.js';
import verifyAdminCredentials from './_lib/routes/verifyAdminCredentials.js';
import verifyPayment from './_lib/routes/verifyPayment.js';

// One Vercel function serves the existing flat /api/<action> URLs. This stays
// within Hobby's function limit without moving trust checks into the browser.
const routes = Object.freeze({
  addBookingToCalendar,
  bookingStats,
  checkAvailability,
  createBooking,
  data,
  manageStaff,
  paystackWebhook,
  prepareReceiptUpload,
  sendBookingConfirmation,
  sendPaidBookingSlack,
  submitReceipt,
  verifyAdminCredentials,
  verifyPayment,
});

export const config = Object.freeze({ api: { bodyParser: false } });

export async function dispatch(req, res, action) {
  try {
    if (typeof action !== 'string' || !Object.hasOwn(routes, action)) {
      throw new ApiError(404, 'API route not found.', 'not_found');
    }
    requireMethod(req);
    // The webhook verifies the original bytes itself. Every other route gets a
    // bounded JSON body here because body parsing is disabled for the function.
    if (action !== 'paystackWebhook') {
      const raw = await readRawBody(req);
      let body = {};
      if (raw.length) {
        try { body = JSON.parse(raw.toString('utf8')); }
        catch { throw new ApiError(400, 'Request body must be valid JSON.', 'invalid_json'); }
      }
      if (!body || typeof body !== 'object' || Array.isArray(body)) {
        throw new ApiError(400, 'Request body must be a JSON object.', 'invalid_json');
      }
      req.body = body;
    }
    return await routes[action](req, res);
  } catch (error) { return sendError(res, error); }
}

export default function handler(req, res) {
  return dispatch(req, res, req.query?.__frensic_route);
}
