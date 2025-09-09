import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Upload, Camera, Package, Star, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { insertProductSchema, type InsertProduct } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

export default function Sell() {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<InsertProduct>({
    resolver: zodResolver(insertProductSchema),
    defaultValues: {
      name: "",
      description: "",
      price: "",
      class: 6,
      section: "",
      category: "Textbook",
      condition: "Good",
      sellerName: "",
      sellerPhone: "",
    },
  });

  const sellMutation = useMutation({
    mutationFn: async (data: InsertProduct & { image?: File }) => {
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (key !== "image" && value !== undefined) {
          formData.append(key, value.toString());
        }
      });
      if (data.image) {
        formData.append("image", data.image);
      }
      return await apiRequest("POST", "/api/products", {
        body: formData,
        isFormData: true,
      });
    },
    onSuccess: () => {
      toast({
        title: "LISTED SUCCESSFULLY!",
        description: "Your item is now live on the marketplace.",
      });
      form.reset();
      setImageFile(null);
      setImagePreview("");
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "LISTING FAILED",
        description: error.message || "Failed to list your item",
      });
    },
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = (data: InsertProduct) => {
    sellMutation.mutate({ ...data, image: imageFile || undefined });
  };

  return (
    <div className="min-h-screen bg-black">
      {/* Nike-style Hero Header */}
      <div className="bg-black text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-6xl md:text-8xl font-black tracking-tight mb-6">
            SELL
          </h1>
          <p className="text-2xl md:text-3xl font-bold mb-8">
            TURN YOUR ITEMS INTO CASH
          </p>
          <div className="flex flex-wrap justify-center gap-8 text-sm font-semibold">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              FREE LISTING
            </div>
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5" />
              TRUSTED BUYERS
            </div>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              SECURE PAYMENTS
            </div>
          </div>
        </div>
      </div>

      {/* Main Form Section */}
      <div className="bg-white">
        <div className="max-w-4xl mx-auto px-4 py-16">
          <div className="mb-12">
            <h2 className="text-4xl font-black text-black mb-4 tracking-tight">
              LIST YOUR ITEM
            </h2>
            <p className="text-xl text-gray-600">
              Get your items in front of thousands of students
            </p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              {/* Image Upload - Nike Style */}
              <div className="space-y-4">
                <FormLabel className="text-xl font-bold text-black">PRODUCT IMAGE</FormLabel>
                <div className="border-2 border-black rounded-lg p-12 text-center hover:bg-gray-50 transition-all duration-300">
                  {imagePreview ? (
                    <div className="relative">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="max-h-64 mx-auto rounded-lg shadow-lg"
                      />
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          setImageFile(null);
                          setImagePreview("");
                        }}
                        className="mt-6 bg-gray-200 text-black hover:bg-gray-300 font-semibold"
                      >
                        REMOVE IMAGE
                      </Button>
                    </div>
                  ) : (
                    <div>
                      <Camera className="mx-auto h-16 w-16 text-black mb-6" />
                      <p className="text-xl font-semibold text-black mb-6">UPLOAD HIGH-QUALITY PHOTOS</p>
                      <p className="text-gray-600 mb-8">Show your item from multiple angles</p>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                        id="image-upload"
                        data-testid="input-image"
                      />
                      <label htmlFor="image-upload">
                        <Button type="button" className="bg-black text-white hover:bg-gray-800 font-semibold px-8 py-3" asChild>
                          <span>
                            <Upload className="mr-2 h-4 w-4" />
                            CHOOSE IMAGE
                          </span>
                        </Button>
                      </label>
                    </div>
                  )}
                </div>
              </div>

              {/* Product Details */}
              <div className="bg-gray-50 p-8 rounded-lg">
                <h3 className="text-2xl font-black text-black mb-6">PRODUCT DETAILS</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-lg font-bold">ITEM NAME *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., NCERT Math Textbook"
                            {...field}
                            className="text-lg py-3 border-2 border-gray-300 focus:border-black"
                            data-testid="input-name"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-lg font-bold">PRICE (₹) *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="299.00"
                            {...field}
                            className="text-lg py-3 border-2 border-gray-300 focus:border-black"
                            data-testid="input-price"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-lg font-bold">CATEGORY *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="text-lg py-3 border-2 border-gray-300 focus:border-black" data-testid="select-category">
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Textbook">Textbook</SelectItem>
                            <SelectItem value="Notebook">Notebook</SelectItem>
                            <SelectItem value="Stationery">Stationery</SelectItem>
                            <SelectItem value="Calculator">Calculator</SelectItem>
                            <SelectItem value="Art Supplies">Art Supplies</SelectItem>
                            <SelectItem value="Sports Equipment">Sports Equipment</SelectItem>
                            <SelectItem value="Electronics">Electronics</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="condition"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-lg font-bold">CONDITION *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="text-lg py-3 border-2 border-gray-300 focus:border-black" data-testid="select-condition">
                              <SelectValue placeholder="Select condition" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="New">New</SelectItem>
                            <SelectItem value="Like New">Like New</SelectItem>
                            <SelectItem value="Good">Good</SelectItem>
                            <SelectItem value="Fair">Fair</SelectItem>
                            <SelectItem value="Poor">Poor</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="class"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-lg font-bold">GRADE/CLASS *</FormLabel>
                        <Select onValueChange={(value) => field.onChange(parseInt(value))}>
                          <FormControl>
                            <SelectTrigger className="text-lg py-3 border-2 border-gray-300 focus:border-black" data-testid="select-class">
                              <SelectValue placeholder="Select grade" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {[6, 7, 8, 9, 10, 11, 12].map((grade) => (
                              <SelectItem key={grade} value={grade.toString()}>
                                Grade {grade}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="section"
                  render={({ field }) => (
                    <FormItem className="mb-6">
                      <FormLabel className="text-lg font-bold">SECTION *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., A, B, C"
                          {...field}
                          className="text-lg py-3 border-2 border-gray-300 focus:border-black"
                          data-testid="input-section"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-lg font-bold">DESCRIPTION</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe the condition, features, or any details about your item..."
                          rows={4}
                          {...field}
                          className="text-lg py-3 border-2 border-gray-300 focus:border-black"
                          data-testid="input-description"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Seller Information */}
              <div className="bg-gray-50 p-8 rounded-lg">
                <h3 className="text-2xl font-black text-black mb-6">SELLER INFORMATION</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="sellerName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-lg font-bold">YOUR NAME *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Full name"
                            {...field}
                            className="text-lg py-3 border-2 border-gray-300 focus:border-black"
                            data-testid="input-seller-name"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="sellerPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-lg font-bold">PHONE NUMBER *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="9876543210"
                            {...field}
                            className="text-lg py-3 border-2 border-gray-300 focus:border-black"
                            data-testid="input-seller-phone"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Submit Button - Nike Style */}
              <div className="pt-8">
                <Button
                  type="submit"
                  disabled={sellMutation.isPending}
                  className="w-full bg-black text-white hover:bg-gray-800 py-6 text-2xl font-black tracking-wide transition-all duration-300 transform hover:scale-[1.02]"
                  data-testid="button-submit"
                >
                  {sellMutation.isPending ? "LISTING..." : "LIST ITEM NOW"}
                </Button>
                <p className="text-center text-gray-600 mt-4">
                  By listing, you agree to our terms and conditions
                </p>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}