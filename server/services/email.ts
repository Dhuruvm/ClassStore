import axios, { AxiosInstance } from 'axios';

export class EnhancedEmailService {
  private apiClient: AxiosInstance;
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.OMNISEND_API_KEY || '';
    
    // Configure Omnisend API client
    this.apiClient = axios.create({
      baseURL: 'https://api.omnisend.com/v3',
      headers: {
        'X-API-KEY': this.apiKey,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });

    // Add response interceptor for error handling
    this.apiClient.interceptors.response.use(
      response => response,
      error => {
        if (error.response) {
          console.error(`Omnisend API Error ${error.response.status}:`, error.response.data);
        } else if (error.request) {
          console.error('No response from Omnisend API:', error.request);
        } else {
          console.error('Request setup error:', error.message);
        }
        return Promise.reject(error);
      }
    );
  }

  async verifyConnection() {
    try {
      if (!this.apiKey) {
        console.error("✗ Omnisend API key not found");
        console.error("❌ Omnisend Configuration Required:");
        console.error("   1. Sign up for Omnisend account at https://omnisend.com");
        console.error("   2. Go to Account → Integrations & API");
        console.error("   3. Create a new API key");
        console.error("   4. Set OMNISEND_API_KEY environment variable");
        return false;
      }
      
      // Test API connection by getting brands info (lightweight endpoint)
      await this.apiClient.get('/brands');
      console.log("✓ Omnisend email service connection verified successfully");
      return true;
    } catch (error: any) {
      console.error("✗ Omnisend email service connection failed");
      console.error("❌ Omnisend API Error:");
      console.error("   Please check your OMNISEND_API_KEY");
      console.error("   Error details:", error.message);
      return false;
    }
  }

  private async createOrUpdateContact(email: string, firstName: string = '', lastName: string = '') {
    try {
      // First, try to get the contact
      const encodedEmail = encodeURIComponent(email);
      let contactExists = false;
      
      try {
        await this.apiClient.get(`/contacts/${encodedEmail}`);
        contactExists = true;
      } catch (error: any) {
        if (error.response?.status === 404) {
          contactExists = false;
        } else {
          throw error;
        }
      }

      const contactData = {
        email: email,
        firstName: firstName,
        lastName: lastName,
        status: 'subscribed'
      };

      if (contactExists) {
        // Update existing contact
        const response = await this.apiClient.patch(`/contacts/${encodedEmail}`, contactData);
        return response.data;
      } else {
        // Create new contact
        const response = await this.apiClient.post('/contacts', contactData);
        return response.data;
      }
    } catch (error) {
      console.error('Error creating/updating contact:', error);
      // Don't throw error, just log it as contact management is not critical for sending emails
    }
  }

  private async sendTransactionalEmail(emailData: {
    to: string;
    toName: string;
    subject: string;
    htmlContent: string;
    from?: string;
    fromName?: string;
  }) {
    try {
      // Create or update contact first
      await this.createOrUpdateContact(emailData.to, emailData.toName);

      // Send email using Omnisend's messaging API
      const messageData = {
        email: emailData.to,
        subject: emailData.subject,
        content: {
          html: emailData.htmlContent
        },
        from: {
          email: emailData.from || process.env.SMTP_FROM || "noreply@classstore.com",
          name: emailData.fromName || "ClassStore"
        }
      };

      const response = await this.apiClient.post('/messages', messageData);
      return response.data;
    } catch (error) {
      console.error('Failed to send transactional email:', error);
      throw error;
    }
  }

  async sendOrderConfirmation(order: any, product: any) {
    const htmlContent = `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 600;">Order Confirmed! 🎉</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">Thank you for your purchase, ${order.buyerName}</p>
        </div>
        
        <!-- Content -->
        <div style="padding: 40px 30px;">
          <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
            Great news! Your order has been confirmed and the seller will contact you shortly to arrange pickup and payment.
          </p>
          
          <!-- Product Card -->
          <div style="background: #f8fafc; border: 2px solid #e2e8f0; border-radius: 12px; padding: 30px; margin: 30px 0;">
            <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 22px; font-weight: 600;">${product.name}</h2>
            <div style="display: grid; gap: 12px;">
              <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
                <span style="color: #6b7280; font-weight: 500;">Class & Section:</span>
                <span style="color: #374151; font-weight: 600;">Grade ${product.class} - Section ${product.section}</span>
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
                <span style="color: #6b7280; font-weight: 500;">Total Amount:</span>
                <span style="color: #059669; font-weight: 700; font-size: 18px;">₹${order.amount}</span>
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
                <span style="color: #6b7280; font-weight: 500;">Seller:</span>
                <span style="color: #374151; font-weight: 600;">${product.sellerName}</span>
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0;">
                <span style="color: #6b7280; font-weight: 500;">Contact:</span>
                <span style="color: #2563eb; font-weight: 600;">${product.sellerPhone}</span>
              </div>
            </div>
          </div>

          <!-- Order ID -->
          <div style="background: #ecfdf5; border-left: 4px solid #10b981; padding: 20px; margin: 30px 0; border-radius: 0 8px 8px 0;">
            <p style="margin: 0; color: #065f46; font-weight: 600;">
              📋 Order ID: <span style="font-family: monospace; background: #d1fae5; padding: 4px 8px; border-radius: 4px;">${order.id}</span>
            </p>
          </div>

          <!-- Next Steps -->
          <div style="background: #fef3c7; border: 1px solid #fcd34d; border-radius: 8px; padding: 20px; margin: 30px 0;">
            <h3 style="color: #92400e; margin: 0 0 12px 0; font-size: 18px;">📞 What happens next?</h3>
            <ul style="color: #92400e; margin: 0; padding-left: 20px; line-height: 1.8;">
              <li>The seller will contact you within 24 hours</li>
              <li>Arrange a convenient pickup time and location</li>
              <li>Complete payment upon item collection</li>
              <li>Enjoy your new textbook!</li>
            </ul>
          </div>
        </div>
        
        <!-- Footer -->
        <div style="background: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; margin: 0 0 10px 0; font-size: 14px;">
            Questions? Need help? Contact us anytime.
          </p>
          <p style="color: #374151; margin: 0; font-weight: 600; font-size: 16px;">
            Best regards,<br>
            <span style="color: #667eea;">ClassStore Team</span>
          </p>
        </div>
      </div>
    `;

    try {
      const result = await this.sendTransactionalEmail({
        to: order.buyerEmail,
        toName: order.buyerName,
        subject: `Order Confirmation - ${product.name}`,
        htmlContent
      });
      console.log("✓ Order confirmation email sent successfully");
      return result;
    } catch (error) {
      console.error("✗ Failed to send order confirmation email:", error);
      throw error;
    }
  }

  async sendSellerNotification(order: any, product: any) {
    const adminUrl = `${process.env.SITE_URL || 'http://localhost:5000'}/admin/${process.env.ADMIN_URL_PART || 'dashboard'}`;
    const confirmUrl = `${adminUrl}/confirm/${order.id}`;
    const cancelUrl = `${adminUrl}/cancel/${order.id}`;

    const htmlContent = `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 40px 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 600;">🛒 New Order Received!</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">A new order requires your attention</p>
        </div>
        
        <!-- Content -->
        <div style="padding: 40px 30px;">
          <!-- Order Details -->
          <div style="background: #f8fafc; border: 2px solid #e2e8f0; border-radius: 12px; padding: 30px; margin: 30px 0;">
            <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 22px; font-weight: 600;">${product.name}</h2>
            <div style="display: grid; gap: 12px;">
              <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
                <span style="color: #6b7280; font-weight: 500;">Order ID:</span>
                <span style="font-family: monospace; color: #374151; font-weight: 600; background: #e5e7eb; padding: 4px 8px; border-radius: 4px;">${order.id}</span>
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
                <span style="color: #6b7280; font-weight: 500;">Customer:</span>
                <span style="color: #374151; font-weight: 600;">${order.buyerName}</span>
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
                <span style="color: #6b7280; font-weight: 500;">Class & Section:</span>
                <span style="color: #374151; font-weight: 600;">Grade ${order.buyerClass} - Section ${order.buyerSection}</span>
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
                <span style="color: #6b7280; font-weight: 500;">Email:</span>
                <span style="color: #2563eb; font-weight: 600;">${order.buyerEmail}</span>
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
                <span style="color: #6b7280; font-weight: 500;">Phone:</span>
                <span style="color: #2563eb; font-weight: 600;">${order.buyerPhone}</span>
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0;">
                <span style="color: #6b7280; font-weight: 500;">Amount:</span>
                <span style="color: #059669; font-weight: 700; font-size: 18px;">₹${order.amount}</span>
              </div>
            </div>
          </div>

          <!-- Action Buttons -->
          <div style="text-align: center; margin: 40px 0;">
            <a href="${confirmUrl}" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; margin-right: 15px; font-weight: 600; font-size: 16px; display: inline-block; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3); transition: all 0.3s ease;">✅ Confirm Order</a>
            <a href="${cancelUrl}" style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block; box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3); transition: all 0.3s ease;">❌ Cancel Order</a>
          </div>

          <!-- Admin Panel Link -->
          <div style="background: #ede9fe; border: 1px solid #c4b5fd; border-radius: 8px; padding: 20px; margin: 30px 0; text-align: center;">
            <p style="color: #5b21b6; margin: 0 0 12px 0; font-weight: 600;">🔧 Admin Panel</p>
            <a href="${adminUrl}" style="color: #7c3aed; text-decoration: none; font-weight: 600; border-bottom: 2px solid #7c3aed;">Manage all orders in admin dashboard →</a>
          </div>
        </div>
        
        <!-- Footer -->
        <div style="background: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; margin: 0 0 10px 0; font-size: 14px;">
            This is an automated notification from ClassStore
          </p>
          <p style="color: #374151; margin: 0; font-weight: 600; font-size: 16px;">
            <span style="color: #f59e0b;">ClassStore</span> Admin System
          </p>
        </div>
      </div>
    `;

    try {
      const result = await this.sendTransactionalEmail({
        to: process.env.ADMIN_EMAIL || process.env.SMTP_USER || "admin@classstore.com",
        toName: "ClassStore Admin",
        subject: `🛒 New Order Alert - ${product.name}`,
        htmlContent,
        fromName: "ClassStore System"
      });
      console.log("✓ Admin notification email sent successfully");
      return result;
    } catch (error) {
      console.error("✗ Failed to send admin notification email:", error);
      throw error;
    }
  }

  async sendCancellationConfirmation(order: any, product: any, reason: string) {
    const htmlContent = `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 40px 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 600;">Order Cancelled ❌</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">Your order has been cancelled successfully</p>
        </div>
        
        <!-- Content -->
        <div style="padding: 40px 30px;">
          <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
            Hi ${order.buyerName}, your order has been cancelled as requested. No payment is required and you don't need to pick up the item.
          </p>
          
          <!-- Product Card -->
          <div style="background: #fef2f2; border: 2px solid #fecaca; border-radius: 12px; padding: 30px; margin: 30px 0;">
            <h2 style="color: #991b1b; margin: 0 0 20px 0; font-size: 22px; font-weight: 600;">${product.name}</h2>
            <div style="display: grid; gap: 12px;">
              <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #fecaca;">
                <span style="color: #7f1d1d; font-weight: 500;">Order ID:</span>
                <span style="font-family: monospace; color: #991b1b; font-weight: 600;">${order.id}</span>
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #fecaca;">
                <span style="color: #7f1d1d; font-weight: 500;">Amount:</span>
                <span style="color: #991b1b; font-weight: 700; font-size: 18px;">₹${order.amount}</span>
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #fecaca;">
                <span style="color: #7f1d1d; font-weight: 500;">Reason:</span>
                <span style="color: #991b1b; font-weight: 600;">${reason}</span>
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0;">
                <span style="color: #7f1d1d; font-weight: 500;">Cancelled By:</span>
                <span style="color: #991b1b; font-weight: 600;">You (Customer)</span>
              </div>
            </div>
          </div>
          
          <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin-top: 30px;">
            This cancellation is final. If you change your mind, you'll need to place a new order (if the item is still available).
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.SITE_URL || 'http://localhost:5000'}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block;">🛒 Browse More Products</a>
          </div>
        </div>
      </div>
    `;

    try {
      const result = await this.sendTransactionalEmail({
        to: order.buyerEmail,
        toName: order.buyerName,
        subject: `Order Cancelled - ${product.name}`,
        htmlContent
      });
      console.log("✓ Cancellation confirmation email sent successfully");
      return result;
    } catch (error) {
      console.error("✗ Failed to send cancellation confirmation email:", error);
      throw error;
    }
  }

  async sendCancellationNotification(order: any, product: any, reason: string) {
    const adminUrl = `${process.env.SITE_URL || 'http://localhost:5000'}/admin/${process.env.ADMIN_URL_PART || 'z3XJbf0x0vXsCxnUZnscBRsnE'}`;
    
    const htmlContent = `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 40px 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 600;">📝 Order Cancelled by Customer</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">A customer has cancelled their order</p>
        </div>
        
        <!-- Content -->
        <div style="padding: 40px 30px;">
          <!-- Order Details -->
          <div style="background: #fffbeb; border: 2px solid #fed7aa; border-radius: 12px; padding: 30px; margin: 30px 0;">
            <h2 style="color: #92400e; margin: 0 0 20px 0; font-size: 22px; font-weight: 600;">${product.name}</h2>
            <div style="display: grid; gap: 12px;">
              <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #fed7aa;">
                <span style="color: #78350f; font-weight: 500;">Order ID:</span>
                <span style="font-family: monospace; color: #92400e; font-weight: 600;">${order.id}</span>
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #fed7aa;">
                <span style="color: #78350f; font-weight: 500;">Customer:</span>
                <span style="color: #92400e; font-weight: 600;">${order.buyerName}</span>
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #fed7aa;">
                <span style="color: #78350f; font-weight: 500;">Class & Section:</span>
                <span style="color: #92400e; font-weight: 600;">Grade ${order.buyerClass} - Section ${order.buyerSection}</span>
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #fed7aa;">
                <span style="color: #78350f; font-weight: 500;">Amount:</span>
                <span style="color: #92400e; font-weight: 700; font-size: 18px;">₹${order.amount}</span>
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #fed7aa;">
                <span style="color: #78350f; font-weight: 500;">Email:</span>
                <span style="color: #92400e; font-weight: 600;">${order.buyerEmail}</span>
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #fed7aa;">
                <span style="color: #78350f; font-weight: 500;">Phone:</span>
                <span style="color: #92400e; font-weight: 600;">${order.buyerPhone}</span>
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #fed7aa;">
                <span style="color: #78350f; font-weight: 500;">Cancellation Reason:</span>
                <span style="color: #92400e; font-weight: 600; font-style: italic;">"${reason}"</span>
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0;">
                <span style="color: #78350f; font-weight: 500;">Cancelled By:</span>
                <span style="color: #92400e; font-weight: 600;">Customer</span>
              </div>
            </div>
          </div>
          
          <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
            The customer has cancelled this order. The product is now available for other customers to purchase.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${adminUrl}" style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block;">📊 View Admin Dashboard</a>
          </div>
        </div>
      </div>
    `;

    try {
      const result = await this.sendTransactionalEmail({
        to: process.env.ADMIN_EMAIL || process.env.SMTP_USER || "admin@classstore.com",
        toName: "ClassStore Admin",
        subject: `📝 Order Cancellation Alert - ${product.name}`,
        htmlContent,
        fromName: "ClassStore System"
      });
      console.log("✓ Admin cancellation notification email sent successfully");
      return result;
    } catch (error) {
      console.error("✗ Failed to send admin cancellation notification email:", error);
      throw error;
    }
  }

  async sendWelcomeEmail(userData: {
    email: string;
    name: string;
    userType: 'buyer' | 'seller' | 'admin';
  }): Promise<boolean> {
    const htmlContent = `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 600;">🎓 Welcome to ClassStore!</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">Hello ${userData.name}, you're all set as a ${userData.userType}!</p>
        </div>
        
        <div style="padding: 40px 30px;">
          <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
            Welcome to ClassStore - the ultimate marketplace for students! Whether you're buying textbooks, selling supplies, or trading gear, you're in the right place.
          </p>
          
          <div style="background: #f8fafc; border: 2px solid #e2e8f0; border-radius: 12px; padding: 30px; margin: 30px 0;">
            <h3 style="color: #1f2937; margin: 0 0 20px 0; font-size: 22px; font-weight: 600;">🚀 What you can do:</h3>
            <ul style="color: #374151; line-height: 1.8; padding-left: 20px;">
              <li>Buy and sell textbooks, supplies, and equipment</li>
              <li>Connect with students in your class and section</li>
              <li>Browse products by class and category</li>
              <li>Secure transactions and direct communication</li>
              <li>Track your orders and sales history</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.SITE_URL || 'http://localhost:5000'}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block;">🚀 Start Exploring</a>
          </div>
        </div>
      </div>
    `;

    try {
      await this.sendTransactionalEmail({
        to: userData.email,
        toName: userData.name,
        subject: "Welcome to ClassStore - Your Student Marketplace! 🎓",
        htmlContent
      });
      
      // Track the event in Omnisend for better segmentation
      await this.triggerEvent(userData.email, 'user-registered', {
        userType: userData.userType,
        registrationDate: new Date().toISOString()
      });
      
      console.log(`✅ Welcome email sent to ${userData.email}`);
      return true;
    } catch (error) {
      console.error("Failed to send welcome email:", error);
      return false;
    }
  }

  async sendBulkEmails(template: BulkEmailTemplate): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;

    for (const recipient of template.recipients) {
      try {
        await this.sendTransactionalEmail({
          to: recipient.email,
          toName: recipient.name,
          subject: template.subject,
          htmlContent: template.htmlContent.replace(/{{name}}/g, recipient.name)
        });
        success++;
        this.analytics.trackSent();
      } catch (error) {
        failed++;
        this.analytics.trackFailed();
        console.error(`Failed to send email to ${recipient.email}:`, error);
      }
    }

    console.log(`📧 Bulk email complete: ${success} sent, ${failed} failed`);
    return { success, failed };
  }

  async sendPromotionalEmail(campaignData: {
    subject: string;
    content: string;
    recipients: Array<{ email: string; name: string; }>;
  }): Promise<{ success: number; failed: number }> {
    return await this.sendBulkEmails({
      subject: campaignData.subject,
      htmlContent: campaignData.content,
      recipients: campaignData.recipients
    });
  }

  // Omnisend-specific event tracking
  async triggerEvent(email: string, eventName: string, properties: any = {}) {
    try {
      const eventData = {
        email: email,
        eventName: eventName,
        properties: properties
      };

      const response = await this.apiClient.post('/events', eventData);
      console.log(`✓ Event '${eventName}' triggered for ${email}`);
      return response.data;
    } catch (error) {
      console.error(`✗ Failed to trigger event '${eventName}' for ${email}:`, error);
      // Don't throw error as event tracking is not critical
    }
  }

  // Get email campaign analytics
  async getCampaignStats(campaignId?: string) {
    try {
      const endpoint = campaignId ? `/campaigns/${campaignId}/stats` : '/campaigns/stats';
      const response = await this.apiClient.get(endpoint);
      return response.data;
    } catch (error) {
      console.error('Failed to get campaign stats:', error);
      return null;
    }
  }

  public analytics = new EmailAnalyticsService();
}

// Enhanced bulk email functionality
interface BulkEmailTemplate {
  subject: string;
  htmlContent: string;
  recipients: Array<{ email: string; name: string; }>;
}

interface EmailAnalytics {
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  bounced: number;
  failed: number;
}

class EmailAnalyticsService {
  private stats: EmailAnalytics = {
    sent: 0,
    delivered: 0,
    opened: 0,
    clicked: 0,
    bounced: 0,
    failed: 0
  };

  trackSent() { this.stats.sent++; }
  trackDelivered() { this.stats.delivered++; }
  trackOpened() { this.stats.opened++; }
  trackClicked() { this.stats.clicked++; }
  trackBounced() { this.stats.bounced++; }
  trackFailed() { this.stats.failed++; }

  getStats(): EmailAnalytics {
    return { ...this.stats };
  }

  reset() {
    this.stats = { sent: 0, delivered: 0, opened: 0, clicked: 0, bounced: 0, failed: 0 };
  }
}

export const emailService = new EnhancedEmailService();