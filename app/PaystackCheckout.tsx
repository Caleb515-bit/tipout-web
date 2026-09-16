'use client';
import { PaystackButton } from 'react-paystack';

export default function PaystackCheckout({ email, amount, publicKey }: { email: string; amount: number; publicKey: string }) {
  const componentProps = {
    email,
    amount: amount * 100,
    publicKey,
    text: 'Continue to Payment',
    onSuccess: (reference: { reference: string }) => {
      alert(`Payment successful! Reference: ${reference.reference}`);
    },
    onClose: () => {
      alert('Transaction closed.');
    },
  };

  return (
    <PaystackButton
      className="w-full bg-[#C08552] text-[#14171C] font-bold py-4 rounded-2xl shadow-lg hover:opacity-95 transition tracking-wide text-sm flex items-center justify-center"
      {...componentProps}
    />
  );
}