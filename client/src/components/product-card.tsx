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

  return (
    <div 
      className="nike-card overflow-hidden"
      data-testid={`card-product-${product.id}`}
    >
      {/* Image Container - Nike style: large, prominent product image */}
      <div className="relative overflow-hidden aspect-square">
        <img 
          src={product.imageUrl || "https://images.unsplash.com/photo-1509228468518-180dd4864904?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400"} 
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
          data-testid={`img-product-${product.id}`}
        />
        
        {/* Like Button - Nike minimal style */}
        <button 
          onClick={handleLike}
          className={`absolute top-4 right-4 w-10 h-10 flex items-center justify-center transition-all duration-200 ${
            isLiked 
              ? "text-red-500" 
              : "text-gray-400 hover:text-gray-600"
          }`}
          data-testid={`button-like-${product.id}`}
        >
          <Heart className={`h-6 w-6 ${isLiked ? "fill-current" : ""}`} />
        </button>

        {/* Class Badge - Nike minimal style */}
        <div className="absolute top-4 left-4 bg-black text-white px-3 py-1 text-xs font-bold tracking-wide uppercase" data-testid={`text-class-${product.id}`}>
          Grade {product.class}
        </div>
      </div>

      {/* Content - Nike minimal style */}
      <div className="p-6">
        <div className="mb-3">
          <h3 
            className="font-bold text-xl text-black mb-1 line-clamp-2 leading-tight" 
            data-testid={`text-name-${product.id}`}
          >
            {product.name}
          </h3>
          <p 
            className="text-sm text-gray-500 uppercase tracking-wide font-medium" 
            data-testid={`text-section-${product.id}`}
          >
            Section {product.section}
          </p>
        </div>

        {/* Price - Nike style bold pricing */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <span className="text-2xl font-black text-black" data-testid={`text-price-${product.id}`}>
              ${product.price}
            </span>
          </div>
          <div className="flex items-center space-x-1 text-gray-400">
            <span className="text-sm font-medium">{product.likes || 0}</span>
            <Heart className="h-4 w-4 fill-current" />
          </div>
        </div>

        {/* Buy Button - Nike style */}
        <Button 
          onClick={() => onPurchase(product)}
          className="nike-btn w-full"
          data-testid={`button-buy-${product.id}`}
        >
          Add to Cart
        </Button>
      </div>
    </div>
  );
}
