"use client";

import { usePaystackPayment } from "react-paystack";
import { useAuth } from "@/components/AuthProvider";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

interface PaystackButtonProps {
  amount: number; // in minor units (e.g., Kobo)
  currency: string;
  className?: string;
  onSuccessCallback?: () => void;
}

export default function PaystackButton({ amount, currency, className, onSuccessCallback }: PaystackButtonProps) {
  const { user } = useAuth();
  const router = useRouter();

  const config = {
    reference: (new Date()).getTime().toString(),
    email: user?.email || "",
    amount: amount,
    currency: currency,
    publicKey: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || "",
  };

  const initializePayment = usePaystackPayment(config);

  const onSuccess = (reference: any) => {
    toast.success("Payment successful! Verifying...");
    
    fetch("/api/verify-payment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reference: reference.reference, userId: user?.uid }),
    })
      .then((res) => res.json())
      .then(async (data) => {
        if (data.success && user) {
          toast.success("Welcome to Pro Tier!");
          
          // Update profile in Firestore
          const { doc, updateDoc } = await import("firebase/firestore");
          const { db } = await import("@/lib/firebase");
          await updateDoc(doc(db, "users", user.uid), { isPro: true });
          
          if (onSuccessCallback) onSuccessCallback();
          router.push("/dashboard");
        } else {
          toast.error("Failed to upgrade account. Contact support.");
        }
      })
      .catch(() => toast.error("Error verifying payment"));
  };

  const onClose = () => {
    toast("Payment window closed", { icon: "ℹ️" });
  };

  const handleClick = () => {
    if (!user) {
      toast.error("Please sign in or create an account first.");
      router.push("/signup");
      return;
    }
    initializePayment({ onSuccess, onClose });
  };

  return (
    <button onClick={handleClick} className={className}>
      Upgrade to Pro
    </button>
  );
}
