import { useState } from "react";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Product } from "@shared/schema";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface ProductCardProps {
  product: Product;
  onPurchase: (product: Product) => void;
}

export default function ProductCard({ product, onPurchase }: ProductCardProps) {
  const [isLiked, setIsLiked] = useState(() => {
    const likedProducts = JSON.parse(localStorage.getItem("likedProducts") || "[]");
    return likedProducts.includes(product.id);
  });

  const queryClient = useQueryClient();

  const likeMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", `/api/products/${product.id}/like`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
    },
  });

  const handleLike = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const likedProducts = JSON.parse(localStorage.getItem("likedProducts") || "[]");
    
    if (isLiked) {
      const updated = likedProducts.filter((id: string) => id !== product.id);
      localStorage.setItem("likedProducts", JSON.stringify(updated));
      setIsLiked(false);
    } else {
      const updated = [...likedProducts, product.id];
      localStorage.setItem("likedProducts", JSON.stringify(updated));
      setIsLiked(true);
      likeMutation.mutate();
    }
  };

  const getStatusLabel = () => {
    if (product.isSoldOut) return "Sold Out";
    if (product.createdAt && new Date(product.createdAt).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000) {
      return "Just In";
    }
    return "Promo Exclusion";
  };

  const getStatusColor = () => {
    if (product.isSoldOut) return "bg-gray-500";
    return "bg-red-500";
  };

  return (
    <div 
      className={`bg-white transition-all duration-300 ${product.isSoldOut ? 'opacity-60' : 'hover:shadow-md'}`}
      data-testid={`card-product-${product.id}`}
    >
      {/* Image Container - Exact Nike mobile design */}
      <div className="relative">
        <img 
          src={product.imageUrl || "https://images.unsplash.com/photo-1509228468518-180dd4864904?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400"} 
          alt={product.name}
          className="w-full h-80 object-cover" 
          data-testid={`img-product-${product.id}`}
        />
        
        {/* Status Label - Exact Nike style */}
        <div className={`absolute top-4 left-4 ${getStatusColor()} text-white px-3 py-1 text-xs font-semibold`}>
          {getStatusLabel()}
        </div>

        {/* Like Button */}
        <button 
          onClick={handleLike}
          disabled={product.isSoldOut}
          className={`absolute top-4 right-4 w-8 h-8 flex items-center justify-center transition-all duration-200 ${
            isLiked 
              ? "text-red-500" 
              : "text-gray-400 hover:text-gray-600"
          } ${product.isSoldOut ? 'cursor-not-allowed' : ''}`}
          data-testid={`button-like-${product.id}`}
        >
          <Heart className={`h-5 w-5 ${isLiked ? "fill-current" : ""}`} />
        </button>
      </div>

      {/* Content - Exact Nike style from screenshot */}
      <div className="p-4">
        {/* Product Name - Exact Nike typography */}
        <h3 
          className="text-lg font-semibold text-black mb-1 leading-tight" 
          data-testid={`text-name-${product.id}`}
        >
          {product.name}
        </h3>
        
        {/* Category/Description - Nike style secondary text */}
        <p 
          className="text-gray-500 text-sm mb-1" 
          data-testid={`text-category-${product.id}`}
        >
          {product.category || "Student Item"} • Grade {product.class}
        </p>
        
        {/* Color indicator - Nike style */}
        <p className="text-gray-500 text-sm mb-3">
          1 Colour
        </p>

        {/* Price - Exact Nike format: MRP : ₹ price */}
        <div className="mb-4">
          <span className="text-black font-semibold text-lg" data-testid={`text-price-${product.id}`}>
            MRP : ₹ {product.price}
          </span>
        </div>

        {/* Buy Button or Sold Out Status */}
        {product.isSoldOut ? (
          <Button 
            disabled
            className="w-full bg-gray-300 text-gray-500 cursor-not-allowed font-semibold py-3 rounded-full"
            data-testid={`button-soldout-${product.id}`}
          >
            SOLD OUT
          </Button>
        ) : (
          <Button 
            onClick={() => onPurchase(product)}
            className="w-full bg-black text-white hover:bg-gray-800 font-semibold py-3 rounded-full transition-colors duration-200"
            data-testid={`button-buy-${product.id}`}
          >
            BUY NOW
          </Button>
        )}
      </div>
    </div>
  );
}
