import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";

interface InvoiceData {
  orderId: string;
  product: any;
  buyer: any;
  invoiceNumber?: string;
}

export class PDFService {
  static async generateInvoicePDF(orderId: string, product: any, buyer: any): Promise<string> {
    const invoicesDir = path.join(process.cwd(), "server", "invoices");
    if (!fs.existsSync(invoicesDir)) {
      fs.mkdirSync(invoicesDir, { recursive: true });
    }

    const filePath = path.join(invoicesDir, `${orderId}.pdf`);
    
    // Generate invoice number (can be enhanced to use sequential numbering)
    const invoiceNumber = `INV-${new Date().getFullYear()}-${orderId.slice(-8).toUpperCase()}`;
    
    const doc = new PDFDocument({ 
      size: 'A4',
      margin: 50,
      info: {
        Title: `Invoice ${invoiceNumber}`,
        Subject: 'ClassStore Transaction Invoice',
        Author: 'ClassStore',
        Creator: 'ClassStore Invoice System'
      }
    });
    
    doc.pipe(fs.createWriteStream(filePath));

    // Colors and styling
    const primaryColor = '#2563eb';
    const secondaryColor = '#64748b';
    const accentColor = '#f8fafc';

    // Header with professional branding
    this.drawHeader(doc, primaryColor, invoiceNumber);
    
    // Company information
    this.drawCompanyInfo(doc, secondaryColor);
    
    // Invoice details section
    this.drawInvoiceDetails(doc, {
      orderId,
      product,
      buyer,
      invoiceNumber
    }, primaryColor);

    // Billing and product information
    this.drawBillingSection(doc, buyer, product, secondaryColor);

    // Order summary table
    this.drawOrderSummary(doc, product, buyer, primaryColor, accentColor);

    // Payment and pickup information
    this.drawPaymentPickupInfo(doc, buyer, secondaryColor);

    // Legal terms and conditions
    this.drawLegalTerms(doc, primaryColor, secondaryColor);

    // Footer
    this.drawFooter(doc, secondaryColor);

    doc.end();

    return filePath;
  }

  private static drawHeader(doc: PDFKit.PDFDocument, primaryColor: string, invoiceNumber: string) {
    // Company header with background
    doc.rect(0, 0, doc.page.width, 120).fill('#f8fafc');
    
    // Logo area (text-based for now)
    doc.fillColor(primaryColor)
       .fontSize(28)
       .font('Helvetica-Bold')
       .text('ClassStore', 50, 30);
    
    doc.fillColor('#64748b')
       .fontSize(12)
       .font('Helvetica')
       .text('Student Marketplace Platform', 50, 65);

    // Invoice title and number
    doc.fillColor(primaryColor)
       .fontSize(24)
       .font('Helvetica-Bold')
       .text('INVOICE', doc.page.width - 200, 30, { align: 'right', width: 150 });
    
    doc.fillColor('#374151')
       .fontSize(14)
       .font('Helvetica')
       .text(invoiceNumber, doc.page.width - 200, 65, { align: 'right', width: 150 });

    // Reset position after header
    doc.y = 140;
  }

  private static drawCompanyInfo(doc: PDFKit.PDFDocument, secondaryColor: string) {
    doc.fillColor(secondaryColor)
       .fontSize(10)
       .font('Helvetica')
       .text('ClassStore - Student Marketplace', 50, doc.y)
       .text('Supporting student-to-student transactions', 50, doc.y + 12)
       .text('Email: support@classstore.com', 50, doc.y + 24);

    doc.y += 50;
  }

  private static drawInvoiceDetails(doc: PDFKit.PDFDocument, data: InvoiceData, primaryColor: string) {
    const startY = doc.y;
    
    // Invoice information box
    doc.rect(50, startY, 250, 80).stroke('#e5e7eb');
    
    doc.fillColor(primaryColor)
       .fontSize(12)
       .font('Helvetica-Bold')
       .text('Invoice Details', 60, startY + 10);

    doc.fillColor('#374151')
       .fontSize(10)
       .font('Helvetica')
       .text(`Invoice Number: ${data.invoiceNumber}`, 60, startY + 30)
       .text(`Order ID: ${data.orderId}`, 60, startY + 45)
       .text(`Invoice Date: ${new Date().toLocaleDateString('en-US', { 
         year: 'numeric', 
         month: 'long', 
         day: 'numeric' 
       })}`, 60, startY + 60);

    // Order status box
    doc.rect(320, startY, 250, 80).stroke('#e5e7eb');
    
    doc.fillColor(primaryColor)
       .fontSize(12)
       .font('Helvetica-Bold')
       .text('Transaction Status', 330, startY + 10);

    const statusColor = data.buyer.status === 'confirmed' ? '#059669' : '#d97706';
    doc.fillColor('#374151')
       .fontSize(10)
       .font('Helvetica')
       .text('Status:', 330, startY + 30)
       .fillColor(statusColor)
       .font('Helvetica-Bold')
       .text(data.buyer.status?.toUpperCase() || 'PENDING', 370, startY + 30)
       .fillColor('#374151')
       .font('Helvetica')
       .text(`Payment Method: Cash on Pickup`, 330, startY + 45)
       .text(`Transaction Type: Student Marketplace`, 330, startY + 60);

    doc.y = startY + 100;
  }

  private static drawBillingSection(doc: PDFKit.PDFDocument, buyer: any, product: any, secondaryColor: string) {
    const startY = doc.y;

    // Buyer information
    doc.rect(50, startY, 250, 120).stroke('#e5e7eb');
    
    doc.fillColor('#1f2937')
       .fontSize(12)
       .font('Helvetica-Bold')
       .text('Bill To (Buyer)', 60, startY + 10);

    doc.fillColor(secondaryColor)
       .fontSize(10)
       .font('Helvetica')
       .text(buyer.buyerName, 60, startY + 30)
       .text(`Grade ${buyer.buyerClass} - Section ${buyer.buyerSection}`, 60, startY + 45)
       .text(buyer.buyerEmail, 60, startY + 60)
       .text(buyer.buyerPhone, 60, startY + 75)
       .text(`Student ID: ${buyer.buyerId || 'N/A'}`, 60, startY + 90);

    // Seller information
    doc.rect(320, startY, 250, 120).stroke('#e5e7eb');
    
    doc.fillColor('#1f2937')
       .fontSize(12)
       .font('Helvetica-Bold')
       .text('Sold By (Seller)', 330, startY + 10);

    doc.fillColor(secondaryColor)
       .fontSize(10)
       .font('Helvetica')
       .text(product.sellerName, 330, startY + 30)
       .text(`Grade ${product.class} - Section ${product.section}`, 330, startY + 45)
       .text(product.sellerPhone, 330, startY + 60)
       .text(product.sellerEmail || 'Contact via phone', 330, startY + 75)
       .text(`Seller ID: ${product.sellerId || 'N/A'}`, 330, startY + 90);

    doc.y = startY + 140;
  }

  private static drawOrderSummary(doc: PDFKit.PDFDocument, product: any, buyer: any, primaryColor: string, accentColor: string) {
    const startY = doc.y;
    const tableTop = startY + 20;
    
    doc.fillColor('#1f2937')
       .fontSize(14)
       .font('Helvetica-Bold')
       .text('Order Summary', 50, startY);

    // Table header
    doc.rect(50, tableTop, 520, 25).fill(primaryColor);
    doc.fillColor('white')
       .fontSize(10)
       .font('Helvetica-Bold')
       .text('Description', 60, tableTop + 8)
       .text('Category', 250, tableTop + 8)
       .text('Condition', 350, tableTop + 8)
       .text('Class/Section', 430, tableTop + 8)
       .text('Amount', 510, tableTop + 8);

    // Table row
    const rowY = tableTop + 25;
    doc.rect(50, rowY, 520, 40).fill(accentColor).stroke('#e5e7eb');
    
    doc.fillColor('#374151')
       .fontSize(9)
       .font('Helvetica')
       .text(product.name, 60, rowY + 8, { width: 180, height: 30 })
       .text(product.category || 'General', 250, rowY + 8)
       .text(product.condition || 'Good', 350, rowY + 8)
       .text(`${product.class}/${product.section}`, 430, rowY + 8)
       .font('Helvetica-Bold')
       .text(`$${parseFloat(buyer.amount).toFixed(2)}`, 510, rowY + 8);

    // Product description
    if (product.description) {
      doc.fillColor('#6b7280')
         .fontSize(8)
         .font('Helvetica')
         .text(product.description.substring(0, 100) + (product.description.length > 100 ? '...' : ''), 60, rowY + 20, { width: 180 });
    }

    // Total section
    const totalY = rowY + 50;
    doc.rect(400, totalY, 170, 25).fill('#f3f4f6').stroke('#e5e7eb');
    
    doc.fillColor('#1f2937')
       .fontSize(12)
       .font('Helvetica-Bold')
       .text('Total Amount:', 410, totalY + 8)
       .text(`$${parseFloat(buyer.amount).toFixed(2)}`, 510, totalY + 8);

    doc.y = totalY + 40;
  }

  private static drawPaymentPickupInfo(doc: PDFKit.PDFDocument, buyer: any, secondaryColor: string) {
    const startY = doc.y;

    // Payment information
    doc.rect(50, startY, 250, 80).fill('#fefce8').stroke('#facc15');
    
    doc.fillColor('#92400e')
       .fontSize(12)
       .font('Helvetica-Bold')
       .text('Payment Information', 60, startY + 10);

    doc.fillColor('#a16207')
       .fontSize(10)
       .font('Helvetica')
       .text('Payment Method: Cash on Delivery', 60, startY + 30)
       .text('Payment Due: At pickup time', 60, startY + 45)
       .text('Currency: USD ($)', 60, startY + 60);

    // Pickup information
    doc.rect(320, startY, 250, 80).fill('#f0f9ff').stroke('#0ea5e9');
    
    doc.fillColor('#0c4a6e')
       .fontSize(12)
       .font('Helvetica-Bold')
       .text('Pickup Information', 330, startY + 10);

    doc.fillColor('#0369a1')
       .fontSize(10)
       .font('Helvetica')
       .text(`Location: ${buyer.pickupLocation}`, 330, startY + 30)
       .text(`Time: ${buyer.pickupTime}`, 330, startY + 45);

    if (buyer.additionalNotes) {
      doc.text('Notes:', 330, startY + 60)
         .fontSize(8)
         .text(buyer.additionalNotes.substring(0, 30) + '...', 330, startY + 72);
    }

    doc.y = startY + 100;
  }

  private static drawLegalTerms(doc: PDFKit.PDFDocument, primaryColor: string, secondaryColor: string) {
    const startY = doc.y;

    doc.fillColor(primaryColor)
       .fontSize(12)
       .font('Helvetica-Bold')
       .text('Terms and Conditions', 50, startY);

    const terms = [
      '1. PAYMENT: Payment must be made in cash at the time of pickup. No credit cards, checks, or digital payments accepted.',
      '2. NO RETURNS: All sales are final. Items are sold "as-is" with no warranty or guarantee of condition beyond what is stated.',
      '3. PICKUP POLICY: Items must be picked up at the designated school location during agreed times. Late pickups may result in order cancellation.',
      '4. INSPECTION: Buyers should inspect items thoroughly at pickup before completing payment.',
      '5. SCHOOL POLICY: This transaction complies with school marketplace policies. Both parties are responsible for following school guidelines.',
      '6. LIABILITY: ClassStore acts as a platform only. We are not responsible for the quality, condition, or legality of items sold.',
      '7. DISPUTE RESOLUTION: Any disputes should be reported to school administration and ClassStore support within 24 hours.',
      '8. DATA PRIVACY: Personal information is used solely for transaction purposes and is not shared with third parties.'
    ];

    let currentY = startY + 25;
    doc.fillColor(secondaryColor)
       .fontSize(8)
       .font('Helvetica');

    terms.forEach((term) => {
      const lines = doc.heightOfString(term, { width: 520 }) / 8;
      if (currentY + (lines * 10) > doc.page.height - 100) {
        doc.addPage();
        currentY = 50;
      }
      
      doc.text(term, 50, currentY, { width: 520, align: 'justify' });
      currentY += (lines * 10) + 5;
    });

    doc.y = currentY + 10;
  }

  private static drawFooter(doc: PDFKit.PDFDocument, secondaryColor: string) {
    const footerY = doc.page.height - 80;
    
    // Footer background
    doc.rect(0, footerY - 10, doc.page.width, 90).fill('#f8fafc');
    
    doc.fillColor(secondaryColor)
       .fontSize(9)
       .font('Helvetica')
       .text('This invoice was generated electronically and is valid for student marketplace transactions.', 50, footerY, { align: 'center', width: 520 })
       .text('For support or questions, contact: support@classstore.com | School Administration', 50, footerY + 15, { align: 'center', width: 520 })
       .text(`Generated on: ${new Date().toLocaleString('en-US')} | ClassStore Invoice System v1.0`, 50, footerY + 30, { align: 'center', width: 520 });

    // Page number
    doc.fontSize(8)
       .text(`Page 1`, 50, footerY + 50, { align: 'center', width: 520 });
  }
}
