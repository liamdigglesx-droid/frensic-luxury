// Replace with your Paystack PUBLIC key (starts with pk_test_ or pk_live_)
// Found in your Paystack Dashboard → Settings → API Keys & Webhooks
export const PAYSTACK_PUBLIC_KEY = 'pk_test_51eb9fb4943d1cd4bf9f00e48155d99f7aa9f337';

export function initPaystack({ email, amount, ref, onSuccess, onClose }) {
  if (!window.PaystackPop) {
    alert('Payment gateway not loaded. Please refresh the page.');
    return;
  }
  // key is set — proceed
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