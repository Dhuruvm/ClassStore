// Client-side UUID generation using crypto.randomUUID() or fallback

export interface CustomerData {
  customerId: string;
  name?: string;
  email?: string;
  phone?: string;
  class?: number;
  section?: string;
  createdAt: string;
}

export interface CustomerOrder {
  orderId: string;
  productId: string;
  productName: string;
  productPrice: string;
  status: "pending" | "confirmed" | "delivered" | "cancelled";
  createdAt: string;
  pickupLocation: string;
  pickupTime: string;
  cancelledBy?: string;
  cancellationReason?: string;
}

export class CustomerService {
  private static CUSTOMER_KEY = "classstore_customer";
  private static ORDERS_KEY = "classstore_customer_orders";

  // Generate a unique customer ID
  static generateCustomerId(): string {
    // Use crypto.randomUUID if available, otherwise fallback to timestamp + random
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return `customer_${crypto.randomUUID()}`;
    }
    return `customer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Get or create customer data from localStorage
  static getOrCreateCustomer(): CustomerData {
    const stored = localStorage.getItem(this.CUSTOMER_KEY);
    
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (error) {
        console.error("Error parsing stored customer data:", error);
      }
    }
    
    // Create new customer
    const newCustomer: CustomerData = {
      customerId: this.generateCustomerId(),
      createdAt: new Date().toISOString(),
    };
    
    localStorage.setItem(this.CUSTOMER_KEY, JSON.stringify(newCustomer));
    return newCustomer;
  }

  // Update customer information
  static updateCustomer(updates: Partial<CustomerData>): CustomerData {
    const customer = this.getOrCreateCustomer();
    const updatedCustomer = { ...customer, ...updates };
    
    localStorage.setItem(this.CUSTOMER_KEY, JSON.stringify(updatedCustomer));
    return updatedCustomer;
  }

  // Get customer ID
  static getCustomerId(): string {
    const customer = this.getOrCreateCustomer();
    return customer.customerId;
  }

  // Store order in localStorage
  static storeOrder(orderData: {
    orderId: string;
    productId: string;
    productName: string;
    productPrice: string;
    pickupLocation: string;
    pickupTime: string;
  }): void {
    const customerOrder: CustomerOrder = {
      ...orderData,
      status: "pending",
      createdAt: new Date().toISOString(),
    };

    const orders = this.getCustomerOrders();
    orders.push(customerOrder);
    
    localStorage.setItem(this.ORDERS_KEY, JSON.stringify(orders));
  }

  // Get customer orders from localStorage
  static getCustomerOrders(): CustomerOrder[] {
    const stored = localStorage.getItem(this.ORDERS_KEY);
    
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (error) {
        console.error("Error parsing stored orders:", error);
      }
    }
    
    return [];
  }

  // Update order status in localStorage
  static updateOrderStatus(orderId: string, status: CustomerOrder['status'], cancelledBy?: string, cancellationReason?: string): void {
    const orders = this.getCustomerOrders();
    const orderIndex = orders.findIndex(order => order.orderId === orderId);
    
    if (orderIndex !== -1) {
      orders[orderIndex].status = status;
      if (cancelledBy && cancellationReason) {
        orders[orderIndex].cancelledBy = cancelledBy;
        orders[orderIndex].cancellationReason = cancellationReason;
      }
      
      localStorage.setItem(this.ORDERS_KEY, JSON.stringify(orders));
    }
  }

  // Get specific order
  static getOrder(orderId: string): CustomerOrder | undefined {
    const orders = this.getCustomerOrders();
    return orders.find(order => order.orderId === orderId);
  }

  // Check if order can be cancelled
  static canCancelOrder(orderId: string): boolean {
    const order = this.getOrder(orderId);
    return order?.status === "pending" || order?.status === "confirmed";
  }

  // Clear customer data (for testing or reset)
  static clearCustomerData(): void {
    localStorage.removeItem(this.CUSTOMER_KEY);
    localStorage.removeItem(this.ORDERS_KEY);
  }

  // Sync customer info from order form
  static syncCustomerFromOrder(orderData: {
    buyerName: string;
    buyerEmail: string;
    buyerPhone: string;
    buyerClass: number;
    buyerSection: string;
  }): void {
    this.updateCustomer({
      name: orderData.buyerName,
      email: orderData.buyerEmail,
      phone: orderData.buyerPhone,
      class: orderData.buyerClass,
      section: orderData.buyerSection,
    });
  }
}