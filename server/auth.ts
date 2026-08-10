import bcrypt from 'bcryptjs';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import type { Express, Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';

dotenv.config();

// Session configuration
const SESSION_SECRET = process.env.SESSION_SECRET || 'eshs-asb-2024-admin-session-secret-' + Date.now();

// Create MongoDB session store
const mongoStore = MongoStore.create({
  mongoUrl: process.env.MONGODB_URI || 'mongodb://localhost:27017/eshs-asb',
  collectionName: 'sessions',
  ttl: 30 * 24 * 60 * 60, // 30 days TTL (in seconds for MongoStore)
  touchAfter: 24 * 3600, // Lazy session update (only update every 24 hours)
  autoRemove: 'native', // Let MongoDB handle expired session removal
  stringify: false // Store session data as BSON instead of JSON string
});

// Add error handling for the store
mongoStore.on('error', (error) => {
  console.error('MongoDB session store error:', error);
});

mongoStore.on('connected', () => {
  console.log('✅ MongoDB session store connected');
});

export const sessionConfig = session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: mongoStore,
  cookie: {
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days (in milliseconds)
    httpOnly: true,
    secure: false, // Allow HTTP for development/local deployment
    sameSite: 'lax'
  },
  name: 'eshs.admin.session' // Custom session name
});

// Extend session type
declare module 'express-session' {
  interface SessionData {
    isAuthenticated: boolean;
    adminAuthenticated: boolean;
  }
}

// Hash the admin passwords on startup
const ADMIN_PASSWORD_HASH = bcrypt.hashSync(
  process.env.ADMIN_PASSWORD || 'admin',
  10
);

// Second admin password (optional)
const ADMIN_PASSWORD_2_HASH = process.env.ADMIN_PASSWORD_2
  ? bcrypt.hashSync(process.env.ADMIN_PASSWORD_2, 10)
  : null;

// Authentication middleware
export const requireAdminAuth = (req: Request, res: Response, next: NextFunction) => {
  if (req.session.adminAuthenticated) {
    return next();
  }
  res.status(401).json({ error: 'Authentication required' });
};

// Login endpoint handler
export const handleAdminLogin = async (req: Request, res: Response) => {
  const { password } = req.body;

  if (!password) {
    return res.status(400).json({ error: 'Password is required' });
  }

  // Check against both admin passwords
  const isValidPassword1 = await bcrypt.compare(password, ADMIN_PASSWORD_HASH);
  const isValidPassword2 = ADMIN_PASSWORD_2_HASH
    ? await bcrypt.compare(password, ADMIN_PASSWORD_2_HASH)
    : false;
  const isValid = isValidPassword1 || isValidPassword2;

  if (isValid) {
    // Regenerate session ID for security
    req.session.regenerate((err) => {
      if (err) {
        console.error('Session regeneration error:', err);
        return res.status(500).json({ error: 'Failed to create session' });
      }
      
      req.session.adminAuthenticated = true;
      req.session.save((err) => {
        if (err) {
          console.error('Session save error:', err);
          return res.status(500).json({ error: 'Failed to save session' });
        }
        console.log('Admin session created successfully');
        res.json({ success: true, message: 'Login successful' });
      });
    });
  } else {
    res.status(401).json({ error: 'Invalid password' });
  }
};

// Logout endpoint handler
export const handleAdminLogout = (req: Request, res: Response) => {
  if (req.session.adminAuthenticated) {
    req.session.destroy((err) => {
      if (err) {
        console.error('Session destruction error:', err);
        return res.status(500).json({ error: 'Failed to logout' });
      }
      res.clearCookie('eshs.admin.session');
      console.log('Admin session destroyed successfully');
      res.json({ success: true, message: 'Logout successful' });
    });
  } else {
    res.json({ success: true, message: 'Already logged out' });
  }
};

// Check auth status endpoint handler
export const checkAdminAuth = (req: Request, res: Response) => {
  const authenticated = !!req.session.adminAuthenticated;
  console.log(`Auth check: ${authenticated ? 'authenticated' : 'not authenticated'}`);
  
  res.json({ 
    authenticated,
    sessionId: req.sessionID,
    expiresAt: req.session.cookie?.expires || null
  });
};