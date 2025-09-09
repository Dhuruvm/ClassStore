import { useState } from "react";
import { useLocation } from "wouter";
import { CloudUpload } from "lucide-react";
import Navigation from "@/components/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export default function Sell() {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    class: "",
    section: "",
    sellerName: "",
    sellerPhone: "",
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const sellMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch("/api/sellers", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      
      if (!response.ok) {
        const error = await response.text();
        throw new Error(error);
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Product listed successfully!",
        description: "Your item is now available for purchase.",
      });
      setLocation("/");
    },
    onError: (error: any) => {
      toast({
        title: "Failed to list product",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    },
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const submitFormData = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      submitFormData.append(key, value);
    });
    
    if (selectedFile) {
      submitFormData.append("image", selectedFile);
    }
    
    sellMutation.mutate(submitFormData);
  };

  const calculateCommission = () => {
    const price = parseFloat(formData.price) || 0;
    const commission = price * 0.2;
    const youReceive = price - commission;
    return { price, commission, youReceive };
  };

  const { price, commission, youReceive } = calculateCommission();

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-card rounded-lg border border-border p-8" data-testid="form-seller">
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-2" data-testid="text-sell-title">Sell Your Item</h2>
            <p className="text-muted-foreground" data-testid="text-sell-description">
              List your textbooks, supplies, or other school items for sale to your classmates.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Image Upload */}
            <div>
              <Label>Product Image *</Label>
              <div 
                className="border-2 border-dashed border-input rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer"
                onClick={() => document.getElementById("file-upload")?.click()}
                data-testid="area-image-upload"
              >
                {previewUrl ? (
                  <div className="space-y-4">
                    <img 
                      src={previewUrl} 
                      alt="Preview" 
                      className="w-32 h-32 object-cover mx-auto rounded-lg"
                      data-testid="img-preview"
                    />
                    <p className="text-sm text-muted-foreground">Click to change image</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <CloudUpload className="w-12 h-12 mx-auto text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Click to upload or drag and drop</p>
                      <p className="text-xs text-muted-foreground">PNG, JPG or GIF (max 5MB)</p>
                    </div>
                  </div>
                )}
                <input
                  id="file-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                  data-testid="input-file-upload"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Product Name *</Label>
                <Input
                  id="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  data-testid="input-product-name"
                />
              </div>
              <div>
                <Label htmlFor="price">Price *</Label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-muted-foreground">$</span>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    required
                    className="pl-8"
                    value={formData.price}
                    onChange={(e) => handleInputChange("price", e.target.value)}
                    data-testid="input-product-price"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="class">Class *</Label>
                <Select value={formData.class} onValueChange={(value) => handleInputChange("class", value)}>
                  <SelectTrigger data-testid="select-product-class">
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
              <div>
                <Label htmlFor="section">Section *</Label>
                <Input
                  id="section"
                  type="text"
                  required
                  value={formData.section}
                  onChange={(e) => handleInputChange("section", e.target.value)}
                  data-testid="input-product-section"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="description">Product Description</Label>
              <Textarea
                id="description"
                rows={4}
                placeholder="Describe the condition, included items, etc."
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                data-testid="textarea-product-description"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="sellerName">Your Name *</Label>
                <Input
                  id="sellerName"
                  type="text"
                  required
                  value={formData.sellerName}
                  onChange={(e) => handleInputChange("sellerName", e.target.value)}
                  data-testid="input-seller-name"
                />
              </div>
              <div>
                <Label htmlFor="sellerPhone">Phone Number *</Label>
                <Input
                  id="sellerPhone"
                  type="tel"
                  required
                  value={formData.sellerPhone}
                  onChange={(e) => handleInputChange("sellerPhone", e.target.value)}
                  data-testid="input-seller-phone"
                />
              </div>
            </div>

            {/* Commission Breakdown */}
            <div className="bg-muted rounded-lg p-4" data-testid="section-commission">
              <h4 className="font-medium mb-3">Commission Breakdown</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Product Price:</span>
                  <span data-testid="text-product-price-breakdown">${price.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>ClassStore Commission (20%):</span>
                  <span data-testid="text-commission-amount">-${commission.toFixed(2)}</span>
                </div>
                <div className="border-t border-border pt-2 flex justify-between font-medium">
                  <span>You'll Receive:</span>
                  <span className="text-secondary" data-testid="text-seller-receive">${youReceive.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="flex space-x-4 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setLocation("/")}
                className="flex-1"
                data-testid="button-cancel-listing"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="flex-1 bg-secondary text-secondary-foreground hover:bg-secondary/90"
                disabled={sellMutation.isPending}
                data-testid="button-submit-listing"
              >
                {sellMutation.isPending ? "Listing..." : "List Item for Sale"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
