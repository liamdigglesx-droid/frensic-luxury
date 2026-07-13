// Replace with your Paystack PUBLIC key (starts with pk_test_ or pk_live_)
// Found in your Paystack Dashboard → Settings → API Keys & Webhooks
export const PAYSTACK_PUBLIC_KEY = 'pk_test_YOUR_PAYSTACK_PUBLIC_KEY_HERE';

export function initPaystack({ email, amount, ref, onSuccess, onClose }) {
  if (!window.PaystackPop) {
    alert('Payment gateway not loaded. Please refresh the page.');
    return;
  }
  if (PAYSTACK_PUBLIC_KEY.includes('YOUR_PAYSTACK')) {
    alert('Please configure your Paystack public key in src/lib/paystack.js');
    return;
  }
  const handler = window.PaystackPop.setup({
    key: PAYSTACK_PUBLIC_KEY,
    email,
    amount: Math.round(amount * 100),
    currency: 'NGN',
    ref: ref || 'FRENSIC_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5).toUpperCase(),
    callback: onSuccess,
    onClose: onClose || (() => {}),
  });
  handler.openIframe();
}