import { useState, useEffect } from "react";

export function useCurrency() {
  // We statically enforce NGN for consistent pricing across the platform
  const currency = "NGN";
  const exchangeRate = 1;
  const loading = false;

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return { currency, formatPrice, loading, exchangeRate };
}
