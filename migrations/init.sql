-- SQLite Schema for ClassStore
-- Run this file to initialize the database

CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY DEFAULT (hex(randomblob(16))),
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY DEFAULT (hex(randomblob(16))),
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    class INTEGER NOT NULL CHECK (class >= 6 AND class <= 12),
    section TEXT NOT NULL,
    image_url TEXT,
    seller_name TEXT NOT NULL,
    seller_phone TEXT NOT NULL,
    likes INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY DEFAULT (hex(randomblob(16))),
    product_id TEXT NOT NULL,
    buyer_name TEXT NOT NULL,
    buyer_class INTEGER NOT NULL CHECK (buyer_class >= 6 AND buyer_class <= 12),
    buyer_section TEXT NOT NULL,
    buyer_email TEXT NOT NULL,
    buyer_phone TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id)
);

CREATE TABLE IF NOT EXISTS admins (
    id TEXT PRIMARY KEY DEFAULT (hex(randomblob(16))),
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    totp_secret TEXT,
    is_setup BOOLEAN DEFAULT 0
);

-- Insert default admin (password: ChangeMe123!)
INSERT OR IGNORE INTO admins (username, password) VALUES 
('admin', '$2b$10$8K1p/a/KaCWcB1.I8CFUyOm8qAV5.b8Qjsj9vE0Qzm1E5E5n/lWNO');

-- Sample data
INSERT OR IGNORE INTO products (name, description, price, class, section, image_url, seller_name, seller_phone, likes) VALUES
('Advanced Mathematics Textbook', 'Grade 10 mathematics textbook in excellent condition', 45.00, 10, 'A', 'https://images.unsplash.com/photo-1509228468518-180dd4864904?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=250', 'Sarah Wilson', '+1234567890', 15),
('Complete Stationery Set', 'Brand new stationery set with pens, pencils, ruler, and notebooks', 25.00, 8, 'B', 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=250', 'Mike Johnson', '+1234567891', 8),
('Scientific Calculator TI-84', 'Barely used TI-84 calculator perfect for advanced mathematics', 120.00, 11, 'C', 'https://images.unsplash.com/photo-1611224923853-80b023f02d71?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=250', 'Emma Davis', '+1234567892', 23),
('Chemistry Lab Kit', 'Complete chemistry lab equipment set', 85.00, 12, 'A', 'https://images.unsplash.com/photo-1582719471384-894fbb16e074?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=250', 'Alex Chen', '+1234567893', 12);

CREATE INDEX IF NOT EXISTS idx_products_class ON products(class);
CREATE INDEX IF NOT EXISTS idx_products_likes ON products(likes DESC);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at DESC);
