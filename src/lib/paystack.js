export const PAYSTACK_PUBLIC_KEY = 'pk_live_b6e71ec92562ab614f93c9e7a7de85c5b13a8af';

function waitForPaystack() {
  return new Promise((resolve, reject) => {
    // Already loaded
    if (window.PaystackPop) return resolve();

    const script = document.getElementById('paystack-inline-js');
    if (!script) return reject(new Error('Paystack script not found'));

    // Already finished loading but PaystackPop not set — shouldn't happen, but guard
    if (script.dataset.loaded === 'true') return resolve();

    script.addEventListener('load', () => resolve());
    script.addEventListener('error', () => reject(new Error('Paystack script failed to load')));
  });
}

export async function initPaystack({ email, amount, ref, onSuccess, onClose }) {
  try {
    await waitForPaystack();
  } catch (e) {
    alert('Payment gateway failed to load. Please check your connection and try again.');
    return;
  }

  if (!window.PaystackPop) {
    alert('Payment gateway unavailable. Please refresh the page and try again.');
    return;
  }

  const handler = window.PaystackPop.setup({
    key: PAYSTACK_PUBLIC_KEY,
    email,
    amount: Math.round(amount * 100), // kobo
    currency: 'NGN',
    ref: ref || `FRENSIC_${Date.now()}_${Math.random().toString(36).substr(2, 5).toUpperCase()}`,
    callback: onSuccess,
    onClose: onClose || (() => {}),
  });

  handler.openIframe();
}