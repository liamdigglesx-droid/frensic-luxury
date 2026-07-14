export const PAYSTACK_PUBLIC_KEY = 'pk_live_b6e71ec92562ab614f93c9e7a7de85c5b13a8af';

function waitForPaystack() {
  return new Promise((resolve, reject) => {
    if (window.PaystackPop) return resolve();

    const script = document.getElementById('paystack-inline-js');
    if (!script) return reject(new Error('Paystack script not found'));
    if (script.dataset.loaded === 'true') return reject(new Error('Paystack did not initialize'));

    const timeout = window.setTimeout(() => reject(new Error('Paystack timed out')), 10000);
    script.addEventListener('load', () => {
      window.clearTimeout(timeout);
      window.PaystackPop ? resolve() : reject(new Error('Paystack did not initialize'));
    }, { once: true });
    script.addEventListener('error', () => {
      window.clearTimeout(timeout);
      reject(new Error('Paystack script failed to load'));
    }, { once: true });
  });
}

export async function initPaystack({ email, amount, ref, onSuccess, onClose }) {
  await waitForPaystack();

  const popup = new window.PaystackPop();
  popup.newTransaction({
    key: PAYSTACK_PUBLIC_KEY,
    email,
    amount: Math.round(amount * 100),
    currency: 'NGN',
    reference: ref || `FRENSIC_${Date.now()}_${Math.random().toString(36).slice(2, 7).toUpperCase()}`,
    onSuccess,
    onCancel: onClose || (() => {}),
  });
}