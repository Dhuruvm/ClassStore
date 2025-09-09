import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";

export class PDFService {
  static async generateInvoicePDF(orderId: string, product: any, buyer: any): Promise<string> {
    const invoicesDir = path.join(process.cwd(), "server", "invoices");
    if (!fs.existsSync(invoicesDir)) {
      fs.mkdirSync(invoicesDir, { recursive: true });
    }

    const filePath = path.join(invoicesDir, `${orderId}.pdf`);
    const doc = new PDFDocument();
    
    doc.pipe(fs.createWriteStream(filePath));

    // Header
    doc.fontSize(20).text("ClassStore", 50, 50);
    doc.fontSize(16).text("Invoice", 50, 80);

    // Order details
    doc.fontSize(12);
    doc.text(`Invoice #: ${orderId}`, 50, 120);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 50, 140);

    // Buyer information
    doc.text("Bill To:", 50, 180);
    doc.text(`${buyer.buyerName}`, 50, 200);
    doc.text(`Grade ${buyer.buyerClass} - Section ${buyer.buyerSection}`, 50, 220);
    doc.text(`${buyer.buyerEmail}`, 50, 240);
    doc.text(`${buyer.buyerPhone}`, 50, 260);

    // Product details
    doc.text("Product Details:", 50, 320);
    doc.text(`${product.name}`, 50, 340);
    doc.text(`Class: Grade ${product.class} - Section ${product.section}`, 50, 360);
    doc.text(`Seller: ${product.sellerName}`, 50, 380);

    // Pricing
    doc.text("Amount:", 400, 320);
    doc.text(`$${buyer.amount}`, 400, 340);

    // Footer
    doc.text("Thank you for using ClassStore!", 50, 500);
    doc.text("For support, contact us at support@classstore.com", 50, 520);

    doc.end();

    return filePath;
  }
}
