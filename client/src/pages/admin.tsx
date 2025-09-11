import { useState, useEffect } from "react";
import { useParams } from "wouter";
import { 
  LogOut, ShoppingCart, Clock, DollarSign, Package, Download, Users, 
  TrendingUp, BarChart3, Settings, Mail, Database, Activity, 
  Trash2, Edit, Plus, Filter, Search, RefreshCw, Send,
  Eye, CheckCircle, XCircle, AlertTriangle, Target, Zap, Upload
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface AdminStats {
  totalOrders: number;
  pendingOrders: number;
  revenue: string;
  activeProducts: number;
  totalUsers: number;
  dailyRevenue: string;
  weeklyGrowth: number;
  conversionRate: number;
  averageOrderValue: string;
  topSellingProducts: Array<{ name: string; sales: number; }>;
  recentActivity: Array<{ action: string; time: string; user: string; }>;
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

  const [activeTab, setActiveTab] = useState("dashboard");
  const [bulkEmailData, setBulkEmailData] = useState({ subject: "", content: "", recipients: "" });
  const [systemMetrics, setSystemMetrics] = useState({ cpuUsage: 0, memoryUsage: 0, activeConnections: 0 });
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [showEditProductModal, setShowEditProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [productForm, setProductForm] = useState({
    name: "",
    description: "",
    price: "",
    class: 6,
    section: "",
    category: "Textbook",
    condition: "Good",
    sellerName: "",
    sellerPhone: "",
  });
  const [productImageFile, setProductImageFile] = useState<File | null>(null);
  const [productImagePreview, setProductImagePreview] = useState<string>("");

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

  // Real-time system monitoring
  useEffect(() => {
    if (authState === "authenticated") {
      const interval = setInterval(async () => {
        try {
          const response = await fetch("/api/admin/system-metrics", { credentials: "include" });
          if (response.ok) {
            const metrics = await response.json();
            setSystemMetrics(metrics);
          }
        } catch (error) {
          console.error("Failed to fetch system metrics:", error);
        }
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [authState]);

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (credentials: { username: string; password: string }) => {
      return apiRequest("POST", "/api/admin/login", { body: credentials });
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

  const { data: users = [] } = useQuery<any[]>({
    queryKey: ["/api/admin/users"],
    enabled: authState === "authenticated",
  });

  const { data: adminProducts = [] } = useQuery<any[]>({
    queryKey: ["/api/admin/products"],
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

  // Enhanced bulk operations - moved before early return
  const bulkEmailMutation = useMutation({
    mutationFn: async (emailData: { subject: string; content: string; recipients: string }) => {
      const response = await apiRequest("POST", "/api/admin/bulk-email", { body: emailData });
      return response.json();
    },
    onSuccess: (data: { success: number; failed: number }) => {
      toast({ title: "Bulk email sent", description: `Sent to ${data.success} recipients, ${data.failed} failed` });
      setBulkEmailData({ subject: "", content: "", recipients: "" });
    },
    onError: () => {
      toast({ title: "Bulk email failed", variant: "destructive" });
    },
  });

  const systemOptimizationMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/admin/optimize-system");
    },
    onSuccess: () => {
      toast({ title: "System optimized successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/system-metrics"] });
    },
  });

  // Product management mutations
  const updateProductMutation = useMutation({
    mutationFn: async ({ id, isActive, isSoldOut }: { id: string; isActive?: boolean; isSoldOut?: boolean }) => {
      return apiRequest("PATCH", `/api/admin/products/${id}`, { body: { isActive, isSoldOut } });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({ title: "Product updated successfully" });
    },
  });

  const deleteProductMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/admin/products/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({ title: "Product deleted successfully" });
    },
  });

  const addProductMutation = useMutation({
    mutationFn: async (data: any) => {
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (key !== "image" && value !== undefined) {
          formData.append(key, value.toString());
        }
      });
      if (data.image) {
        formData.append("image", data.image);
      }
      return await apiRequest("POST", "/api/sellers", {
        body: formData,
        isFormData: true,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({ title: "Product added successfully" });
      setShowAddProductModal(false);
      resetProductForm();
    },
    onError: () => {
      toast({ title: "Failed to add product", variant: "destructive" });
    },
  });

  const editProductMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (key !== "image" && value !== undefined) {
          formData.append(key, value.toString());
        }
      });
      if (data.image) {
        formData.append("image", data.image);
      }
      return await apiRequest("PATCH", `/api/admin/products/${id}/details`, {
        body: formData,
        isFormData: true,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({ title: "Product updated successfully" });
      setShowEditProductModal(false);
      resetProductForm();
    },
    onError: () => {
      toast({ title: "Failed to update product", variant: "destructive" });
    },
  });

  // System action mutations
  const clearCacheMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/admin/clear-cache");
    },
    onSuccess: () => {
      toast({ title: "Cache cleared successfully" });
    },
  });

  const restartServicesMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/admin/restart-services");
    },
    onSuccess: () => {
      toast({ title: "Services restarted successfully" });
    },
  });

  const exportDataMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/admin/export-data", { credentials: "include" });
      if (!response.ok) throw new Error("Export failed");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = 'classstore-data.json';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    },
    onSuccess: () => {
      toast({ title: "Data exported successfully" });
    },
  });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate(loginData);
  };

  const resetProductForm = () => {
    setProductForm({
      name: "",
      description: "",
      price: "",
      class: 6,
      section: "",
      category: "Textbook",
      condition: "Good",
      sellerName: "",
      sellerPhone: "",
    });
    setProductImageFile(null);
    setProductImagePreview("");
    setEditingProduct(null);
  };

  const handleProductImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProductImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProductImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddProduct = () => {
    setShowAddProductModal(true);
    resetProductForm();
  };

  const handleEditProduct = (product: any) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name,
      description: product.description || "",
      price: product.price,
      class: product.class,
      section: product.section,
      category: product.category,
      condition: product.condition,
      sellerName: product.sellerName,
      sellerPhone: product.sellerPhone,
    });
    setProductImagePreview(product.imageUrl || "");
    setShowEditProductModal(true);
  };

  const submitProductForm = () => {
    const formData = {
      ...productForm,
      image: productImageFile,
    };

    if (editingProduct) {
      editProductMutation.mutate({ id: editingProduct.id, data: formData });
    } else {
      addProductMutation.mutate(formData);
    }
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
      {/* Enhanced Admin Header */}
      <header className="bg-card border-b border-border p-4 shadow-sm">
        <div className="flex justify-between items-center max-w-7xl mx-auto">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent" data-testid="text-admin-title">
              🚀 ClassStore Advanced Admin
            </h1>
            <div className="flex items-center space-x-2 bg-green-100 dark:bg-green-900 px-3 py-1 rounded-full">
              <Activity className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-green-700 dark:text-green-300">System Online</span>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-sm text-muted-foreground">
              <div className="flex items-center space-x-2">
                <Target className="h-4 w-4" />
                <span>CPU: {systemMetrics.cpuUsage}%</span>
                <Database className="h-4 w-4 ml-2" />
                <span>Memory: {systemMetrics.memoryUsage}%</span>
                <Users className="h-4 w-4 ml-2" />
                <span>{systemMetrics.activeConnections} active</span>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => systemOptimizationMutation.mutate()}
              disabled={systemOptimizationMutation.isPending}
              data-testid="button-optimize-system"
            >
              <Zap className="h-4 w-4 mr-2" />
              {systemOptimizationMutation.isPending ? "Optimizing..." : "Optimize"}
            </Button>
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
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="dashboard" className="flex items-center space-x-2">
              <BarChart3 className="h-4 w-4" />
              <span>Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="orders" className="flex items-center space-x-2">
              <ShoppingCart className="h-4 w-4" />
              <span>Orders</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center space-x-2">
              <Users className="h-4 w-4" />
              <span>Users</span>
            </TabsTrigger>
            <TabsTrigger value="products" className="flex items-center space-x-2">
              <Package className="h-4 w-4" />
              <span>Products</span>
            </TabsTrigger>
            <TabsTrigger value="emails" className="flex items-center space-x-2">
              <Mail className="h-4 w-4" />
              <span>Emails</span>
            </TabsTrigger>
            <TabsTrigger value="system" className="flex items-center space-x-2">
              <Settings className="h-4 w-4" />
              <span>System</span>
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            {/* Enhanced Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card data-testid="stat-total-orders" className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">Total Orders</p>
                      <p className="text-3xl font-bold text-blue-700 dark:text-blue-300" data-testid="text-total-orders">{stats?.totalOrders || 0}</p>
                      <p className="text-xs text-blue-500 mt-1">+{stats?.weeklyGrowth || 0}% this week</p>
                    </div>
                    <ShoppingCart className="h-12 w-12 text-blue-500" />
                  </div>
                </CardContent>
              </Card>
              
              <Card data-testid="stat-revenue" className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-green-600 dark:text-green-400 font-medium">Total Revenue</p>
                      <p className="text-3xl font-bold text-green-700 dark:text-green-300" data-testid="text-revenue">₹{stats?.revenue || "0.00"}</p>
                      <p className="text-xs text-green-500 mt-1">₹{stats?.dailyRevenue || "0.00"} today</p>
                    </div>
                    <DollarSign className="h-12 w-12 text-green-500" />
                  </div>
                </CardContent>
              </Card>
              
              <Card data-testid="stat-users" className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border-purple-200">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-purple-600 dark:text-purple-400 font-medium">Total Users</p>
                      <p className="text-3xl font-bold text-purple-700 dark:text-purple-300" data-testid="text-total-users">{stats?.totalUsers || 0}</p>
                      <p className="text-xs text-purple-500 mt-1">{stats?.conversionRate || 0}% conversion rate</p>
                    </div>
                    <Users className="h-12 w-12 text-purple-500" />
                  </div>
                </CardContent>
              </Card>
              
              <Card data-testid="stat-active-products" className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 border-orange-200">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-orange-600 dark:text-orange-400 font-medium">Active Products</p>
                      <p className="text-3xl font-bold text-orange-700 dark:text-orange-300" data-testid="text-active-products">{stats?.activeProducts || 0}</p>
                      <p className="text-xs text-orange-500 mt-1">Avg. ₹{stats?.averageOrderValue || "0.00"}</p>
                    </div>
                    <Package className="h-12 w-12 text-orange-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Real-time Analytics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <TrendingUp className="h-5 w-5" />
                    <span>Top Selling Products</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {stats?.topSellingProducts?.map((product, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="font-medium">{product.name}</span>
                        <div className="flex items-center space-x-2">
                          <Progress value={(product.sales / (stats?.totalOrders || 1)) * 100} className="w-20" />
                          <span className="text-sm text-muted-foreground">{product.sales}</span>
                        </div>
                      </div>
                    )) || <p className="text-muted-foreground">No data available</p>}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Activity className="h-5 w-5" />
                    <span>Recent Activity</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {stats?.recentActivity?.map((activity, index) => (
                      <div key={index} className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-primary rounded-full"></div>
                        <div className="flex-1">
                          <p className="text-sm">{activity.action}</p>
                          <p className="text-xs text-muted-foreground">{activity.user} • {activity.time}</p>
                        </div>
                      </div>
                    )) || <p className="text-muted-foreground">No recent activity</p>}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders" className="space-y-6">
            <Card data-testid="table-orders">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Order Management</span>
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm">
                      <Filter className="h-4 w-4 mr-2" />
                      Filter
                    </Button>
                    <Button variant="outline" size="sm">
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Refresh
                    </Button>
                  </div>
                </CardTitle>
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
                        <tr key={order.id} className="border-b border-border hover:bg-muted/50" data-testid={`row-order-${order.id}`}>
                          <td className="p-4 font-mono text-sm" data-testid={`text-order-id-${order.id}`}>
                            #{order.id.slice(-8)}
                          </td>
                          <td className="p-4" data-testid={`text-product-name-${order.id}`}>
                            {order.product.name}
                          </td>
                          <td className="p-4" data-testid={`text-buyer-name-${order.id}`}>
                            <div>
                              <div className="font-medium">{order.buyerName}</div>
                              <div className="text-sm text-muted-foreground">{order.buyerEmail}</div>
                            </div>
                          </td>
                          <td className="p-4 font-semibold" data-testid={`text-order-amount-${order.id}`}>
                            ₹{order.amount}
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
                                    className="bg-green-600 hover:bg-green-700"
                                    onClick={() => confirmOrderMutation.mutate(order.id)}
                                    disabled={confirmOrderMutation.isPending}
                                    data-testid={`button-confirm-${order.id}`}
                                  >
                                    <CheckCircle className="h-4 w-4 mr-1" />
                                    Confirm
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => cancelOrderMutation.mutate(order.id)}
                                    disabled={cancelOrderMutation.isPending}
                                    data-testid={`button-cancel-${order.id}`}
                                  >
                                    <XCircle className="h-4 w-4 mr-1" />
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
                      <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No orders found</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Bulk Email Tab */}
          <TabsContent value="emails" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Mail className="h-5 w-5" />
                  <span>Bulk Email Campaign</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="email-subject">Subject</Label>
                  <Input
                    id="email-subject"
                    placeholder="Enter email subject"
                    value={bulkEmailData.subject}
                    onChange={(e) => setBulkEmailData(prev => ({ ...prev, subject: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="email-content">Content</Label>
                  <Textarea
                    id="email-content"
                    placeholder="Enter email content (HTML supported)"
                    rows={8}
                    value={bulkEmailData.content}
                    onChange={(e) => setBulkEmailData(prev => ({ ...prev, content: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="email-recipients">Recipients (comma-separated emails)</Label>
                  <Textarea
                    id="email-recipients"
                    placeholder="email1@example.com, email2@example.com"
                    rows={3}
                    value={bulkEmailData.recipients}
                    onChange={(e) => setBulkEmailData(prev => ({ ...prev, recipients: e.target.value }))}
                  />
                </div>
                <Button
                  onClick={() => bulkEmailMutation.mutate(bulkEmailData)}
                  disabled={bulkEmailMutation.isPending || !bulkEmailData.subject || !bulkEmailData.content || !bulkEmailData.recipients}
                  className="w-full"
                >
                  <Send className="h-4 w-4 mr-2" />
                  {bulkEmailMutation.isPending ? "Sending..." : "Send Bulk Email"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* System Tab */}
          <TabsContent value="system" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Activity className="h-5 w-5" />
                    <span>System Performance</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">CPU Usage</span>
                      <span className="text-sm text-muted-foreground">{systemMetrics.cpuUsage}%</span>
                    </div>
                    <Progress value={systemMetrics.cpuUsage} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">Memory Usage</span>
                      <span className="text-sm text-muted-foreground">{systemMetrics.memoryUsage}%</span>
                    </div>
                    <Progress value={systemMetrics.memoryUsage} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Active Connections</span>
                      <span className="text-sm text-muted-foreground">{systemMetrics.activeConnections}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Settings className="h-5 w-5" />
                    <span>Quick Actions</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => clearCacheMutation.mutate()}
                    disabled={clearCacheMutation.isPending}
                    data-testid="button-clear-cache"
                  >
                    <Database className="h-4 w-4 mr-2" />
                    {clearCacheMutation.isPending ? "Clearing..." : "Clear Cache"}
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => restartServicesMutation.mutate()}
                    disabled={restartServicesMutation.isPending}
                    data-testid="button-restart-services"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    {restartServicesMutation.isPending ? "Restarting..." : "Restart Services"}
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => exportDataMutation.mutate()}
                    disabled={exportDataMutation.isPending}
                    data-testid="button-export-data"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    {exportDataMutation.isPending ? "Exporting..." : "Export Data"}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-6">
            <Card data-testid="table-users">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center space-x-2">
                    <Users className="h-5 w-5" />
                    <span>User Management</span>
                  </span>
                  <div className="flex items-center space-x-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                      <Input placeholder="Search users..." className="pl-10 w-64" />
                    </div>
                    <Button variant="outline" size="sm">
                      <Filter className="h-4 w-4 mr-2" />
                      Filter
                    </Button>
                    <Button variant="outline" size="sm">
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Refresh
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="text-left p-4 font-medium">User</th>
                        <th className="text-left p-4 font-medium">Contact</th>
                        <th className="text-left p-4 font-medium">Class/Section</th>
                        <th className="text-left p-4 font-medium">Orders</th>
                        <th className="text-left p-4 font-medium">Total Spent</th>
                        <th className="text-left p-4 font-medium">Last Order</th>
                        <th className="text-left p-4 font-medium">Status</th>
                        <th className="text-left p-4 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((user) => (
                        <tr key={user.id} className="border-b border-border hover:bg-muted/50" data-testid={`row-user-${user.id}`}>
                          <td className="p-4" data-testid={`text-user-name-${user.id}`}>
                            <div>
                              <div className="font-medium">{user.name}</div>
                              <div className="text-sm text-muted-foreground">{user.email}</div>
                            </div>
                          </td>
                          <td className="p-4" data-testid={`text-user-phone-${user.id}`}>
                            {user.phone}
                          </td>
                          <td className="p-4" data-testid={`text-user-class-${user.id}`}>
                            Class {user.class}, Section {user.section}
                          </td>
                          <td className="p-4 font-semibold" data-testid={`text-user-orders-${user.id}`}>
                            {user.totalOrders}
                          </td>
                          <td className="p-4 font-semibold text-green-600" data-testid={`text-user-spent-${user.id}`}>
                            ₹{user.totalSpent.toFixed(2)}
                          </td>
                          <td className="p-4 text-sm text-muted-foreground" data-testid={`text-user-last-order-${user.id}`}>
                            {user.lastOrderDate ? new Date(user.lastOrderDate).toLocaleDateString() : 'Never'}
                          </td>
                          <td className="p-4">
                            <Badge 
                              className={user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'} 
                              data-testid={`badge-user-status-${user.id}`}
                            >
                              {user.status}
                            </Badge>
                          </td>
                          <td className="p-4">
                            <div className="flex space-x-2">
                              <Button
                                size="sm"
                                variant="outline"
                                data-testid={`button-view-user-${user.id}`}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                data-testid={`button-edit-user-${user.id}`}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  
                  {users.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground" data-testid="text-no-users">
                      <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No users found</p>
                      <p className="text-sm mt-2">Users will appear here when they place orders</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Products Tab */}
          <TabsContent value="products" className="space-y-6">
            <Card data-testid="table-products">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center space-x-2">
                    <Package className="h-5 w-5" />
                    <span>Product Management</span>
                  </span>
                  <div className="flex items-center space-x-2">
                    <Button 
                      onClick={handleAddProduct}
                      className="bg-green-600 hover:bg-green-700 text-white"
                      size="sm"
                      data-testid="button-add-product"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Product
                    </Button>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                      <Input placeholder="Search products..." className="pl-10 w-64" />
                    </div>
                    <Select defaultValue="all">
                      <SelectTrigger className="w-32">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                        <SelectItem value="sold">Sold Out</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button variant="outline" size="sm">
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Refresh
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="text-left p-4 font-medium">Product</th>
                        <th className="text-left p-4 font-medium">Seller</th>
                        <th className="text-left p-4 font-medium">Price</th>
                        <th className="text-left p-4 font-medium">Category</th>
                        <th className="text-left p-4 font-medium">Sales</th>
                        <th className="text-left p-4 font-medium">Revenue</th>
                        <th className="text-left p-4 font-medium">Status</th>
                        <th className="text-left p-4 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {adminProducts.map((product) => (
                        <tr key={product.id} className="border-b border-border hover:bg-muted/50" data-testid={`row-product-${product.id}`}>
                          <td className="p-4" data-testid={`text-product-name-${product.id}`}>
                            <div className="flex items-center space-x-3">
                              {product.imageUrl && (
                                <img 
                                  src={product.imageUrl} 
                                  alt={product.name}
                                  className="w-12 h-12 object-cover rounded-lg"
                                />
                              )}
                              <div>
                                <div className="font-medium">{product.name}</div>
                                <div className="text-sm text-muted-foreground">Class {product.class}, Section {product.section}</div>
                              </div>
                            </div>
                          </td>
                          <td className="p-4" data-testid={`text-product-seller-${product.id}`}>
                            <div>
                              <div className="font-medium">{product.sellerName}</div>
                              <div className="text-sm text-muted-foreground">{product.sellerPhone}</div>
                            </div>
                          </td>
                          <td className="p-4 font-semibold" data-testid={`text-product-price-${product.id}`}>
                            ₹{product.price}
                          </td>
                          <td className="p-4" data-testid={`text-product-category-${product.id}`}>
                            <Badge variant="outline">{product.category}</Badge>
                          </td>
                          <td className="p-4 font-semibold text-blue-600" data-testid={`text-product-sales-${product.id}`}>
                            {product.totalSales || 0}
                          </td>
                          <td className="p-4 font-semibold text-green-600" data-testid={`text-product-revenue-${product.id}`}>
                            ₹{(product.totalRevenue || 0).toFixed(2)}
                          </td>
                          <td className="p-4">
                            <div className="flex flex-col space-y-1">
                              {product.isSoldOut ? (
                                <Badge className="bg-red-100 text-red-800" data-testid={`badge-sold-out-${product.id}`}>
                                  Sold Out
                                </Badge>
                              ) : product.isActive ? (
                                <Badge className="bg-green-100 text-green-800" data-testid={`badge-active-${product.id}`}>
                                  Active
                                </Badge>
                              ) : (
                                <Badge className="bg-gray-100 text-gray-800" data-testid={`badge-inactive-${product.id}`}>
                                  Inactive
                                </Badge>
                              )}
                              {product.pendingOrders > 0 && (
                                <Badge variant="outline" className="text-xs">
                                  {product.pendingOrders} pending
                                </Badge>
                              )}
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex flex-wrap gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEditProduct(product)}
                                data-testid={`button-edit-product-${product.id}`}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>

                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateProductMutation.mutate({ 
                                  id: product.id, 
                                  isActive: !product.isActive 
                                })}
                                disabled={updateProductMutation.isPending}
                                data-testid={`button-toggle-active-${product.id}`}
                              >
                                {product.isActive ? "Deactivate" : "Activate"}
                              </Button>
                              
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateProductMutation.mutate({ 
                                  id: product.id, 
                                  isSoldOut: !product.isSoldOut 
                                })}
                                disabled={updateProductMutation.isPending}
                                data-testid={`button-toggle-sold-${product.id}`}
                              >
                                {product.isSoldOut ? "Mark Available" : "Mark Sold"}
                              </Button>
                              
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => {
                                  if (confirm("Are you sure you want to delete this product?")) {
                                    deleteProductMutation.mutate(product.id);
                                  }
                                }}
                                disabled={deleteProductMutation.isPending}
                                data-testid={`button-delete-${product.id}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  
                  {adminProducts.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground" data-testid="text-no-products">
                      <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No products found</p>
                      <p className="text-sm mt-2">Products will appear here when sellers list them</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

        </Tabs>
      </div>

      {/* Add Product Modal */}
      <Dialog open={showAddProductModal} onOpenChange={setShowAddProductModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Add New Product</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Image Upload */}
            <div className="space-y-4">
              <Label className="text-lg font-semibold">Product Image</Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                {productImagePreview ? (
                  <div className="relative">
                    <img
                      src={productImagePreview}
                      alt="Preview"
                      className="max-h-48 mx-auto rounded-lg"
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setProductImageFile(null);
                        setProductImagePreview("");
                      }}
                      className="mt-4"
                    >
                      Remove Image
                    </Button>
                  </div>
                ) : (
                  <div>
                    <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <p className="text-lg font-medium mb-4">Upload Product Image</p>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleProductImageChange}
                      className="hidden"
                      id="product-image-upload"
                    />
                    <label htmlFor="product-image-upload">
                      <Button type="button" variant="outline" asChild>
                        <span>Choose Image</span>
                      </Button>
                    </label>
                  </div>
                )}
              </div>
            </div>

            {/* Product Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="add-name">Product Name *</Label>
                <Input
                  id="add-name"
                  value={productForm.name}
                  onChange={(e) => setProductForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., NCERT Math Textbook"
                />
              </div>
              
              <div>
                <Label htmlFor="add-price">Price (₹) *</Label>
                <Input
                  id="add-price"
                  value={productForm.price}
                  onChange={(e) => setProductForm(prev => ({ ...prev, price: e.target.value }))}
                  placeholder="299.00"
                />
              </div>

              <div>
                <Label htmlFor="add-category">Category *</Label>
                <Select value={productForm.category} onValueChange={(value) => setProductForm(prev => ({ ...prev, category: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
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
              </div>

              <div>
                <Label htmlFor="add-condition">Condition *</Label>
                <Select value={productForm.condition} onValueChange={(value) => setProductForm(prev => ({ ...prev, condition: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="New">New</SelectItem>
                    <SelectItem value="Like New">Like New</SelectItem>
                    <SelectItem value="Good">Good</SelectItem>
                    <SelectItem value="Fair">Fair</SelectItem>
                    <SelectItem value="Poor">Poor</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="add-class">Grade/Class *</Label>
                <Select value={productForm.class.toString()} onValueChange={(value) => setProductForm(prev => ({ ...prev, class: parseInt(value) }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[6, 7, 8, 9, 10, 11, 12].map((grade) => (
                      <SelectItem key={grade} value={grade.toString()}>
                        Grade {grade}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="add-section">Section *</Label>
                <Input
                  id="add-section"
                  value={productForm.section}
                  onChange={(e) => setProductForm(prev => ({ ...prev, section: e.target.value }))}
                  placeholder="e.g., A, B, C"
                />
              </div>

              <div>
                <Label htmlFor="add-seller-name">Seller Name *</Label>
                <Input
                  id="add-seller-name"
                  value={productForm.sellerName}
                  onChange={(e) => setProductForm(prev => ({ ...prev, sellerName: e.target.value }))}
                  placeholder="Full name"
                />
              </div>

              <div>
                <Label htmlFor="add-seller-phone">Seller Phone *</Label>
                <Input
                  id="add-seller-phone"
                  value={productForm.sellerPhone}
                  onChange={(e) => setProductForm(prev => ({ ...prev, sellerPhone: e.target.value }))}
                  placeholder="9876543210"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="add-description">Description</Label>
              <Textarea
                id="add-description"
                value={productForm.description}
                onChange={(e) => setProductForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe the product condition, features, etc..."
                rows={4}
              />
            </div>

            <div className="flex space-x-4">
              <Button
                onClick={submitProductForm}
                disabled={addProductMutation.isPending}
                className="flex-1"
              >
                {addProductMutation.isPending ? "Adding..." : "Add Product"}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowAddProductModal(false)}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Product Modal */}
      <Dialog open={showEditProductModal} onOpenChange={setShowEditProductModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Edit Product</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Image Upload */}
            <div className="space-y-4">
              <Label className="text-lg font-semibold">Product Image</Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                {productImagePreview ? (
                  <div className="relative">
                    <img
                      src={productImagePreview}
                      alt="Preview"
                      className="max-h-48 mx-auto rounded-lg"
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setProductImageFile(null);
                        setProductImagePreview("");
                      }}
                      className="mt-4"
                    >
                      Remove Image
                    </Button>
                  </div>
                ) : (
                  <div>
                    <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <p className="text-lg font-medium mb-4">Upload Product Image</p>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleProductImageChange}
                      className="hidden"
                      id="edit-product-image-upload"
                    />
                    <label htmlFor="edit-product-image-upload">
                      <Button type="button" variant="outline" asChild>
                        <span>Choose Image</span>
                      </Button>
                    </label>
                  </div>
                )}
              </div>
            </div>

            {/* Product Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-name">Product Name *</Label>
                <Input
                  id="edit-name"
                  value={productForm.name}
                  onChange={(e) => setProductForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., NCERT Math Textbook"
                />
              </div>
              
              <div>
                <Label htmlFor="edit-price">Price (₹) *</Label>
                <Input
                  id="edit-price"
                  value={productForm.price}
                  onChange={(e) => setProductForm(prev => ({ ...prev, price: e.target.value }))}
                  placeholder="299.00"
                />
              </div>

              <div>
                <Label htmlFor="edit-category">Category *</Label>
                <Select value={productForm.category} onValueChange={(value) => setProductForm(prev => ({ ...prev, category: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
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
              </div>

              <div>
                <Label htmlFor="edit-condition">Condition *</Label>
                <Select value={productForm.condition} onValueChange={(value) => setProductForm(prev => ({ ...prev, condition: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="New">New</SelectItem>
                    <SelectItem value="Like New">Like New</SelectItem>
                    <SelectItem value="Good">Good</SelectItem>
                    <SelectItem value="Fair">Fair</SelectItem>
                    <SelectItem value="Poor">Poor</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="edit-class">Grade/Class *</Label>
                <Select value={productForm.class.toString()} onValueChange={(value) => setProductForm(prev => ({ ...prev, class: parseInt(value) }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[6, 7, 8, 9, 10, 11, 12].map((grade) => (
                      <SelectItem key={grade} value={grade.toString()}>
                        Grade {grade}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="edit-section">Section *</Label>
                <Input
                  id="edit-section"
                  value={productForm.section}
                  onChange={(e) => setProductForm(prev => ({ ...prev, section: e.target.value }))}
                  placeholder="e.g., A, B, C"
                />
              </div>

              <div>
                <Label htmlFor="edit-seller-name">Seller Name *</Label>
                <Input
                  id="edit-seller-name"
                  value={productForm.sellerName}
                  onChange={(e) => setProductForm(prev => ({ ...prev, sellerName: e.target.value }))}
                  placeholder="Full name"
                />
              </div>

              <div>
                <Label htmlFor="edit-seller-phone">Seller Phone *</Label>
                <Input
                  id="edit-seller-phone"
                  value={productForm.sellerPhone}
                  onChange={(e) => setProductForm(prev => ({ ...prev, sellerPhone: e.target.value }))}
                  placeholder="9876543210"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={productForm.description}
                onChange={(e) => setProductForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe the product condition, features, etc..."
                rows={4}
              />
            </div>

            <div className="flex space-x-4">
              <Button
                onClick={submitProductForm}
                disabled={editProductMutation.isPending}
                className="flex-1"
              >
                {editProductMutation.isPending ? "Updating..." : "Update Product"}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowEditProductModal(false)}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
