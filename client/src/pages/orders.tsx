import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { CustomerService, CustomerOrder } from "@/lib/customer";
import { Clock, Package, CheckCircle, XCircle, MapPin, Calendar, Phone, Mail, User } from "lucide-react";
import Navigation from "@/components/navigation";

export default function OrdersPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [cancelReason, setCancelReason] = useState("");
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [localOrders, setLocalOrders] = useState<CustomerOrder[]>([]);

  // Get customer ID and local orders
  const customerId = CustomerService.getCustomerId();

  // Fetch orders from server
  const { data: serverOrders, isLoading, error } = useQuery({
    queryKey: ['/api/customers', customerId, 'orders'],
    queryFn: async () => {
      const response = await fetch(`/api/customers/${customerId}/orders`);
      if (!response.ok) {
        if (response.status === 404) return [];
        throw new Error('Failed to fetch orders');
      }
      return response.json();
    },
    retry: 1,
  });

  // Load local orders from localStorage
  useEffect(() => {
    const orders = CustomerService.getCustomerOrders();
    setLocalOrders(orders);
  }, []);

  // Sync local storage with server data
  useEffect(() => {
    if (serverOrders) {
      // Update local storage with server status updates
      serverOrders.forEach((serverOrder: any) => {
        const localOrder = localOrders.find(lo => lo.orderId === serverOrder.id);
        if (localOrder && localOrder.status !== serverOrder.status) {
          CustomerService.updateOrderStatus(
            serverOrder.id, 
            serverOrder.status,
            serverOrder.cancelledBy,
            serverOrder.cancellationReason
          );
        }
      });
      
      // Refresh local orders after sync
      const refreshedOrders = CustomerService.getCustomerOrders();
      setLocalOrders(refreshedOrders);
    }
  }, [serverOrders]);

  const cancelOrderMutation = useMutation({
    mutationFn: async ({ orderId, reason }: { orderId: string; reason: string }) => {
      return apiRequest("POST", `/api/customers/orders/${orderId}/cancel`, { body: { reason } });
    },
    onSuccess: (data, { orderId, reason }) => {
      // Update local storage
      CustomerService.updateOrderStatus(orderId, "cancelled", "buyer", reason);
      setLocalOrders(CustomerService.getCustomerOrders());
      
      // Invalidate server data
      queryClient.invalidateQueries({ queryKey: ['/api/customers', customerId, 'orders'] });
      
      toast({
        title: "Order cancelled successfully",
        description: "You'll receive a confirmation email shortly.",
      });
      
      // Reset form
      setCancelReason("");
      setSelectedOrderId(null);
    },
    onError: (error: any) => {
      toast({
        title: "Cancellation failed",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    },
  });

  const handleCancelOrder = (orderId: string) => {
    if (!cancelReason.trim() || cancelReason.trim().length < 5) {
      toast({
        title: "Invalid reason",
        description: "Please provide a reason with at least 5 characters",
        variant: "destructive",
      });
      return;
    }
    
    cancelOrderMutation.mutate({ orderId, reason: cancelReason.trim() });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'delivered':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'confirmed':
        return <Package className="h-4 w-4" />;
      case 'delivered':
        return <CheckCircle className="h-4 w-4" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const canCancelOrder = (status: string) => {
    return status === 'pending' || status === 'confirmed';
  };

  // Combine and deduplicate orders (prefer server data when available)
  const allOrders = localOrders.map(localOrder => {
    const serverOrder = serverOrders?.find((so: any) => so.id === localOrder.orderId);
    if (serverOrder) {
      return {
        ...localOrder,
        status: serverOrder.status,
        cancelledBy: serverOrder.cancelledBy,
        cancellationReason: serverOrder.cancellationReason,
      };
    }
    return localOrder;
  });

  const customerData = CustomerService.getOrCreateCustomer();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded mb-6"></div>
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-48 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2" data-testid="text-page-title">
            My Orders
          </h1>
          <p className="text-gray-600">Track and manage your ClassStore orders</p>
          
          {/* Customer Info Card */}
          {customerData.name && (
            <div className="bg-white rounded-lg p-4 mt-4 border shadow-sm">
              <div className="flex items-center space-x-4">
                <User className="h-5 w-5 text-gray-500" />
                <div>
                  <p className="font-semibold text-gray-800" data-testid="text-customer-name">
                    {customerData.name}
                  </p>
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    {customerData.class && (
                      <span>Grade {customerData.class} - Section {customerData.section}</span>
                    )}
                    {customerData.email && (
                      <span className="flex items-center space-x-1">
                        <Mail className="h-4 w-4" />
                        <span>{customerData.email}</span>
                      </span>
                    )}
                    {customerData.phone && (
                      <span className="flex items-center space-x-1">
                        <Phone className="h-4 w-4" />
                        <span>{customerData.phone}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {allOrders.length === 0 ? (
          <div className="text-center py-12">
            <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-600 mb-2">No Orders Yet</h2>
            <p className="text-gray-500 mb-6">
              You haven't placed any orders yet. Start browsing products to make your first purchase!
            </p>
            <Button 
              onClick={() => setLocation("/")}
              className="bg-black text-white hover:bg-gray-800"
              data-testid="button-browse-products"
            >
              Browse Products
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {allOrders.map((order) => (
              <Card key={order.orderId} className="shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg font-semibold text-gray-800">
                        {order.productName}
                      </CardTitle>
                      <p className="text-sm text-gray-500 mt-1">
                        Order ID: <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">{order.orderId}</span>
                      </p>
                    </div>
                    <Badge 
                      className={`${getStatusColor(order.status)} flex items-center space-x-1`}
                      data-testid={`badge-status-${order.status}`}
                    >
                      {getStatusIcon(order.status)}
                      <span className="capitalize">{order.status}</span>
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2 text-sm">
                        <span className="font-medium text-gray-700">Price:</span>
                        <span className="text-lg font-bold text-green-600">₹{order.productPrice}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm">
                        <MapPin className="h-4 w-4 text-gray-500" />
                        <span className="text-gray-600">{order.pickupLocation}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <span className="text-gray-600">{order.pickupTime}</span>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2 text-sm">
                        <span className="font-medium text-gray-700">Order Date:</span>
                        <span className="text-gray-600">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      
                      {order.status === 'cancelled' && order.cancellationReason && (
                        <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                          <p className="text-sm font-medium text-red-800 mb-1">Cancellation Reason:</p>
                          <p className="text-sm text-red-700 italic">"{order.cancellationReason}"</p>
                          <p className="text-xs text-red-600 mt-1">
                            Cancelled by: {order.cancelledBy === 'buyer' ? 'You' : 'Admin'}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex space-x-3 pt-3 border-t">
                    {canCancelOrder(order.status) && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="text-red-600 border-red-200 hover:bg-red-50"
                            onClick={() => setSelectedOrderId(order.orderId)}
                            data-testid={`button-cancel-${order.orderId}`}
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Cancel Order
                          </Button>
                        </AlertDialogTrigger>
                        
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Cancel Order</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to cancel this order? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          
                          <div className="py-4">
                            <Label htmlFor="reason" className="text-sm font-medium">
                              Reason for cancellation *
                            </Label>
                            <Textarea
                              id="reason"
                              placeholder="Please provide a reason for cancelling this order (minimum 5 characters)"
                              value={cancelReason}
                              onChange={(e) => setCancelReason(e.target.value)}
                              className="mt-2"
                              rows={3}
                              data-testid="textarea-cancel-reason"
                            />
                          </div>
                          
                          <AlertDialogFooter>
                            <AlertDialogCancel 
                              onClick={() => {
                                setCancelReason("");
                                setSelectedOrderId(null);
                              }}
                              data-testid="button-cancel-dialog"
                            >
                              Keep Order
                            </AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleCancelOrder(order.orderId)}
                              disabled={cancelOrderMutation.isPending || !cancelReason.trim() || cancelReason.trim().length < 5}
                              className="bg-red-600 hover:bg-red-700"
                              data-testid="button-confirm-cancel"
                            >
                              {cancelOrderMutation.isPending ? "Cancelling..." : "Cancel Order"}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                    
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setLocation(`/order/${order.productId}`)}
                      data-testid={`button-view-product-${order.orderId}`}
                    >
                      <Package className="h-4 w-4 mr-2" />
                      View Product
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}