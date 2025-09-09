import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Navigation from "@/components/navigation";
import ProductCard from "@/components/product-card";
import PurchaseModal from "@/components/purchase-modal";
import SuccessModal from "@/components/success-modal";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Product } from "@shared/schema";
import { Grid, List } from "lucide-react";

export default function Home() {
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
    setSelectedProduct(product);
    setShowPurchaseModal(true);
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <Navigation />
      
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-purple-600/10 to-pink-600/10" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-16">
            <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-6" data-testid="text-hero-title">
              Buy & Sell Within
              <br />Your Class
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto" data-testid="text-hero-description">
              Connect with classmates to find textbooks, supplies, and more. Safe, easy, and designed for students.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                className="h-14 px-8 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl font-semibold text-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                data-testid="button-browse-products"
              >
                🔍 Browse Products
              </Button>
              <Button 
                className="h-14 px-8 bg-white/50 backdrop-blur-sm border border-white/30 text-gray-700 rounded-2xl font-semibold text-lg hover:bg-white/80 transition-all duration-300"
                data-testid="button-start-selling"
              >
                💰 Start Selling
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Sorting */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
        <div className="bg-white/70 backdrop-blur-xl rounded-3xl border border-white/20 p-6 shadow-lg">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex flex-wrap gap-6">
              <div className="flex items-center space-x-3">
                <label className="text-sm font-semibold text-gray-700">Filter by Class:</label>
                <Select value={classFilter || "all"} onValueChange={(value) => setClassFilter(value === "all" ? "" : value)}>
                  <SelectTrigger className="w-40 h-12 rounded-xl bg-white/50 border-white/30 backdrop-blur-sm" data-testid="select-class-filter">
                    <SelectValue placeholder="All Classes" />
                  </SelectTrigger>
                  <SelectContent className="bg-white/95 backdrop-blur-xl border-white/20 rounded-xl">
                    <SelectItem value="all">All Classes</SelectItem>
                    <SelectItem value="6">🎯 Grade 6</SelectItem>
                    <SelectItem value="7">🎯 Grade 7</SelectItem>
                    <SelectItem value="8">🎯 Grade 8</SelectItem>
                    <SelectItem value="9">🎯 Grade 9</SelectItem>
                    <SelectItem value="10">🎯 Grade 10</SelectItem>
                    <SelectItem value="11">🎯 Grade 11</SelectItem>
                    <SelectItem value="12">🎯 Grade 12</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center space-x-3">
                <label className="text-sm font-semibold text-gray-700">Sort by:</label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-48 h-12 rounded-xl bg-white/50 border-white/30 backdrop-blur-sm" data-testid="select-sort">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white/95 backdrop-blur-xl border-white/20 rounded-xl">
                    <SelectItem value="popular">⭐ Most Popular</SelectItem>
                    <SelectItem value="newest">🆕 Newest</SelectItem>
                    <SelectItem value="price-low">💰 Price: Low to High</SelectItem>
                    <SelectItem value="price-high">💎 Price: High to Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-sm font-semibold text-gray-600" data-testid="text-items-count">
                {products.length} items found
              </span>
              <div className="flex bg-white/50 backdrop-blur-sm border border-white/30 rounded-xl overflow-hidden">
                <button 
                  className={`px-4 py-2 transition-all duration-300 ${viewMode === "grid" ? "bg-blue-500 text-white" : "text-gray-600 hover:bg-white/50"}`}
                  onClick={() => setViewMode("grid")}
                  data-testid="button-grid-view"
                >
                  <Grid className="h-4 w-4" />
                </button>
                <button 
                  className={`px-4 py-2 transition-all duration-300 ${viewMode === "list" ? "bg-blue-500 text-white" : "text-gray-600 hover:bg-white/50"}`}
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

      {/* Product Grid - Double Layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
        {products.length === 0 ? (
          <div className="text-center py-12" data-testid="text-no-products">
            <div className="bg-white/50 backdrop-blur-sm rounded-3xl border border-white/20 p-12 shadow-lg">
              <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-r from-gray-300 to-gray-400 rounded-full flex items-center justify-center">
                <span className="text-3xl">📦</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-700 mb-4">No products found</h3>
              <p className="text-gray-500 mb-6">Try adjusting your filters or check back later for new listings.</p>
              <Button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-xl">
                Browse All Classes
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-8">
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

      {/* Footer */}
      <footer className="relative bg-white/30 backdrop-blur-xl border-t border-white/20 mt-24">
        <div className="max-w-7xl mx-auto px-4 py-16">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
            <div>
              <h3 className="text-2xl font-bold gradient-text mb-4">ClassStore</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                The trusted marketplace for students to buy and sell textbooks and school supplies within their classes.
              </p>
            </div>
            
            <div>
              <h4 className="font-bold text-gray-800 mb-6">For Buyers</h4>
              <ul className="space-y-3 text-sm text-gray-600">
                <li><a href="#" className="hover:text-blue-600 transition-colors flex items-center">🛍️ Browse Products</a></li>
                <li><a href="#" className="hover:text-blue-600 transition-colors flex items-center">ℹ️ How It Works</a></li>
                <li><a href="#" className="hover:text-blue-600 transition-colors flex items-center">🔒 Safety Guidelines</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-bold text-gray-800 mb-6">For Sellers</h4>
              <ul className="space-y-3 text-sm text-gray-600">
                <li><a href="#" className="hover:text-blue-600 transition-colors flex items-center">💰 Start Selling</a></li>
                <li><a href="#" className="hover:text-blue-600 transition-colors flex items-center">📚 Seller Guide</a></li>
                <li><a href="#" className="hover:text-blue-600 transition-colors flex items-center">💳 Commission Info</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-bold text-gray-800 mb-6">Support</h4>
              <ul className="space-y-3 text-sm text-gray-600">
                <li><a href="#" className="hover:text-blue-600 transition-colors flex items-center">❓ Help Center</a></li>
                <li><a href="#" className="hover:text-blue-600 transition-colors flex items-center">📞 Contact Us</a></li>
                <li><a href="#" className="hover:text-blue-600 transition-colors flex items-center">📄 Terms of Service</a></li>
                <li><a href="#" className="hover:text-blue-600 transition-colors flex items-center">🔐 Privacy Policy</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-white/20 pt-8 text-center">
            <p className="text-gray-500 text-sm">&copy; 2024 ClassStore. All rights reserved. Made with ❤️ for students.</p>
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
