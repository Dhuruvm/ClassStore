import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { 
  ArrowLeft, 
  Package, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Plus, 
  Eye,
  Calendar,
  Tag,
  IndianRupee,
  User,
  Phone,
  Mail,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { SellerService } from "@/lib/seller";
import { api } from "@/lib/api";

interface ProductStatusProps {
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
}

function ProductStatusBadge({ status, rejectionReason }: ProductStatusProps) {
  const statusConfig = {
    pending: {
      icon: Clock,
      label: "Under Review",
      className: "bg-yellow-100 text-yellow-800 border-yellow-200",
      iconColor: "text-yellow-600"
    },
    approved: {
      icon: CheckCircle,
      label: "Approved",
      className: "bg-green-100 text-green-800 border-green-200",
      iconColor: "text-green-600"
    },
    rejected: {
      icon: XCircle,
      label: "Rejected",
      className: "bg-red-100 text-red-800 border-red-200",
      iconColor: "text-red-600"
    }
  };

  const config = statusConfig[status];
  const IconComponent = config.icon;

  return (
    <div className="space-y-2">
      <Badge 
        variant="outline" 
        className={`${config.className} px-3 py-1`}
        data-testid={`status-${status}`}
      >
        <IconComponent className={`h-3 w-3 mr-1 ${config.iconColor}`} />
        {config.label}
      </Badge>
      {status === 'rejected' && rejectionReason && (
        <div className="flex items-start gap-2 p-2 bg-red-50 border border-red-200 rounded text-sm">
          <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
          <span className="text-red-700">{rejectionReason}</span>
        </div>
      )}
    </div>
  );
}

export default function Dashboard() {
  const [syncing, setSyncing] = useState(false);
  const seller = SellerService.getSellerInfo();
  const localProducts = SellerService.getSellerProducts();
  const summary = SellerService.getSellerSummary();

  // Fetch seller's products from server for synchronization
  const { data: serverProducts, refetch } = useQuery({
    queryKey: ['/api/sellers', seller?.id, 'products'],
    queryFn: async () => {
      if (!seller?.id) return [];
      const response = await fetch(`/api/sellers/${seller.id}/products`);
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!seller?.id,
  });

  // Sync with server data
  useEffect(() => {
    if (serverProducts && seller) {
      setSyncing(true);
      SellerService.syncWithServer(serverProducts);
      setSyncing(false);
    }
  }, [serverProducts, seller]);

  if (!seller) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center bg-white rounded-lg p-8 m-4 shadow-lg">
          <Package className="h-16 w-16 text-gray-400 mx-auto mb-6" />
          <h2 className="text-2xl font-black text-black mb-4">NO SELLER ACCOUNT</h2>
          <p className="text-gray-600 mb-6">
            You haven't uploaded any items yet. Start selling to track your products here.
          </p>
          <Link href="/sell">
            <Button 
              className="w-full bg-black text-white hover:bg-gray-800 font-semibold"
              data-testid="button-start-selling"
            >
              <Plus className="mr-2 h-4 w-4" />
              START SELLING
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="sm" data-testid="button-back-home">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Store
                </Button>
              </Link>
              <Separator orientation="vertical" className="h-6" />
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-black" />
                <h1 className="text-xl font-black text-black">SELLER DASHBOARD</h1>
              </div>
            </div>
            <Link href="/sell">
              <Button 
                className="bg-black text-white hover:bg-gray-800 font-semibold"
                data-testid="button-add-item"
              >
                <Plus className="mr-2 h-4 w-4" />
                ADD ITEM
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Seller Info and Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Seller Information */}
          <Card className="lg:col-span-2" data-testid="card-seller-info">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Seller Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500">Name</p>
                    <p className="font-semibold" data-testid="text-seller-name">{seller.name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500">Phone</p>
                    <p className="font-semibold" data-testid="text-seller-phone">{seller.phone}</p>
                  </div>
                </div>
                {seller.email && (
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="font-semibold" data-testid="text-seller-email">{seller.email}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500">Member Since</p>
                    <p className="font-semibold" data-testid="text-member-since">
                      {new Date(seller.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card data-testid="card-stats">
            <CardHeader>
              <CardTitle>Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <p className="text-2xl font-black text-blue-600" data-testid="text-total-products">
                    {summary.totalProducts}
                  </p>
                  <p className="text-sm text-blue-600">Total Items</p>
                </div>
                <div className="text-center p-3 bg-yellow-50 rounded-lg">
                  <p className="text-2xl font-black text-yellow-600" data-testid="text-pending-products">
                    {summary.pending}
                  </p>
                  <p className="text-sm text-yellow-600">Under Review</p>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <p className="text-2xl font-black text-green-600" data-testid="text-approved-products">
                    {summary.approved}
                  </p>
                  <p className="text-sm text-green-600">Approved</p>
                </div>
                <div className="text-center p-3 bg-red-50 rounded-lg">
                  <p className="text-2xl font-black text-red-600" data-testid="text-rejected-products">
                    {summary.rejected}
                  </p>
                  <p className="text-sm text-red-600">Rejected</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Products Section */}
        <Card data-testid="card-products">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Your Products ({localProducts.length})
            </CardTitle>
            {syncing && (
              <Badge variant="outline" className="bg-blue-50 text-blue-700">
                Syncing...
              </Badge>
            )}
          </CardHeader>
          <CardContent>
            {localProducts.length === 0 ? (
              <div className="text-center py-12">
                <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Products Yet</h3>
                <p className="text-gray-500 mb-6">
                  Upload your first item to start tracking your products here.
                </p>
                <Link href="/sell">
                  <Button 
                    className="bg-black text-white hover:bg-gray-800"
                    data-testid="button-upload-first-item"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Upload Your First Item
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {localProducts
                  .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())
                  .map((product) => (
                  <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow" data-testid={`card-product-${product.id}`}>
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        {/* Product Image */}
                        {product.imageUrl && (
                          <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                            <img
                              src={product.imageUrl}
                              alt={product.name}
                              className="w-full h-full object-cover"
                              data-testid={`img-product-${product.id}`}
                            />
                          </div>
                        )}
                        
                        {/* Product Info */}
                        <div className="space-y-3">
                          <div>
                            <h3 className="font-bold text-lg text-black line-clamp-2" data-testid={`text-product-name-${product.id}`}>
                              {product.name}
                            </h3>
                            <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                              <div className="flex items-center gap-1">
                                <IndianRupee className="h-3 w-3" />
                                <span data-testid={`text-product-price-${product.id}`}>{product.price}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Tag className="h-3 w-3" />
                                <span>Grade {product.class}</span>
                              </div>
                            </div>
                          </div>

                          {/* Status */}
                          <ProductStatusBadge 
                            status={product.approvalStatus} 
                            rejectionReason={product.rejectionReason}
                          />

                          {/* Additional Info */}
                          <div className="text-xs text-gray-500 space-y-1">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              <span>Uploaded {new Date(product.uploadedAt).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Tag className="h-3 w-3" />
                              <span>{product.category} • {product.condition}</span>
                            </div>
                          </div>

                          {/* Actions */}
                          {product.approvalStatus === 'approved' && (
                            <div className="pt-2">
                              <Link href={`/order/${product.id}`}>
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="w-full"
                                  data-testid={`button-view-listing-${product.id}`}
                                >
                                  <Eye className="mr-2 h-3 w-3" />
                                  View Live Listing
                                </Button>
                              </Link>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}