import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Search, Heart, UserCircle, Package, BarChart3 } from "lucide-react";
import { CustomerService } from "@/lib/customer";
import { SellerService } from "@/lib/seller";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function Navigation() {
  const [location] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const likedCount = JSON.parse(localStorage.getItem("likedProducts") || "[]").length;
  const customerOrders = CustomerService.getCustomerOrders();
  const pendingOrdersCount = customerOrders.filter(order => order.status === 'pending' || order.status === 'confirmed').length;
  
  // Seller dashboard data
  const hasSeller = SellerService.hasSellerData();
  const pendingProductsCount = SellerService.getPendingProductsCount();

  const navItems = ["New", "Men", "Women", "Kids", "Sale"];

  return (
    <nav className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 sticky top-0 z-50 shadow-lg backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo - Eye-catching with gradient text */}
          <div className="flex items-center space-x-8">
            <Link href="/" data-testid="link-home">
              <h1 className="text-2xl font-black tracking-tighter bg-gradient-to-r from-yellow-400 via-pink-300 to-white bg-clip-text text-transparent uppercase hover:scale-105 transition-transform duration-300">
                ClassStore
              </h1>
            </Link>
            
            {/* Enhanced navigation menu with hover effects */}
            <div className="hidden lg:flex space-x-8">
              {navItems.map((item) => (
                <Link key={item} href={item === "New" ? "/" : `/${item.toLowerCase()}`}>
                  <span className="text-white font-medium hover:text-yellow-300 hover:scale-110 transition-all duration-300 cursor-pointer uppercase tracking-wide text-sm relative group">
                    {item}
                    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-yellow-400 to-pink-400 group-hover:w-full transition-all duration-300"></span>
                  </span>
                </Link>
              ))}
            </div>
          </div>
          
          {/* Enhanced Search Bar with gradient effects */}
          <div className="hidden md:block flex-1 max-w-md mx-8">
            <div className="relative">
              <Input
                type="text"
                placeholder="Search for amazing products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 h-10 bg-white/20 backdrop-blur-sm border-2 border-white/30 rounded-full focus:bg-white/90 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-300 transition-all duration-300 text-white placeholder-white/70"
                data-testid="input-search"
              />
              <Search className="absolute left-3 top-3 h-4 w-4 text-white/80" />
            </div>
          </div>
          
          {/* Enhanced Right side icons with vibrant effects */}
          <div className="flex items-center space-x-4">
            <button className="md:hidden p-2 rounded-full hover:bg-white/20 transition-all duration-300" data-testid="button-mobile-search">
              <Search className="h-6 w-6 text-white hover:text-yellow-300 transition-colors duration-300" />
            </button>
            
            <Link href="/sell">
              <Button 
                className={`text-sm font-medium transition-all duration-300 px-6 py-2 rounded-full ${
                  location === "/sell" 
                    ? "bg-gradient-to-r from-yellow-400 to-orange-500 text-black hover:from-yellow-300 hover:to-orange-400 shadow-lg" 
                    : "bg-white/20 text-white hover:bg-white/30 hover:text-yellow-300 backdrop-blur-sm border border-white/30"
                } transform hover:scale-105`}
                data-testid="button-sell"
              >
                Sell
              </Button>
            </Link>
            
            {hasSeller && (
              <Link href="/dashboard">
                <button className="relative p-2 rounded-full hover:bg-white/20 transition-all duration-300 transform hover:scale-110" data-testid="button-dashboard">
                  <BarChart3 className="h-6 w-6 text-white hover:text-yellow-300 transition-colors duration-300" />
                  {pendingProductsCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-gradient-to-r from-yellow-400 to-orange-500 text-black text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center animate-pulse shadow-lg" data-testid="text-pending-products-count">
                      {pendingProductsCount}
                    </span>
                  )}
                </button>
              </Link>
            )}
            
            <Link href="/orders">
              <button className="relative p-2 rounded-full hover:bg-white/20 transition-all duration-300 transform hover:scale-110" data-testid="button-orders">
                <Package className="h-6 w-6 text-white hover:text-yellow-300 transition-colors duration-300" />
                {pendingOrdersCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-gradient-to-r from-blue-400 to-cyan-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center animate-pulse shadow-lg" data-testid="text-pending-orders-count">
                    {pendingOrdersCount}
                  </span>
                )}
              </button>
            </Link>
            
            <button className="relative p-2 rounded-full hover:bg-white/20 transition-all duration-300 transform hover:scale-110" data-testid="button-favorites">
              <Heart className="h-6 w-6 text-white hover:text-pink-300 transition-colors duration-300" />
              {likedCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-gradient-to-r from-pink-500 to-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center animate-pulse shadow-lg" data-testid="text-liked-count">
                  {likedCount}
                </span>
              )}
            </button>
            
            <button className="p-2 rounded-full hover:bg-white/20 transition-all duration-300 transform hover:scale-110" data-testid="button-profile">
              <UserCircle className="h-6 w-6 text-white hover:text-yellow-300 transition-colors duration-300" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
