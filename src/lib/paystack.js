export const PAYSTACK_PUBLIC_KEY = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || '';

export async function initPaystack({ email, amount, ref, metadata, onSuccess, onClose }) {
  if (!/^pk_(test|live)_/.test(PAYSTACK_PUBLIC_KEY)) throw new Error('Paystack public key is not configured.');
  if (!ref) throw new Error('A server-generated payment reference is required.');
  const { default: PaystackPop } = await import('@paystack/inline-js');
  const popup = new PaystackPop();
  popup.newTransaction({
    key: PAYSTACK_PUBLIC_KEY,
    email,
    amount: Math.round(Number(amount) * 100),
    currency: 'NGN',
    reference: ref,
    metadata,
    onSuccess,
    onCancel: onClose || (() => {}),
    onError: () => onClose?.(),
  });
}
