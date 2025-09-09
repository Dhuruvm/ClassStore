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
    <nav className="bg-card border-b border-border sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0">
              <Link href="/" data-testid="link-home">
                <h1 className="text-2xl font-bold text-primary cursor-pointer">
                  ClassStore
                </h1>
              </Link>
            </div>
            <div className="hidden md:block">
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-64 pl-10 pr-4"
                  data-testid="input-search"
                />
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <button className="md:hidden text-muted-foreground hover:text-foreground" data-testid="button-mobile-search">
              <Search className="h-5 w-5" />
            </button>
            
            <Link href="/sell">
              <Button 
                variant={location === "/sell" ? "default" : "secondary"}
                data-testid="button-sell"
              >
                Sell Item
              </Button>
            </Link>
            
            <button className="relative text-muted-foreground hover:text-foreground" data-testid="button-favorites">
              <Heart className="h-5 w-5" />
              {likedCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-accent text-accent-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center" data-testid="text-liked-count">
                  {likedCount}
                </span>
              )}
            </button>
            
            <button className="text-muted-foreground hover:text-foreground" data-testid="button-profile">
              <UserCircle className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
