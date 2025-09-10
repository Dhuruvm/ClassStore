import * as brevo from '@getbrevo/brevo';

export class EnhancedEmailService {
  private apiInstance: brevo.TransactionalEmailsApi;
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.BREVO_API_KEY || '';
    
    // Configure Brevo API with API key
    this.apiInstance = new brevo.TransactionalEmailsApi();
    this.apiInstance.setApiKey(brevo.TransactionalEmailsApiApiKeys.apiKey, this.apiKey);
  }

  async verifyConnection() {
    try {
      if (!this.apiKey) {
        console.error("✗ Brevo API key not found");
        console.error("❌ Brevo Configuration Required:");
        console.error("   1. Sign up for Brevo account at https://brevo.com");
        console.error("   2. Go to SMTP & API → API Keys");
        console.error("   3. Create a new API key");
        console.error("   4. Set BREVO_API_KEY environment variable");
        return false;
      }
      
      // Test API connection by getting account info
      const accountApi = new brevo.AccountApi();
      await accountApi.getAccount();
      console.log("✓ Brevo email service connection verified successfully");
      return true;
    } catch (error: any) {
      console.error("✗ Brevo email service connection failed");
      console.error("❌ Brevo API Error:");
      console.error("   Please check your BREVO_API_KEY");
      console.error("   Error details:", error.message);
      return false;
    }
  }

  async sendOrderConfirmation(order: any, product: any) {
    const sendSmtpEmail = new brevo.SendSmtpEmail();
    
    sendSmtpEmail.to = [{ email: order.buyerEmail, name: order.buyerName }];
    sendSmtpEmail.sender = { 
      email: process.env.SMTP_FROM || "noreply@classstore.com", 
      name: "ClassStore" 
    };
    sendSmtpEmail.subject = `Order Confirmation - ${product.name}`;
    sendSmtpEmail.htmlContent = `
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
      const result = await this.apiInstance.sendTransacEmail(sendSmtpEmail);
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

    const sendSmtpEmail = new brevo.SendSmtpEmail();
    
    sendSmtpEmail.to = [{ 
      email: process.env.ADMIN_EMAIL || process.env.SMTP_USER || "admin@classstore.com", 
      name: "ClassStore Admin" 
    }];
    sendSmtpEmail.sender = { 
      email: process.env.SMTP_FROM || "noreply@classstore.com", 
      name: "ClassStore System" 
    };
    sendSmtpEmail.subject = `🛒 New Order Alert - ${product.name}`;
    sendSmtpEmail.htmlContent = `
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
      const result = await this.apiInstance.sendTransacEmail(sendSmtpEmail);
      console.log("✓ Admin notification email sent successfully");
      return result;
    } catch (error) {
      console.error("✗ Failed to send admin notification email:", error);
      throw error;
    }
  }
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

// Add enhanced methods to the existing service
EnhancedEmailService.prototype.analytics = new EmailAnalyticsService();

EnhancedEmailService.prototype.sendBulkEmails = async function(template: BulkEmailTemplate): Promise<{ success: number; failed: number }> {
  let success = 0;
  let failed = 0;

  for (const recipient of template.recipients) {
    try {
      const sendSmtpEmail = new brevo.SendSmtpEmail();
      sendSmtpEmail.to = [{ email: recipient.email, name: recipient.name }];
      sendSmtpEmail.sender = { 
        email: process.env.SMTP_FROM || "noreply@classstore.com", 
        name: "ClassStore" 
      };
      sendSmtpEmail.subject = template.subject;
      sendSmtpEmail.htmlContent = template.htmlContent.replace(/{{name}}/g, recipient.name);

      await this.apiInstance.sendTransacEmail(sendSmtpEmail);
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
};

EnhancedEmailService.prototype.sendWelcomeEmail = async function(userData: {
  email: string;
  name: string;
  userType: 'buyer' | 'seller' | 'admin';
}): Promise<boolean> {
  const sendSmtpEmail = new brevo.SendSmtpEmail();
  
  sendSmtpEmail.to = [{ email: userData.email, name: userData.name }];
  sendSmtpEmail.sender = { 
    email: process.env.SMTP_FROM || "noreply@classstore.com", 
    name: "ClassStore" 
  };
  sendSmtpEmail.subject = "Welcome to ClassStore - Your Student Marketplace! 🎓";
  sendSmtpEmail.htmlContent = `
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
    await this.apiInstance.sendTransacEmail(sendSmtpEmail);
    this.analytics.trackSent();
    console.log(`✅ Welcome email sent to ${userData.email}`);
    return true;
  } catch (error) {
    this.analytics.trackFailed();
    console.error("Failed to send welcome email:", error);
    return false;
  }
};

EnhancedEmailService.prototype.sendPromotionalEmail = async function(campaignData: {
  subject: string;
  content: string;
  recipients: Array<{ email: string; name: string; }>;
}): Promise<{ success: number; failed: number }> {
  return await this.sendBulkEmails({
    subject: campaignData.subject,
    htmlContent: campaignData.content,
    recipients: campaignData.recipients
  });
};

export const emailService = new EnhancedEmailService();