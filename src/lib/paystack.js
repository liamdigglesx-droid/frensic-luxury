export const PAYSTACK_PUBLIC_KEY = 'pk_test_51eb9fb4943d1cd4bf9f00e48155d99f7aa9f337';

function loadPaystackScript() {
  return new Promise((resolve, reject) => {
    if (window.PaystackPop) return resolve();
    const existing = document.getElementById('paystack-inline-js');
    if (existing) {
      // Script tag exists but not loaded yet — wait for it
      existing.addEventListener('load', resolve);
      existing.addEventListener('error', reject);
      return;
    }
    const script = document.createElement('script');
    script.id = 'paystack-inline-js';
    script.src = 'https://js.paystack.co/v1/inline.js';
    script.async = true;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

export async function initPaystack({ email, amount, ref, onSuccess, onClose }) {
  try {
    await loadPaystackScript();
  } catch (e) {
    alert('Payment gateway failed to load. Please check your internet connection and try again.');
    return;
  }

  if (!window.PaystackPop) {
    alert('Payment gateway not available. Please refresh and try again.');
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