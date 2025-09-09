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

  const getClassTheme = (classNum: number) => {
    const themes = {
      6: "grade-6-theme",
      7: "grade-7-theme", 
      8: "grade-8-theme",
      9: "grade-9-theme",
      10: "grade-10-theme",
      11: "grade-11-theme",
      12: "grade-12-theme",
    };
    return themes[classNum as keyof typeof themes] || "grade-6-theme";
  };

  const getClassAccent = (classNum: number) => {
    const accents = {
      6: "from-blue-500 to-cyan-500",
      7: "from-purple-500 to-violet-500", 
      8: "from-green-500 to-emerald-500",
      9: "from-yellow-500 to-orange-500",
      10: "from-pink-500 to-rose-500",
      11: "from-orange-500 to-red-500",
      12: "from-indigo-500 to-purple-500",
    };
    return accents[classNum as keyof typeof accents] || "from-blue-500 to-cyan-500";
  };

  return (
    <div 
      className="group relative bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border border-gray-100 backdrop-blur-sm"
      data-testid={`card-product-${product.id}`}
    >
      {/* Class Theme Header */}
      <div className={`h-2 ${getClassTheme(product.class)}`} />
      
      {/* Image Container */}
      <div className="relative overflow-hidden">
        <img 
          src={product.imageUrl || "https://images.unsplash.com/photo-1509228468518-180dd4864904?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=250"} 
          alt={product.name}
          className="w-full h-56 object-cover group-hover:scale-110 transition-transform duration-500" 
          data-testid={`img-product-${product.id}`}
        />
        
        {/* Gradient Overlay */}
        <div className={`absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
        
        {/* Like Button */}
        <button 
          onClick={handleLike}
          className={`absolute top-4 right-4 w-10 h-10 rounded-full backdrop-blur-sm border border-white/30 flex items-center justify-center transition-all duration-300 ${
            isLiked 
              ? "bg-red-500 text-white shadow-lg scale-110" 
              : "bg-white/50 text-gray-600 hover:bg-white/80 hover:scale-110"
          }`}
          data-testid={`button-like-${product.id}`}
        >
          <Heart className={`h-5 w-5 ${isLiked ? "fill-current" : ""}`} />
        </button>

        {/* Class Badge */}
        <div className={`absolute top-4 left-4 px-3 py-1 rounded-full text-sm font-semibold ${getClassTheme(product.class)} shadow-lg`} data-testid={`text-class-${product.id}`}>
          Grade {product.class}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <div className="mb-4">
          <h3 
            className="font-bold text-lg text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors" 
            data-testid={`text-name-${product.id}`}
          >
            {product.name}
          </h3>
          <p 
            className="text-sm text-gray-500 font-medium" 
            data-testid={`text-section-${product.id}`}
          >
            Section {product.section}
          </p>
        </div>

        {/* Price */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-baseline space-x-1">
            <span className="text-3xl font-bold text-gray-900" data-testid={`text-price-${product.id}`}>
              ${product.price}
            </span>
            <span className="text-sm text-gray-500">USD</span>
          </div>
          <div className="flex items-center space-x-1 text-yellow-500">
            <span className="text-sm font-medium">{product.likes || 0}</span>
            <Heart className="h-4 w-4 fill-current" />
          </div>
        </div>

        {/* Buy Button */}
        <Button 
          onClick={() => onPurchase(product)}
          className={`w-full h-12 rounded-xl font-semibold text-white bg-gradient-to-r ${getClassAccent(product.class)} hover:shadow-lg transform hover:scale-105 transition-all duration-300 border-0`}
          data-testid={`button-buy-${product.id}`}
        >
          Buy Now
        </Button>
      </div>

      {/* Hover Glow Effect */}
      <div className={`absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none bg-gradient-to-r ${getClassAccent(product.class)} blur-xl -z-10`} />
    </div>
  );
}
