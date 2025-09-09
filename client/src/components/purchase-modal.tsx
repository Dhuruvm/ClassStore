import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Product } from "@shared/schema";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface PurchaseModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function PurchaseModal({ product, isOpen, onClose, onSuccess }: PurchaseModalProps) {
  const [formData, setFormData] = useState({
    buyerName: "",
    buyerClass: "",
    buyerSection: "",
    buyerEmail: "",
    buyerPhone: "",
  });
  
  const { toast } = useToast();

  const orderMutation = useMutation({
    mutationFn: async (orderData: any) => {
      return apiRequest("POST", "/api/orders", orderData);
    },
    onSuccess: () => {
      toast({
        title: "Order placed successfully!",
        description: "You'll receive an email confirmation shortly.",
      });
      onSuccess();
      onClose();
      setFormData({
        buyerName: "",
        buyerClass: "",
        buyerSection: "",
        buyerEmail: "",
        buyerPhone: "",
      });
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
      amount: product.price,
      recaptchaToken: "dummy-token", // In production, get from reCAPTCHA widget
    };

    orderMutation.mutate(orderData);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (!product) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto" data-testid="modal-purchase">
        <DialogHeader>
          <DialogTitle>Purchase Item</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Product Summary */}
          <div className="bg-muted rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-4">
              <img 
                src={product.imageUrl || "https://images.unsplash.com/photo-1509228468518-180dd4864904?ixlib=rb-4.0.3&auto=format&fit=crop&w=80&h=80"} 
                alt={product.name}
                className="w-16 h-16 object-cover rounded-md"
                data-testid="img-product-summary"
              />
              <div>
                <h4 className="font-semibold" data-testid="text-product-name">{product.name}</h4>
                <p className="text-sm text-muted-foreground" data-testid="text-product-details">
                  Grade {product.class} - Section {product.section}
                </p>
                <p className="text-lg font-bold text-secondary" data-testid="text-product-price">
                  ${product.price}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="buyerName">Full Name *</Label>
              <Input 
                id="buyerName"
                type="text" 
                required 
                value={formData.buyerName}
                onChange={(e) => handleInputChange("buyerName", e.target.value)}
                data-testid="input-buyer-name"
              />
            </div>
            <div>
              <Label htmlFor="buyerClass">Class *</Label>
              <Select 
                value={formData.buyerClass} 
                onValueChange={(value) => handleInputChange("buyerClass", value)}
                required
              >
                <SelectTrigger data-testid="select-buyer-class">
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
            <Label htmlFor="buyerSection">Section *</Label>
            <Input 
              id="buyerSection"
              type="text" 
              required 
              value={formData.buyerSection}
              onChange={(e) => handleInputChange("buyerSection", e.target.value)}
              data-testid="input-buyer-section"
            />
          </div>

          <div>
            <Label htmlFor="buyerEmail">Email Address *</Label>
            <Input 
              id="buyerEmail"
              type="email" 
              required 
              value={formData.buyerEmail}
              onChange={(e) => handleInputChange("buyerEmail", e.target.value)}
              data-testid="input-buyer-email"
            />
          </div>

          <div>
            <Label htmlFor="buyerPhone">Phone Number *</Label>
            <Input 
              id="buyerPhone"
              type="tel" 
              required 
              value={formData.buyerPhone}
              onChange={(e) => handleInputChange("buyerPhone", e.target.value)}
              data-testid="input-buyer-phone"
            />
          </div>

          {/* reCAPTCHA Placeholder */}
          <div className="border border-input rounded-md p-4 bg-muted/50 text-center">
            <p className="text-sm text-muted-foreground">reCAPTCHA verification will appear here</p>
            <div className="mt-2 text-xs text-muted-foreground">
              (Configure REACT_APP_RECAPTCHA_KEY in environment)
            </div>
          </div>

          <div className="flex space-x-4 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              className="flex-1"
              data-testid="button-cancel-order"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="flex-1"
              disabled={orderMutation.isPending}
              data-testid="button-submit-order"
            >
              {orderMutation.isPending ? "Processing..." : "Complete Purchase"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
