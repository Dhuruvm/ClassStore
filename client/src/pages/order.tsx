import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Product } from "@shared/schema";
import Navigation from "@/components/navigation";

export default function OrderPage() {
  const { productId } = useParams<{ productId: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    buyerName: "",
    buyerClass: "",
    buyerSection: "",
    buyerEmail: "",
    buyerPhone: "",
    buyerAddress: "",
    buyerCity: "",
    buyerPincode: "",
    deliveryInstructions: "",
  });

  // Fetch product details
  const { data: product, isLoading } = useQuery({
    queryKey: [`/api/products/${productId}`],
    queryFn: async () => {
      const response = await fetch(`/api/products/${productId}`);
      if (!response.ok) throw new Error("Product not found");
      return response.json();
    },
    enabled: !!productId,
  });

  const orderMutation = useMutation({
    mutationFn: async (orderData: any) => {
      return apiRequest("POST", "/api/orders", orderData);
    },
    onSuccess: () => {
      toast({
        title: "Order placed successfully!",
        description: "You'll receive an email confirmation shortly.",
      });
      setLocation("/");
    },
    onError: (error: any) => {
      toast({
        title: "Order failed",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!product) return;

    const orderData = {
      productId: product.id,
      ...formData,
      buyerClass: parseInt(formData.buyerClass),
      amount: product.price.toString(),
      recaptchaToken: "dummy-token",
    };

    orderMutation.mutate(orderData);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white">
        <Navigation />
        <div className="max-w-2xl mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded mb-4"></div>
            <div className="h-32 bg-gray-200 rounded mb-4"></div>
            <div className="space-y-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-12 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-white">
        <Navigation />
        <div className="max-w-2xl mx-auto px-4 py-8 text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Product Not Found</h1>
          <Button onClick={() => setLocation("/")} data-testid="button-back-home">
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-6">
          <Button 
            variant="outline" 
            onClick={() => setLocation("/")}
            className="mb-4"
            data-testid="button-back"
          >
            ← Back to Products
          </Button>
          
          <h1 className="text-3xl font-bold text-gray-800 mb-2" data-testid="text-page-title">
            Complete Your Order
          </h1>
          <p className="text-gray-600">Fill in your details to purchase this item</p>
        </div>

        {/* Product Summary */}
        <div className="bg-gray-50 rounded-2xl p-6 mb-8 border">
          <div className="flex items-center space-x-4">
            <img 
              src={product.imageUrl || "https://images.unsplash.com/photo-1509228468518-180dd4864904?ixlib=rb-4.0.3&auto=format&fit=crop&w=80&h=80"} 
              alt={product.name}
              className="w-20 h-20 object-cover rounded-xl"
              data-testid="img-product-summary"
            />
            <div className="flex-1">
              <h3 className="font-bold text-xl text-gray-800" data-testid="text-product-name">
                {product.name}
              </h3>
              <p className="text-gray-600" data-testid="text-product-details">
                Grade {product.class} - Section {product.section}
              </p>
              <p className="text-2xl font-bold text-black mt-1" data-testid="text-product-price">
                ₹ {product.price}
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="buyerName" className="font-semibold text-gray-700">Full Name *</Label>
              <Input 
                id="buyerName"
                type="text" 
                required 
                value={formData.buyerName}
                onChange={(e) => handleInputChange("buyerName", e.target.value)}
                className="mt-1"
                data-testid="input-buyer-name"
              />
            </div>
            
            <div>
              <Label htmlFor="buyerClass" className="font-semibold text-gray-700">Class *</Label>
              <Select 
                value={formData.buyerClass} 
                onValueChange={(value) => handleInputChange("buyerClass", value)}
                required
              >
                <SelectTrigger className="mt-1" data-testid="select-buyer-class">
                  <SelectValue placeholder="Select Class" />
                </SelectTrigger>
                <SelectContent>
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
          </div>

          <div>
            <Label htmlFor="buyerSection" className="font-semibold text-gray-700">Section *</Label>
            <Input 
              id="buyerSection"
              type="text" 
              required 
              value={formData.buyerSection}
              onChange={(e) => handleInputChange("buyerSection", e.target.value)}
              className="mt-1"
              data-testid="input-buyer-section"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="buyerEmail" className="font-semibold text-gray-700">Email Address *</Label>
              <Input 
                id="buyerEmail"
                type="email" 
                required 
                value={formData.buyerEmail}
                onChange={(e) => handleInputChange("buyerEmail", e.target.value)}
                className="mt-1"
                data-testid="input-buyer-email"
              />
            </div>
            
            <div>
              <Label htmlFor="buyerPhone" className="font-semibold text-gray-700">Phone Number *</Label>
              <Input 
                id="buyerPhone"
                type="tel" 
                required 
                value={formData.buyerPhone}
                onChange={(e) => handleInputChange("buyerPhone", e.target.value)}
                className="mt-1"
                data-testid="input-buyer-phone"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="buyerAddress" className="font-semibold text-gray-700">Address *</Label>
            <Input 
              id="buyerAddress"
              type="text" 
              required 
              value={formData.buyerAddress}
              onChange={(e) => handleInputChange("buyerAddress", e.target.value)}
              className="mt-1"
              data-testid="input-buyer-address"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="buyerCity" className="font-semibold text-gray-700">City *</Label>
              <Input 
                id="buyerCity"
                type="text" 
                required 
                value={formData.buyerCity}
                onChange={(e) => handleInputChange("buyerCity", e.target.value)}
                className="mt-1"
                data-testid="input-buyer-city"
              />
            </div>
            
            <div>
              <Label htmlFor="buyerPincode" className="font-semibold text-gray-700">Pincode *</Label>
              <Input 
                id="buyerPincode"
                type="text" 
                required 
                value={formData.buyerPincode}
                onChange={(e) => handleInputChange("buyerPincode", e.target.value)}
                className="mt-1"
                data-testid="input-buyer-pincode"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="deliveryInstructions" className="font-semibold text-gray-700">Delivery Instructions</Label>
            <Input 
              id="deliveryInstructions"
              type="text" 
              value={formData.deliveryInstructions}
              onChange={(e) => handleInputChange("deliveryInstructions", e.target.value)}
              className="mt-1"
              placeholder="Any special delivery instructions (optional)"
              data-testid="input-delivery-instructions"
            />
          </div>

          <div className="flex space-x-4 pt-6">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setLocation("/")}
              className="flex-1"
              data-testid="button-cancel-order"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="flex-1 bg-black text-white hover:bg-gray-800"
              disabled={orderMutation.isPending}
              data-testid="button-submit-order"
            >
              {orderMutation.isPending ? "Processing..." : "Complete Purchase"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}