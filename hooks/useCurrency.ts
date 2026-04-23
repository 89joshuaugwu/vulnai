import { useState, useEffect } from "react";

interface LocationData {
  currency: string;
  country: string;
  countryCode: string;
}

export function useCurrency() {
  const [currency, setCurrency] = useState<string>("USD");
  const [exchangeRate, setExchangeRate] = useState<number>(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLocationAndCurrency() {
      try {
        // 1. Get user location and currency from IP
        const locResponse = await fetch("https://ipapi.co/json/");
        if (!locResponse.ok) throw new Error("Failed to fetch location");
        const locData = await locResponse.json();
        
        const userCurrency = locData.currency || "USD";
        setCurrency(userCurrency);

        // 2. If it's not USD, fetch the exchange rate
        if (userCurrency !== "USD") {
          const rateResponse = await fetch(`https://open.er-api.com/v6/latest/USD`);
          if (rateResponse.ok) {
            const rateData = await rateResponse.json();
            if (rateData.rates && rateData.rates[userCurrency]) {
              setExchangeRate(rateData.rates[userCurrency]);
            }
          }
        }
      } catch (error) {
        console.error("Failed to fetch currency data:", error);
        // Fallback to USD
        setCurrency("USD");
        setExchangeRate(1);
      } finally {
        setLoading(false);
      }
    }

    fetchLocationAndCurrency();
  }, []);

  const formatPrice = (usdAmount: number) => {
    if (loading) return "...";
    
    const convertedAmount = usdAmount * exchangeRate;
    
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
      maximumFractionDigits: 0,
    }).format(convertedAmount);
  };

  return { currency, formatPrice, loading, exchangeRate };
}
