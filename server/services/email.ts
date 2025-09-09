import nodemailer from "nodemailer";

export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: false,
      auth: {
        user: process.env.SMTP_USER || "",
        pass: process.env.SMTP_PASS || "",
      },
    });
  }

  async sendOrderConfirmation(order: any, product: any) {
    const mailOptions = {
      from: process.env.SMTP_FROM || "noreply@classstore.com",
      to: order.buyerEmail,
      subject: `Order Confirmation - ${product.name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Order Confirmation</h2>
          <p>Hi ${order.buyerName},</p>
          <p>Thank you for your order! Here are the details:</p>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>${product.name}</h3>
            <p><strong>Class:</strong> Grade ${product.class} - Section ${product.section}</p>
            <p><strong>Price:</strong> $${order.amount}</p>
            <p><strong>Seller:</strong> ${product.sellerName}</p>
            <p><strong>Contact:</strong> ${product.sellerPhone}</p>
          </div>

          <p>The seller will contact you shortly to arrange pickup and payment.</p>
          
          <p>Best regards,<br>ClassStore Team</p>
        </div>
      `,
    };

    await this.transporter.sendMail(mailOptions);
  }

  async sendSellerNotification(order: any, product: any) {
    const adminUrl = `${process.env.SITE_URL || 'http://localhost:5000'}/admin/${process.env.ADMIN_URL_PART || 'dashboard'}`;
    const confirmUrl = `${adminUrl}/confirm/${order.id}`;
    const cancelUrl = `${adminUrl}/cancel/${order.id}`;

    const mailOptions = {
      from: process.env.SMTP_FROM || "noreply@classstore.com",
      to: process.env.ADMIN_EMAIL || process.env.SMTP_USER,
      subject: `New Order - ${product.name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>New Order Received</h2>
          <p>A new order has been placed on ClassStore:</p>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>${product.name}</h3>
            <p><strong>Order ID:</strong> ${order.id}</p>
            <p><strong>Buyer:</strong> ${order.buyerName}</p>
            <p><strong>Class:</strong> Grade ${order.buyerClass} - Section ${order.buyerSection}</p>
            <p><strong>Email:</strong> ${order.buyerEmail}</p>
            <p><strong>Phone:</strong> ${order.buyerPhone}</p>
            <p><strong>Amount:</strong> $${order.amount}</p>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${confirmUrl}" style="background: #10B981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-right: 10px;">Confirm Order</a>
            <a href="${cancelUrl}" style="background: #EF4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Cancel Order</a>
          </div>
          
          <p>You can also manage this order in the <a href="${adminUrl}">admin panel</a>.</p>
          
          <p>ClassStore Team</p>
        </div>
      `,
    };

    await this.transporter.sendMail(mailOptions);
  }
}

export const emailService = new EmailService();
