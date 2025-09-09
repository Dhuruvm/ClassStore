import { useState, useEffect } from "react";
import { useParams } from "wouter";
import { LogOut, ShoppingCart, Clock, DollarSign, Package, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface AdminStats {
  totalOrders: number;
  pendingOrders: number;
  revenue: string;
  activeProducts: number;
}

interface OrderWithProduct {
  id: string;
  productId: string;
  buyerName: string;
  buyerClass: number;
  buyerSection: string;
  buyerEmail: string;
  buyerPhone: string;
  amount: string;
  status: "pending" | "confirmed" | "cancelled";
  createdAt: string;
  product: {
    id: string;
    name: string;
    sellerName: string;
  };
}

export default function Admin() {
  const params = useParams();
  const section = params.section || "login";
  
  const [loginData, setLoginData] = useState({ username: "", password: "" });
  const [authState, setAuthState] = useState<"login" | "authenticated">("login");
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Check authentication status on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/admin/stats", { credentials: "include" });
        if (response.ok) {
          setAuthState("authenticated");
        }
      } catch (error) {
        // Not authenticated, stay on login
      }
    };
    checkAuth();
  }, []);

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (credentials: { username: string; password: string }) => {
      return apiRequest("POST", "/api/admin/login", credentials);
    },
    onSuccess: () => {
      setAuthState("authenticated");
      toast({
        title: "Authentication successful",
        description: "Welcome to the admin panel",
      });
    },
    onError: () => {
      toast({
        title: "Login failed",
        description: "Invalid username or password",
        variant: "destructive",
      });
    },
  });

  

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/admin/logout");
    },
    onSuccess: () => {
      setAuthState("login");
      setLoginData({ username: "", password: "" });
      queryClient.clear();
    },
  });

  // Admin data queries
  const { data: stats } = useQuery<AdminStats>({
    queryKey: ["/api/admin/stats"],
    enabled: authState === "authenticated",
  });

  const { data: orders = [] } = useQuery<OrderWithProduct[]>({
    queryKey: ["/api/admin/orders"],
    enabled: authState === "authenticated",
  });

  // Order actions
  const confirmOrderMutation = useMutation({
    mutationFn: async (orderId: string) => {
      return apiRequest("POST", `/api/admin/orders/${orderId}/confirm`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({ title: "Order confirmed successfully" });
    },
  });

  const cancelOrderMutation = useMutation({
    mutationFn: async (orderId: string) => {
      return apiRequest("POST", `/api/admin/orders/${orderId}/cancel`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({ title: "Order cancelled successfully" });
    },
  });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate(loginData);
  };

  

  const downloadInvoice = (orderId: string) => {
    window.open(`/api/admin/orders/${orderId}/invoice`, '_blank');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "confirmed": return "bg-green-100 text-green-800";
      case "cancelled": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  // Render login form
  if (authState === "login") {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <Card className="max-w-md w-full mx-4" data-testid="form-admin-login">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Admin Login</CardTitle>
            <p className="text-muted-foreground">Access the ClassStore admin panel</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  required
                  value={loginData.username}
                  onChange={(e) => setLoginData(prev => ({ ...prev, username: e.target.value }))}
                  data-testid="input-admin-username"
                />
              </div>
              
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  value={loginData.password}
                  onChange={(e) => setLoginData(prev => ({ ...prev, password: e.target.value }))}
                  data-testid="input-admin-password"
                />
              </div>

              <Button 
                type="submit" 
                className="w-full"
                disabled={loginMutation.isPending}
                data-testid="button-admin-login"
              >
                {loginMutation.isPending ? "Authenticating..." : "Login"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  

  // Render admin dashboard
  return (
    <div className="min-h-screen bg-muted/30">
      {/* Admin Header */}
      <header className="bg-card border-b border-border p-4">
        <div className="flex justify-between items-center max-w-7xl mx-auto">
          <h1 className="text-xl font-bold" data-testid="text-admin-title">ClassStore Admin</h1>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-muted-foreground">Welcome, admin</span>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => logoutMutation.mutate()}
              data-testid="button-admin-logout"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card data-testid="stat-total-orders">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Orders</p>
                  <p className="text-2xl font-bold" data-testid="text-total-orders">{stats?.totalOrders || 0}</p>
                </div>
                <ShoppingCart className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
          
          <Card data-testid="stat-pending-orders">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending Orders</p>
                  <p className="text-2xl font-bold text-accent" data-testid="text-pending-orders">{stats?.pendingOrders || 0}</p>
                </div>
                <Clock className="h-8 w-8 text-accent" />
              </div>
            </CardContent>
          </Card>
          
          <Card data-testid="stat-revenue">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Revenue</p>
                  <p className="text-2xl font-bold text-secondary" data-testid="text-revenue">${stats?.revenue || "0.00"}</p>
                </div>
                <DollarSign className="h-8 w-8 text-secondary" />
              </div>
            </CardContent>
          </Card>
          
          <Card data-testid="stat-active-products">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Products</p>
                  <p className="text-2xl font-bold" data-testid="text-active-products">{stats?.activeProducts || 0}</p>
                </div>
                <Package className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Orders Table */}
        <Card data-testid="table-orders">
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-4 font-medium">Order ID</th>
                    <th className="text-left p-4 font-medium">Product</th>
                    <th className="text-left p-4 font-medium">Buyer</th>
                    <th className="text-left p-4 font-medium">Amount</th>
                    <th className="text-left p-4 font-medium">Status</th>
                    <th className="text-left p-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id} className="border-b border-border" data-testid={`row-order-${order.id}`}>
                      <td className="p-4 font-mono text-sm" data-testid={`text-order-id-${order.id}`}>
                        #{order.id.slice(-8)}
                      </td>
                      <td className="p-4" data-testid={`text-product-name-${order.id}`}>
                        {order.product.name}
                      </td>
                      <td className="p-4" data-testid={`text-buyer-name-${order.id}`}>
                        {order.buyerName}
                      </td>
                      <td className="p-4 font-semibold" data-testid={`text-order-amount-${order.id}`}>
                        ${order.amount}
                      </td>
                      <td className="p-4">
                        <Badge className={getStatusColor(order.status)} data-testid={`badge-status-${order.id}`}>
                          {order.status}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <div className="flex space-x-2">
                          {order.status === "pending" && (
                            <>
                              <Button
                                size="sm"
                                className="bg-secondary text-secondary-foreground hover:bg-secondary/90"
                                onClick={() => confirmOrderMutation.mutate(order.id)}
                                disabled={confirmOrderMutation.isPending}
                                data-testid={`button-confirm-${order.id}`}
                              >
                                Confirm
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => cancelOrderMutation.mutate(order.id)}
                                disabled={cancelOrderMutation.isPending}
                                data-testid={`button-cancel-${order.id}`}
                              >
                                Cancel
                              </Button>
                            </>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => downloadInvoice(order.id)}
                            data-testid={`button-download-${order.id}`}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {orders.length === 0 && (
                <div className="text-center py-8 text-muted-foreground" data-testid="text-no-orders">
                  No orders found
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
