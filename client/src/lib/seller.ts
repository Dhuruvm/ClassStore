interface SellerInfo {
  id: string;
  name: string;
  email: string;
  phone: string;
  createdAt: string;
}

interface SellerProduct {
  id: string;
  name: string;
  price: string;
  class: number;
  category: string;
  condition: string;
  approvalStatus: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  uploadedAt: string;
  imageUrl?: string;
}

interface SellerData {
  seller: SellerInfo;
  products: SellerProduct[];
}

export class SellerService {
  private static readonly STORAGE_KEY = 'classstore_seller_data';
  
  // Generate a unique seller ID
  static generateSellerId(): string {
    return `seller_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Get or create seller info
  static getOrCreateSeller(sellerData?: Partial<SellerInfo>): SellerInfo {
    const existingData = this.getSellerData();
    
    if (existingData?.seller) {
      // Update existing seller info if new data provided
      if (sellerData) {
        const updatedSeller = { ...existingData.seller, ...sellerData };
        this.updateSellerInfo(updatedSeller);
        return updatedSeller;
      }
      return existingData.seller;
    }

    // Create new seller with optional info
    const newSeller: SellerInfo = {
      id: this.generateSellerId(),
      name: sellerData?.name || 'Anonymous',
      email: sellerData?.email || '',
      phone: sellerData?.phone || 'Not provided',
      createdAt: new Date().toISOString(),
    };

    this.saveSellerData({
      seller: newSeller,
      products: [],
    });

    return newSeller;
  }

  // Get seller data from localStorage
  static getSellerData(): SellerData | null {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error reading seller data from localStorage:', error);
      return null;
    }
  }

  // Save seller data to localStorage
  static saveSellerData(data: SellerData): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving seller data to localStorage:', error);
    }
  }

  // Update seller info
  static updateSellerInfo(updatedSeller: SellerInfo): void {
    const existingData = this.getSellerData();
    if (existingData) {
      existingData.seller = updatedSeller;
      this.saveSellerData(existingData);
    }
  }

  // Add a product to seller's local storage
  static addProductToLocal(product: SellerProduct): void {
    const existingData = this.getSellerData();
    if (existingData) {
      existingData.products.push(product);
      this.saveSellerData(existingData);
    } else {
      console.error('No seller data found when trying to add product');
    }
  }

  // Update product status in local storage
  static updateProductStatus(productId: string, status: 'pending' | 'approved' | 'rejected', rejectionReason?: string): void {
    const existingData = this.getSellerData();
    if (existingData) {
      const productIndex = existingData.products.findIndex(p => p.id === productId);
      if (productIndex !== -1) {
        existingData.products[productIndex].approvalStatus = status;
        if (rejectionReason) {
          existingData.products[productIndex].rejectionReason = rejectionReason;
        }
        this.saveSellerData(existingData);
      }
    }
  }

  // Get seller's products from local storage
  static getSellerProducts(): SellerProduct[] {
    const data = this.getSellerData();
    return data?.products || [];
  }

  // Get seller info
  static getSellerInfo(): SellerInfo | null {
    const data = this.getSellerData();
    return data?.seller || null;
  }

  // Check if seller exists
  static hasSellerData(): boolean {
    const data = this.getSellerData();
    return !!(data?.seller);
  }

  // Get seller ID
  static getSellerId(): string | null {
    const seller = this.getSellerInfo();
    return seller?.id || null;
  }

  // Get pending products count
  static getPendingProductsCount(): number {
    const products = this.getSellerProducts();
    return products.filter(p => p.approvalStatus === 'pending').length;
  }

  // Get products count by status
  static getProductsCountByStatus(): { pending: number; approved: number; rejected: number } {
    const products = this.getSellerProducts();
    return {
      pending: products.filter(p => p.approvalStatus === 'pending').length,
      approved: products.filter(p => p.approvalStatus === 'approved').length,
      rejected: products.filter(p => p.approvalStatus === 'rejected').length,
    };
  }

  // Sync with server data (merge server data with local data)
  static async syncWithServer(serverProducts?: any[]): Promise<void> {
    if (!serverProducts) return;

    const localData = this.getSellerData();
    if (!localData) return;

    // Update local products with server status
    serverProducts.forEach(serverProduct => {
      const localProductIndex = localData.products.findIndex(p => p.id === serverProduct.id);
      if (localProductIndex !== -1) {
        // Update existing product with server data
        localData.products[localProductIndex].approvalStatus = serverProduct.approvalStatus;
        localData.products[localProductIndex].rejectionReason = serverProduct.rejectionReason;
      } else {
        // Add server product that's not in local storage
        localData.products.push({
          id: serverProduct.id,
          name: serverProduct.name,
          price: serverProduct.price,
          class: serverProduct.class,
          category: serverProduct.category,
          condition: serverProduct.condition,
          approvalStatus: serverProduct.approvalStatus,
          rejectionReason: serverProduct.rejectionReason,
          uploadedAt: serverProduct.createdAt || new Date().toISOString(),
          imageUrl: serverProduct.imageUrl,
        });
      }
    });

    this.saveSellerData(localData);
  }

  // Clear seller data (for testing/reset)
  static clearSellerData(): void {
    localStorage.removeItem(this.STORAGE_KEY);
  }

  // Get summary statistics
  static getSellerSummary() {
    const seller = this.getSellerInfo();
    const products = this.getSellerProducts();
    const counts = this.getProductsCountByStatus();

    return {
      seller,
      totalProducts: products.length,
      ...counts,
      lastActivity: products.length > 0 ? 
        Math.max(...products.map(p => new Date(p.uploadedAt).getTime())) : null,
    };
  }
}