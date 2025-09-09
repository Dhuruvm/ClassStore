# ClassStore - Student Marketplace

## Overview

ClassStore is a complete e-commerce platform designed for students to buy and sell textbooks, supplies, and school items within their classes. The platform features a React-based frontend with TypeScript, an Express.js backend, and PostgreSQL database using Drizzle ORM. The system includes comprehensive admin functionality with TOTP 2FA authentication, email notifications, PDF invoice generation, and analytics tracking.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **React 18 with TypeScript**: Core frontend framework providing type safety and modern component patterns
- **Tailwind CSS**: Utility-first CSS framework for responsive styling and consistent design system
- **Wouter**: Lightweight client-side routing library for navigation
- **TanStack Query**: Data fetching and state management with caching, optimistic updates, and background synchronization
- **Shadcn/UI Components**: Pre-built accessible UI component library built on Radix primitives
- **React Hook Form**: Form handling with validation and optimized re-renders

### Backend Architecture
- **Express.js with TypeScript**: RESTful API server with type safety
- **Session-based Authentication**: Express sessions for admin authentication with TOTP 2FA using Speakeasy
- **File Upload Handling**: Multer middleware for image uploads with validation and storage
- **Email Service**: Nodemailer integration for order confirmations and seller notifications
- **PDF Generation**: PDFKit for automated invoice creation

### Data Storage Solutions
- **PostgreSQL Database**: Primary data store configured via Drizzle ORM
- **Schema Design**: Separate tables for users, products, orders, and admins with proper relationships
- **File Storage**: Local filesystem storage for uploaded product images and generated invoices
- **Session Storage**: Express session store with configurable backend

### Authentication and Authorization
- **Admin Authentication**: Two-factor authentication flow with username/password + TOTP
- **Session Management**: HTTP-only cookies with configurable security settings
- **TOTP Implementation**: Speakeasy library for time-based one-time passwords with QR code setup
- **Permission Levels**: Admin-only routes protected by authentication middleware

### Application Features
- **Product Management**: Browse, filter, and search products by class and popularity
- **Order Processing**: Complete purchase flow with form validation and reCAPTCHA integration
- **Seller Portal**: Product listing interface with image upload and commission calculation
- **Wishlist System**: LocalStorage-based product favoriting with ranking
- **Admin Dashboard**: Order management, analytics, and system administration
- **Email Notifications**: Automated communications for buyers and sellers

## External Dependencies

### Core Framework Dependencies
- **@neondatabase/serverless**: PostgreSQL client for Neon database connections
- **drizzle-orm**: Type-safe ORM for database operations and migrations
- **express**: Web application framework for API development
- **react**: Frontend UI library with hooks and modern patterns

### Authentication & Security
- **speakeasy**: TOTP generation and verification for 2FA
- **bcrypt**: Password hashing for secure admin authentication
- **express-session**: Session management middleware
- **qrcode**: QR code generation for TOTP setup

### File & Email Services
- **multer**: File upload middleware for product images
- **nodemailer**: Email delivery service for notifications
- **pdfkit**: PDF document generation for invoices

### UI & Styling
- **@radix-ui/***: Accessible component primitives for UI elements
- **tailwindcss**: Utility-first CSS framework
- **class-variance-authority**: Type-safe component variants

### Data Fetching & Forms
- **@tanstack/react-query**: Server state management and caching
- **react-hook-form**: Form validation and handling
- **@hookform/resolvers**: Form validation resolvers
- **zod**: Schema validation library

### Development Tools
- **typescript**: Static type checking
- **vite**: Build tool and development server
- **drizzle-kit**: Database migration and schema management