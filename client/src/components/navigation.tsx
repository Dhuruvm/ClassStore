import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Search, Heart, UserCircle, Package, BarChart3, Menu, X } from "lucide-react";
import { CustomerService } from "@/lib/customer";
import { SellerService } from "@/lib/seller";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function Navigation() {
  const [location] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const likedCount = JSON.parse(localStorage.getItem("likedProducts") || "[]").length;
  const customerOrders = CustomerService.getCustomerOrders();
  const pendingOrdersCount = customerOrders.filter(order => order.status === 'pending' || order.status === 'confirmed').length;
  
  // Seller dashboard data
  const hasSeller = SellerService.hasSellerData();
  const pendingProductsCount = SellerService.getPendingProductsCount();

  const navItems = ["New", "Men", "Women", "Kids", "Sale"];

  return (
    <>
    <nav className="professional-nav sticky top-0 z-50 bg-white/95 backdrop-blur-lg border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo - Nike-inspired */}
          <div className="flex items-center space-x-8">
            <Link href="/" data-testid="link-home">
              <h1 className="text-2xl font-black tracking-tight text-black uppercase hover:text-orange-500 transition-colors duration-300">
                ClassStore
              </h1>
            </Link>
            
            {/* Desktop navigation menu */}
            <div className="hidden lg:flex space-x-8">
              {navItems.map((item) => (
                <Link key={item} href={item === "New" ? "/" : `/${item.toLowerCase()}`}>
                  <span className="text-gray-800 font-medium hover:text-orange-500 transition-all duration-300 cursor-pointer uppercase tracking-wide text-sm relative group" data-testid={`link-nav-${item.toLowerCase()}`}>
                    {item}
                    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-orange-500 group-hover:w-full transition-all duration-300"></span>
                  </span>
                </Link>
              ))}
            </div>
          </div>
          
          {/* Nike-inspired Search Bar */}
          <div className="hidden md:block flex-1 max-w-md mx-8">
            <div className="relative">
              <Input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 h-10 bg-gray-50 border-2 border-gray-200 rounded-full focus:bg-white focus:border-black focus:ring-2 focus:ring-orange-500/20 transition-all duration-300 text-gray-900 placeholder-gray-500"
                data-testid="input-search"
              />
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            </div>
          </div>
          
          {/* Right side icons with Nike styling */}
          <div className="flex items-center space-x-3">
            {/* Mobile menu button */}
            <button 
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-all duration-200" 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              data-testid="button-mobile-menu"
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6 text-gray-800" />
              ) : (
                <Menu className="h-6 w-6 text-gray-800" />
              )}
            </button>
            
            {/* Mobile search button */}
            <button className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-all duration-200" data-testid="button-mobile-search">
              <Search className="h-5 w-5 text-gray-600" />
            </button>
            
            <Link href="/sell">
              <Button 
                className={`nike-btn text-xs font-bold transition-all duration-200 px-4 py-2 rounded-full ${
                  location === "/sell" 
                    ? "bg-orange-500 text-white hover:bg-orange-600 shadow-lg" 
                    : "bg-black text-white hover:bg-gray-800"
                } transform hover:scale-105`}
                data-testid="button-sell"
              >
                SELL
              </Button>
            </Link>
            
            {/* Desktop icons */}
            <div className="hidden md:flex items-center space-x-2">
              {hasSeller && (
                <Link href="/dashboard">
                  <button className="relative p-2 rounded-lg hover:bg-gray-100 transition-all duration-200" data-testid="button-dashboard">
                    <BarChart3 className="h-5 w-5 text-gray-600 hover:text-orange-500 transition-colors duration-200" />
                    {pendingProductsCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs font-bold rounded-full h-4 w-4 flex items-center justify-center" data-testid="text-pending-products-count">
                        {pendingProductsCount}
                      </span>
                    )}
                  </button>
                </Link>
              )}
              
              <Link href="/orders">
                <button className="relative p-2 rounded-lg hover:bg-gray-100 transition-all duration-200" data-testid="button-orders">
                  <Package className="h-5 w-5 text-gray-600 hover:text-orange-500 transition-colors duration-200" />
                  {pendingOrdersCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-black text-white text-xs font-bold rounded-full h-4 w-4 flex items-center justify-center" data-testid="text-pending-orders-count">
                      {pendingOrdersCount}
                    </span>
                  )}
                </button>
              </Link>
              
              <button className="relative p-2 rounded-lg hover:bg-gray-100 transition-all duration-200" data-testid="button-favorites">
                <Heart className="h-5 w-5 text-gray-600 hover:text-red-500 transition-colors duration-200" />
                {likedCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-4 w-4 flex items-center justify-center" data-testid="text-liked-count">
                    {likedCount}
                  </span>
                )}
              </button>
              
              <button className="p-2 rounded-lg hover:bg-gray-100 transition-all duration-200" data-testid="button-profile">
                <UserCircle className="h-5 w-5 text-gray-600 hover:text-orange-500 transition-colors duration-200" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>

    {/* Mobile Menu Overlay */}
    {isMobileMenuOpen && (
      <div className="lg:hidden fixed inset-0 z-40 bg-black/50" onClick={() => setIsMobileMenuOpen(false)} data-testid="overlay-mobile-menu">
        <div className="fixed top-16 bottom-0 left-0 right-0 bg-white border-b border-gray-200 shadow-lg max-h-[calc(100vh-4rem)] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
          {/* Mobile Navigation */}
          <div className="px-4 py-4 space-y-4">
            {navItems.map((item) => (
              <Link key={item} href={item === "New" ? "/" : `/${item.toLowerCase()}`}>
                <div 
                  className="block py-3 px-4 text-gray-800 font-medium hover:text-orange-500 hover:bg-gray-50 rounded-lg transition-all duration-200"
                  onClick={() => setIsMobileMenuOpen(false)}
                  data-testid={`link-mobile-nav-${item.toLowerCase()}`}
                >
                  {item}
                </div>
              </Link>
            ))}
            
            {/* Mobile Search */}
            <div className="py-3 px-4">
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 h-12 bg-gray-50 border-2 border-gray-200 rounded-lg focus:bg-white focus:border-black transition-all duration-300 text-gray-900 placeholder-gray-500"
                  data-testid="input-mobile-search"
                />
                <Search className="absolute left-3 top-4 h-4 w-4 text-gray-400" />
              </div>
            </div>
            
            {/* Mobile Action Buttons */}
            <div className="px-4 py-3 border-t border-gray-100">
              <div className="flex justify-around items-center">
                {hasSeller && (
                  <Link href="/dashboard">
                    <button className="relative flex flex-col items-center p-3" data-testid="button-mobile-dashboard" onClick={() => setIsMobileMenuOpen(false)}>
                      <BarChart3 className="h-6 w-6 text-gray-600" />
                      <span className="text-xs text-gray-600 mt-1">Dashboard</span>
                      {pendingProductsCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs font-bold rounded-full h-4 w-4 flex items-center justify-center" data-testid="text-mobile-pending-products-count">
                          {pendingProductsCount}
                        </span>
                      )}
                    </button>
                  </Link>
                )}
                
                <Link href="/orders">
                  <button className="relative flex flex-col items-center p-3" data-testid="button-mobile-orders" onClick={() => setIsMobileMenuOpen(false)}>
                    <Package className="h-6 w-6 text-gray-600" />
                    <span className="text-xs text-gray-600 mt-1">Orders</span>
                    {pendingOrdersCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-black text-white text-xs font-bold rounded-full h-4 w-4 flex items-center justify-center" data-testid="text-mobile-pending-orders-count">
                        {pendingOrdersCount}
                      </span>
                    )}
                  </button>
                </Link>
                
                <button className="relative flex flex-col items-center p-3" data-testid="button-mobile-favorites" onClick={() => setIsMobileMenuOpen(false)}>
                  <Heart className="h-6 w-6 text-gray-600" />
                  <span className="text-xs text-gray-600 mt-1">Favorites</span>
                  {likedCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-4 w-4 flex items-center justify-center" data-testid="text-mobile-liked-count">
                      {likedCount}
                    </span>
                  )}
                </button>
                
                <button className="flex flex-col items-center p-3" data-testid="button-mobile-profile" onClick={() => setIsMobileMenuOpen(false)}>
                  <UserCircle className="h-6 w-6 text-gray-600" />
                  <span className="text-xs text-gray-600 mt-1">Profile</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
