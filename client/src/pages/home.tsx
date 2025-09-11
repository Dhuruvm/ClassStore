import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import Navigation from "@/components/navigation";
import ProductCard from "@/components/product-card";
import PurchaseModal from "@/components/purchase-modal";
import SuccessModal from "@/components/success-modal";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Product } from "@shared/schema";
import { Grid, List } from "lucide-react";

export default function Home() {
  const [, setLocation] = useLocation();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [classFilter, setClassFilter] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("popular");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["/api/products", classFilter, sortBy],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (classFilter) params.append("class", classFilter);
      if (sortBy) params.append("sort", sortBy);
      
      const response = await fetch(`/api/products?${params}`);
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

      {/* Filters Section - Nike minimal style */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex flex-wrap gap-6 items-center">
              <div className="flex items-center space-x-3">
                <label className="text-sm font-bold text-black uppercase tracking-wide">Grade:</label>
                <Select value={classFilter || "all"} onValueChange={(value) => setClassFilter(value === "all" ? "" : value)}>
                  <SelectTrigger className="w-32 h-10 bg-gray-50 border-0 rounded-none font-medium" data-testid="select-class-filter">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="6">Grade 6</SelectItem>
                    <SelectItem value="7">Grade 7</SelectItem>
                    <SelectItem value="8">Grade 8</SelectItem>
                    <SelectItem value="9">Grade 9</SelectItem>
                    <SelectItem value="10">Grade 10</SelectItem>
                    <SelectItem value="11">Grade 11</SelectItem>
                    <SelectItem value="12">Grade 12</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center space-x-3">
                <label className="text-sm font-bold text-black uppercase tracking-wide">Sort:</label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-40 h-10 bg-gray-50 border-0 rounded-none font-medium" data-testid="select-sort">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="popular">Popular</SelectItem>
                    <SelectItem value="newest">Newest</SelectItem>
                    <SelectItem value="price-low">Price: Low</SelectItem>
                    <SelectItem value="price-high">Price: High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="flex items-center space-x-6">
              <span className="text-sm font-medium text-gray-600" data-testid="text-items-count">
                {products.length} Items
              </span>
              <div className="flex border border-gray-200 rounded-none overflow-hidden">
                <button 
                  className={`px-3 py-2 transition-colors ${viewMode === "grid" ? "bg-black text-white" : "text-black hover:bg-gray-50"}`}
                  onClick={() => setViewMode("grid")}
                  data-testid="button-grid-view"
                >
                  <Grid className="h-4 w-4" />
                </button>
                <button 
                  className={`px-3 py-2 transition-colors ${viewMode === "list" ? "bg-black text-white" : "text-black hover:bg-gray-50"}`}
                  onClick={() => setViewMode("list")}
                  data-testid="button-list-view"
                >
                  <List className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Nike-Style Product Grid - Double Layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {products.length === 0 ? (
          <div className="text-center py-24" data-testid="text-no-products">
            <h3 className="text-2xl font-bold text-black mb-4">Nothing Here</h3>
            <p className="text-gray-600 mb-8">Check back soon for new items.</p>
            <Button className="nike-btn">
              Browse All Grades
            </Button>
          </div>
        ) : (
          <div className="space-y-12">
            {/* New Arrivals Section Header */}
            <div>
              <h2 className="text-2xl font-bold text-black mb-8">New Items</h2>
              
              {/* Nike-Style Double Grid Layout */}
              {products.length >= 2 && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
                  {/* Large Featured Product Card */}
                  <div className="lg:col-span-1">
                    <div className="relative bg-gray-50 rounded-lg overflow-hidden h-96">
                      <img 
                        src={products[0]?.imageUrl || "https://images.unsplash.com/photo-1509228468518-180dd4864904?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600"} 
                        alt={products[0]?.name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-8">
                        <h3 className="text-white text-3xl font-bold mb-2">{products[0]?.name}</h3>
                        <Button 
                          onClick={() => handlePurchase(products[0])}
                          className="bg-white text-black hover:bg-gray-200 font-semibold px-8 py-3 rounded-full"
                        >
                          Shop Now
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Medium Product Card */}
                  <div className="lg:col-span-1">
                    <ProductCard 
                      product={products[1]}
                      onPurchase={handlePurchase}
                    />
                  </div>
                </div>
              )}
              
              {/* Bottom 2x2 Grid */}
              {products.length > 2 && (
                <div>
                  <h3 className="text-lg font-semibold text-black mb-6">Just In</h3>
                  <div className="grid grid-cols-2 md:grid-cols-2 gap-4 md:gap-8">
                    {products.slice(2, 4).map((product: Product) => (
                      <ProductCard 
                        key={product.id}
                        product={product}
                        onPurchase={handlePurchase}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            {/* All Products Grid */}
            {products.length > 4 && (
              <div>
                <h2 className="text-2xl font-bold text-black mb-8">All Items</h2>
                <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-8">
                  {products.slice(4).map((product: Product) => (
                    <ProductCard 
                      key={product.id}
                      product={product}
                      onPurchase={handlePurchase}
                    />
                  ))}
                </div>
              </div>
            )}
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
                <li><a href="#" className="hover:text-white transition-colors">Terms</a></li>
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
