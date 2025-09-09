import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Search, Heart, UserCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function Navigation() {
  const [location] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const likedCount = JSON.parse(localStorage.getItem("likedProducts") || "[]").length;

  return (
    <nav className="professional-nav sticky top-0 z-50 shadow-xl border-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <div className="flex items-center space-x-8">
            <div className="flex-shrink-0">
              <Link href="/" data-testid="link-home">
                <h1 className="text-3xl font-bold gradient-text cursor-pointer tracking-tight">
                  ClassStore
                </h1>
              </Link>
            </div>
            <div className="hidden lg:block">
              <div className="relative group">
                <Input
                  type="text"
                  placeholder="Search for textbooks, supplies..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-80 pl-12 pr-4 h-12 bg-white/50 border-white/30 backdrop-blur-sm rounded-full focus:bg-white/80 transition-all duration-300 shadow-md"
                  data-testid="input-search"
                />
                <Search className="absolute left-4 top-4 h-4 w-4 text-gray-500 group-focus-within:text-blue-600 transition-colors" />
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-6">
            <button className="lg:hidden p-3 rounded-full bg-white/50 backdrop-blur-sm hover:bg-white/80 transition-all duration-300" data-testid="button-mobile-search">
              <Search className="h-5 w-5 text-gray-600" />
            </button>
            
            <Link href="/sell">
              <Button 
                className={`h-12 px-6 rounded-full font-semibold transition-all duration-300 ${
                  location === "/sell" 
                    ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg hover:shadow-xl transform hover:scale-105" 
                    : "bg-white/50 text-gray-700 hover:bg-white/80 border border-white/30"
                }`}
                data-testid="button-sell"
              >
                + Sell Item
              </Button>
            </Link>
            
            <button className="relative p-3 rounded-full bg-white/50 backdrop-blur-sm hover:bg-white/80 transition-all duration-300 group" data-testid="button-favorites">
              <Heart className="h-5 w-5 text-gray-600 group-hover:text-red-500 transition-colors" />
              {likedCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center shadow-lg animate-pulse" data-testid="text-liked-count">
                  {likedCount}
                </span>
              )}
            </button>
            
            <button className="p-3 rounded-full bg-white/50 backdrop-blur-sm hover:bg-white/80 transition-all duration-300" data-testid="button-profile">
              <UserCircle className="h-6 w-6 text-gray-600" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
