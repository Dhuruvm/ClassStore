import { useState, useEffect } from "react";
import { useParams } from "wouter";
import { 
  LogOut, ShoppingCart, Clock, DollarSign, Package, Download, Users, 
  TrendingUp, BarChart3, Settings, Mail, Database, Activity, 
  Trash2, Edit, Plus, Filter, Search, RefreshCw, Send,
  Eye, CheckCircle, XCircle, AlertTriangle, Target, Zap
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

  

  // Enhanced bulk operations
  const bulkEmailMutation = useMutation({
    mutationFn: async (emailData: { subject: string; content: string; recipients: string }) => {
      return apiRequest("POST", "/api/admin/bulk-email", emailData);
    },
    onSuccess: (data) => {
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
                  <Button variant="outline" className="w-full justify-start">
                    <Database className="h-4 w-4 mr-2" />
                    Clear Cache
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Restart Services
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Download className="h-4 w-4 mr-2" />
                    Export Data
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center space-x-2">
                    <Users className="h-5 w-5" />
                    <span>User Management</span>
                  </span>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add User
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>User management coming soon...</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Products Tab */}
          <TabsContent value="products" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center space-x-2">
                    <Package className="h-5 w-5" />
                    <span>Product Management</span>
                  </span>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Product
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Product management coming soon...</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

        </Tabs>
      </div>
    </div>
  );
}
