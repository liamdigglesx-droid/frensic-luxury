// Supabase projects may use different email OTP lengths. Keep the form compatible
// without weakening verification: the server still validates the actual token.
export const MIN_EMAIL_OTP_LENGTH = 6;
export const MAX_EMAIL_OTP_LENGTH = 10;
export const MIN_ADMIN_PASSWORD_LENGTH = 12;

export function normalizeEmailOtp(value) {
  return String(value ?? '').replace(/\D/g, '').slice(0, MAX_EMAIL_OTP_LENGTH);
}

export function isEmailOtp(value) {
  return new RegExp(`^\\d{${MIN_EMAIL_OTP_LENGTH},${MAX_EMAIL_OTP_LENGTH}}$`).test(value);
}
