import { useState, useEffect } from "react";

export function useLikes() {
  const [likedProducts, setLikedProducts] = useState<string[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem("likedProducts");
    if (stored) {
      setLikedProducts(JSON.parse(stored));
    }
  }, []);

  const toggleLike = (productId: string) => {
    setLikedProducts(prev => {
      const updated = prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId];
      
      localStorage.setItem("likedProducts", JSON.stringify(updated));
      return updated;
    });
  };

  const isLiked = (productId: string) => likedProducts.includes(productId);

  return { likedProducts, toggleLike, isLiked, count: likedProducts.length };
}

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      return initialValue;
    }
  });

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error("Error saving to localStorage:", error);
    }
  };

  return [storedValue, setValue] as const;
}
