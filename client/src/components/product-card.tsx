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

  const isNewProduct = () => {
    return product.createdAt && new Date(product.createdAt).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000;
  };

  const formatPrice = (price: string) => {
    const numPrice = parseFloat(price);
    return numPrice.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  return (
    <div 
      className={`bg-white transition-all duration-300 ${product.isSoldOut ? 'opacity-60' : 'hover:shadow-sm'}`}
      data-testid={`card-product-${product.id}`}
    >
      {/* Image Container - Exact Nike design matching screenshot */}
      <div className="relative bg-gray-50">
        <img 
          src={product.imageUrl || "https://images.unsplash.com/photo-1509228468518-180dd4864904?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400"} 
          alt={product.name}
          className="w-full aspect-square object-cover" 
          data-testid={`img-product-${product.id}`}
        />
        
        {/* Status Label - Only show orange "Just In" for new products */}
        {isNewProduct() && (
          <div className="absolute top-3 left-3 bg-orange-600 text-white px-2 py-1 text-xs font-medium">
            Just In
          </div>
        )}
        
        {/* Sold Out Overlay */}
        {product.isSoldOut && (
          <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
            <span className="bg-white text-black px-4 py-2 text-sm font-semibold rounded">
              SOLD OUT
            </span>
          </div>
        )}
      </div>

      {/* Content - Exact Nike style from screenshot */}
      <div className="pt-3 pb-4">
        {/* Product Name - Exact Nike typography */}
        <h3 
          className="text-base font-semibold text-black mb-1 leading-tight" 
          data-testid={`text-name-${product.id}`}
        >
          {product.name}
        </h3>
        
        {/* Category/Description - Nike style secondary text */}
        <p 
          className="text-gray-500 text-sm mb-1" 
          data-testid={`text-category-${product.id}`}
        >
          {product.category || "Student Item"}
        </p>
        
        {/* Color indicator - Nike style */}
        <p className="text-gray-500 text-sm mb-4">
          1 Colour
        </p>

        {/* Price - Exact Nike format: MRP : ₹ price */}
        <div>
          <span className="text-black font-semibold text-base" data-testid={`text-price-${product.id}`}>
            MRP : ₹ {formatPrice(product.price)}
          </span>
        </div>
      </div>
    </div>
  );
}
