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

  const getClassColor = (classNum: number) => {
    const colors = {
      6: "bg-blue-100 text-blue-800",
      7: "bg-green-100 text-green-800", 
      8: "bg-yellow-100 text-yellow-800",
      9: "bg-purple-100 text-purple-800",
      10: "bg-primary/10 text-primary",
      11: "bg-orange-100 text-orange-800",
      12: "bg-red-100 text-red-800",
    };
    return colors[classNum as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  return (
    <div 
      className="bg-card rounded-lg border border-border overflow-hidden hover:shadow-lg transition-shadow duration-300 fade-in"
      data-testid={`card-product-${product.id}`}
    >
      <img 
        src={product.imageUrl || "https://images.unsplash.com/photo-1509228468518-180dd4864904?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=250"} 
        alt={product.name}
        className="w-full h-48 object-cover" 
        data-testid={`img-product-${product.id}`}
      />
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div>
            <Badge 
              className={`mb-2 ${getClassColor(product.class)}`}
              data-testid={`text-class-${product.id}`}
            >
              Grade {product.class}
            </Badge>
            <h3 
              className="font-semibold text-card-foreground mb-1" 
              data-testid={`text-name-${product.id}`}
            >
              {product.name}
            </h3>
            <p 
              className="text-sm text-muted-foreground" 
              data-testid={`text-section-${product.id}`}
            >
              Section {product.section}
            </p>
          </div>
          <button 
            onClick={handleLike}
            className={`transition-colors ${isLiked ? "liked" : "text-muted-foreground hover:text-destructive"}`}
            data-testid={`button-like-${product.id}`}
          >
            <Heart className={`h-5 w-5 ${isLiked ? "fill-current" : ""}`} />
          </button>
        </div>
        <p 
          className="text-2xl font-bold text-secondary mb-3" 
          data-testid={`text-price-${product.id}`}
        >
          ${product.price}
        </p>
        <Button 
          onClick={() => onPurchase(product)}
          className="w-full"
          data-testid={`button-buy-${product.id}`}
        >
          Buy Now
        </Button>
      </div>
    </div>
  );
}
