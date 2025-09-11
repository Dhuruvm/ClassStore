import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { CustomerService } from "@/lib/customer";
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
    pickupLocation: "School Main Gate",
    pickupTime: "",
    additionalNotes: "",
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

  // Submit order
  const orderMutation = useMutation({
    mutationFn: async (orderData: any) => {
      const response = await apiRequest("POST", "/api/orders", { body: orderData });
      return response;
    },
    onSuccess: (response: any) => {
      // Store order in localStorage for customer tracking
      if (response?.orderId) {
        CustomerService.storeOrder({
          orderId: response.orderId,
          productId: product!.id,
          productName: product!.name,
          productPrice: product!.price,
          pickupLocation: formData.pickupLocation,
          pickupTime: formData.pickupTime,
        });
      }

      toast({
        title: "Order placed successfully!",
        description: "You'll receive an email confirmation shortly. You can track your order in the My Orders section.",
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

    // Generate customer ID and sync customer data
    const customerId = CustomerService.getCustomerId();
    CustomerService.syncCustomerFromOrder({
      buyerName: formData.buyerName,
      buyerEmail: formData.buyerEmail,
      buyerPhone: formData.buyerPhone,
      buyerClass: parseInt(formData.buyerClass),
      buyerSection: formData.buyerSection,
    });

    const orderData = {
      productId: product.id,
      buyerName: formData.buyerName,
      buyerClass: formData.buyerClass,
      buyerSection: formData.buyerSection,
      buyerEmail: formData.buyerEmail,
      buyerPhone: formData.buyerPhone,
      buyerId: `customer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      pickupLocation: formData.pickupLocation,
      pickupTime: formData.pickupTime,
      additionalNotes: formData.additionalNotes || "",
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
          <p className="text-gray-600">Fill in your details for face-to-face pickup and cash payment</p>

          {/* Payment & Delivery Info Banner */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
            <div className="flex items-start space-x-3">
              <div className="text-blue-600 mt-0.5">ℹ️</div>
              <div>
                <h3 className="font-semibold text-blue-800 mb-1">Payment & Pickup Information</h3>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• <strong>Payment:</strong> Cash on Delivery (COD) - Pay when you collect the item</li>
                  <li>• <strong>Pickup:</strong> Face-to-face meeting at school premises</li>
                  <li>• <strong>Returns:</strong> No returns accepted - Please check item carefully before purchase</li>
                  <li>• <strong>Validity:</strong> Service available only for our school students</li>
                </ul>
              </div>
            </div>
          </div>
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
          {/* Student Information */}
          <div className="bg-white border rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Student Information</h2>
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
                  placeholder="Enter your full name"
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
                    <SelectValue placeholder="Select your class" />
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

            <div className="mt-4">
              <Label htmlFor="buyerSection" className="font-semibold text-gray-700">Section *</Label>
              <Input 
                id="buyerSection"
                type="text" 
                required 
                value={formData.buyerSection}
                onChange={(e) => handleInputChange("buyerSection", e.target.value)}
                className="mt-1"
                placeholder="e.g., A, B, C"
                data-testid="input-buyer-section"
              />
            </div>
          </div>

          {/* Contact Information */}
          <div className="bg-white border rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Contact Information</h2>
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
                  placeholder="your.email@school.edu"
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
                  placeholder="Your contact number"
                  data-testid="input-buyer-phone"
                />
              </div>
            </div>
          </div>

          {/* Pickup Arrangements */}
          <div className="bg-white border rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Pickup Arrangements</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="pickupLocation" className="font-semibold text-gray-700">Pickup Location *</Label>
                <Select 
                  value={formData.pickupLocation} 
                  onValueChange={(value) => handleInputChange("pickupLocation", value)}
                  required
                >
                  <SelectTrigger className="mt-1" data-testid="select-pickup-location">
                    <SelectValue placeholder="Choose pickup location" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="School Main Gate">School Main Gate</SelectItem>
                    <SelectItem value="Library">Library</SelectItem>
                    <SelectItem value="Cafeteria">Cafeteria</SelectItem>
                    <SelectItem value="Sports Ground">Sports Ground</SelectItem>
                    <SelectItem value="Parking Area">Parking Area</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="pickupTime" className="font-semibold text-gray-700">Preferred Pickup Time *</Label>
                <Select 
                  value={formData.pickupTime} 
                  onValueChange={(value) => handleInputChange("pickupTime", value)}
                  required
                >
                  <SelectTrigger className="mt-1" data-testid="select-pickup-time">
                    <SelectValue placeholder="Choose time slot" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Before School (7:30-8:00 AM)">Before School (7:30-8:00 AM)</SelectItem>
                    <SelectItem value="Break Time (10:30-11:00 AM)">Break Time (10:30-11:00 AM)</SelectItem>
                    <SelectItem value="Lunch Break (12:30-1:30 PM)">Lunch Break (12:30-1:30 PM)</SelectItem>
                    <SelectItem value="After School (3:30-4:00 PM)">After School (3:30-4:00 PM)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="mt-4">
              <Label htmlFor="additionalNotes" className="font-semibold text-gray-700">Additional Notes</Label>
              <Input 
                id="additionalNotes"
                type="text" 
                value={formData.additionalNotes}
                onChange={(e) => handleInputChange("additionalNotes", e.target.value)}
                className="mt-1"
                placeholder="Any special instructions or notes (optional)"
                data-testid="input-additional-notes"
              />
            </div>
          </div>

          {/* Terms Agreement */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <input 
                type="checkbox" 
                id="terms-agreement" 
                required 
                className="mt-1" 
                data-testid="checkbox-terms"
              />
              <div className="text-sm">
                <label htmlFor="terms-agreement" className="text-gray-700">
                  <strong>I agree to the terms:</strong> I understand this is a cash-on-delivery purchase, 
                  no returns are accepted, and I will collect the item at the agreed pickup location and time. 
                  I confirm I am a student of this school. 
                  <button 
                    type="button"
                    onClick={() => setLocation("/terms")}
                    className="text-blue-600 hover:text-blue-800 underline ml-1"
                    data-testid="link-terms"
                  >
                    Read full Terms & Conditions
                  </button>
                </label>
              </div>
            </div>
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
              {orderMutation.isPending ? "Processing..." : "Place Order (Cash on Pickup)"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}