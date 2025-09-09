import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Search, Heart, UserCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function Navigation() {
  const [location] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const likedCount = JSON.parse(localStorage.getItem("likedProducts") || "[]").length;

  const navItems = ["New", "Men", "Women", "Kids", "Sale"];

  return (
    <nav className="bg-white sticky top-0 z-50 border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo - Nike style bold, minimal */}
          <div className="flex items-center space-x-8">
            <Link href="/" data-testid="link-home">
              <h1 className="text-2xl font-black tracking-tighter text-black uppercase">
                ClassStore
              </h1>
            </Link>
            
            {/* Nike-style navigation menu */}
            <div className="hidden lg:flex space-x-8">
              {navItems.map((item) => (
                <Link key={item} href={item === "New" ? "/" : `/${item.toLowerCase()}`}>
                  <span className="text-black font-medium hover:text-gray-600 transition-colors duration-200 cursor-pointer uppercase tracking-wide text-sm">
                    {item}
                  </span>
                </Link>
              ))}
            </div>
          </div>
          
          {/* Search Bar - Nike minimal style */}
          <div className="hidden md:block flex-1 max-w-md mx-8">
            <div className="relative">
              <Input
                type="text"
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 h-10 bg-gray-50 border-0 rounded-full focus:bg-white focus:ring-2 focus:ring-black transition-all duration-200"
                data-testid="input-search"
              />
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
            </div>
          </div>
          
          {/* Right side icons - Nike minimal */}
          <div className="flex items-center space-x-4">
            <button className="md:hidden" data-testid="button-mobile-search">
              <Search className="h-6 w-6 text-black" />
            </button>
            
            <Link href="/sell">
              <Button 
                className={`text-sm font-medium transition-colors duration-200 ${
                  location === "/sell" 
                    ? "nike-btn" 
                    : "nike-btn-secondary"
                }`}
                data-testid="button-sell"
              >
                Sell
              </Button>
            </Link>
            
            <button className="relative" data-testid="button-favorites">
              <Heart className="h-6 w-6 text-black hover:text-gray-600 transition-colors duration-200" />
              {likedCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-black text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center" data-testid="text-liked-count">
                  {likedCount}
                </span>
              )}
            </button>
            
            <button data-testid="button-profile">
              <UserCircle className="h-6 w-6 text-black hover:text-gray-600 transition-colors duration-200" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
