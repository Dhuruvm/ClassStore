import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import Navigation from "@/components/navigation";
import ProductCard from "@/components/product-card";
import PurchaseModal from "@/components/purchase-modal";
import SuccessModal from "@/components/success-modal";
import { Button } from "@/components/ui/button";
import { Product } from "@shared/schema";

export default function Home() {
  const [, setLocation] = useLocation();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["/api/products"],
    queryFn: async () => {
      const response = await fetch(`/api/products`);
      if (!response.ok) throw new Error("Failed to fetch products");
      return response.json();
    },
  });

  const handlePurchase = (product: Product) => {
    setLocation(`/order/${product.id}`);
  };

  const handlePurchaseSuccess = () => {
    setShowPurchaseModal(false);
    setShowSuccessModal(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-card rounded-lg border border-border overflow-hidden animate-pulse">
                <div className="w-full h-48 bg-muted" />
                <div className="p-4">
                  <div className="h-6 bg-muted rounded mb-2" />
                  <div className="h-4 bg-muted rounded mb-2" />
                  <div className="h-8 bg-muted rounded mb-3" />
                  <div className="h-10 bg-muted rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      
      {/* Nike-Style Hero Section */}
      <div className="bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="nike-text-hero text-black mb-6" data-testid="text-hero-title">
              JUST DO IT.
              <br />
              BUY. SELL. REPEAT.
            </h1>
            <p className="text-lg text-gray-600 mb-12 max-w-2xl mx-auto" data-testid="text-hero-description">
              Find the gear you need. Sell what you don't. All within your class.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <Button 
                className="nike-btn"
                data-testid="button-browse-products"
              >
                Shop Now
              </Button>
              <Button 
                className="nike-btn-secondary"
                data-testid="button-start-selling"
              >
                Sell Items
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Simple Header Section */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-black">All Items</h2>
            <span className="text-sm font-medium text-gray-600" data-testid="text-items-count">
              {products.length} Items Available
            </span>
          </div>
        </div>
      </div>

      {/* Nike-Style Product Grid - Double Layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {products.length === 0 ? (
          <div className="text-center py-24" data-testid="text-no-products">
            <h3 className="text-2xl font-bold text-black mb-4">Nothing Here</h3>
            <p className="text-gray-600 mb-8">Check back soon for new items or list your own!</p>
            <Button 
              className="nike-btn"
              onClick={() => setLocation("/sell")}
              data-testid="button-start-selling"
            >
              Start Selling
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-8">
            {products.map((product: Product) => (
              <ProductCard 
                key={product.id}
                product={product}
                onPurchase={handlePurchase}
              />
            ))}
          </div>
        )}
      </div>

      {/* Nike-Style Footer */}
      <footer className="bg-black text-white mt-24">
        <div className="max-w-7xl mx-auto px-4 py-16">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
            <div>
              <h3 className="text-xl font-black tracking-tighter uppercase mb-6">ClassStore</h3>
              <p className="text-gray-300 text-sm leading-relaxed">
                The marketplace for students. Find what you need. Sell what you don't.
              </p>
            </div>
            
            <div>
              <h4 className="font-bold text-white mb-6 uppercase tracking-wide text-sm">Shop</h4>
              <ul className="space-y-3 text-sm text-gray-300">
                <li><a href="#" className="hover:text-white transition-colors">New Arrivals</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Textbooks</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Supplies</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Sale</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-bold text-white mb-6 uppercase tracking-wide text-sm">Sell</h4>
              <ul className="space-y-3 text-sm text-gray-300">
                <li><a href="#" className="hover:text-white transition-colors">Start Selling</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Seller Guide</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Commission</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-bold text-white mb-6 uppercase tracking-wide text-sm">Help</h4>
              <ul className="space-y-3 text-sm text-gray-300">
                <li><a href="#" className="hover:text-white transition-colors">Contact Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Support</a></li>
                <li><button onClick={() => setLocation("/terms")} className="hover:text-white transition-colors text-left">Terms & Conditions</button></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 pt-8 text-center">
            <p className="text-gray-400 text-sm">&copy; 2024 ClassStore. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <PurchaseModal 
        product={selectedProduct}
        isOpen={showPurchaseModal}
        onClose={() => setShowPurchaseModal(false)}
        onSuccess={handlePurchaseSuccess}
      />
      
      <SuccessModal 
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
      />
    </div>
  );
}
