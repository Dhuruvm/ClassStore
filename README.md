# ClassStore - Student Marketplace

A complete e-commerce platform for students to buy and sell textbooks, supplies, and school items within their classes. Built with React, Express.js, SQLite, and includes admin panel with TOTP 2FA.

## Features

### For Students
- **Product Browsing**: Search and filter products by class, price, and popularity
- **Secure Purchasing**: Complete order flow with form validation and reCAPTCHA
- **Product Listings**: Sell items with image upload and commission calculation
- **Wishlist System**: Like products stored in localStorage with ranking system

### For Administrators
- **TOTP 2FA Authentication**: Secure admin access with QR code setup
- **Order Management**: View, confirm, and cancel orders
- **Email Notifications**: Automated emails to buyers and sellers
- **Invoice Generation**: PDF invoices with automatic generation
- **Analytics Dashboard**: Order stats, revenue tracking, and product metrics

## Tech Stack

### Frontend
- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **Wouter** for routing
- **TanStack Query** for data fetching
- **Shadcn/UI** components
- **React Hook Form** for form handling

### Backend  
- **Express.js** with TypeScript
- **SQLite** database with migrations
- **Express Session** for authentication
- **Multer** for file uploads
- **Nodemailer** for email notifications
- **PDFKit** for invoice generation
- **Speakeasy** for TOTP 2FA
- **QRCode** for QR code generation

## Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

1. **Clone and install dependencies**
   ```bash
   git clone <repository-url>
   cd classstore
   npm install
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Configure the following in `.env`:
   ```env
   # Essential Configuration
   SESSION_SECRET=your-super-secret-key-change-immediately
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-gmail-app-password
   RECAPTCHA_SECRET=your-recaptcha-secret-key
   # ADMIN_URL_PART removed - now hardcoded for security
   ```

3. **Set up database**
   ```bash
   # SQLite database will be created automatically
   # Sample data is included for immediate testing
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

   The application will be available at `http://localhost:5000`

### First Time Setup

1. **Admin Access**: Navigate to `/admin/z3XJbf0x0vXsCxnUZnscBRsnE`
   - Username: `admin`  
   - Password: `ChangeMe123!`
   - **⚠️ CHANGE IMMEDIATELY** after first login

2. **TOTP Setup**: Follow the QR code setup for 2FA using an authenticator app

3. **Test Order Flow**:
   - Browse products on homepage
   - Click "Buy Now" on any product
   - Complete purchase form
   - Check email for confirmation

## Environment Configuration

### Required Environment Variables

#### Email Configuration
Get Gmail App Password:
1. Enable 2FA on your Google account
2. Go to Google Account settings → Security → 2-Step Verification
3. Generate App Password for "Mail"
4. Use this password in `SMTP_PASS`

#### reCAPTCHA Setup
1. Visit [Google reCAPTCHA Console](https://www.google.com/recaptcha/admin)
2. Create new site with reCAPTCHA v2 checkbox
3. Add your domain (localhost for development)
4. Get Site Key and Secret Key
5. Add Secret Key to `RECAPTCHA_SECRET`
6. Add Site Key to client environment

#### Security Configuration
```env
# Admin URL uses hardcoded secure hash: z3XJbf0x0vXsCxnUZnscBRsnE

# Generate secure session secret
SESSION_SECRET=$(openssl rand -base64 64)
