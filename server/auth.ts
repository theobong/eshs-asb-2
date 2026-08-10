import bcrypt from 'bcryptjs';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import type { Express, Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';

dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';

if (isProduction && !process.env.SESSION_SECRET) {
  throw new Error('SESSION_SECRET must be set in production');
}

const SESSION_SECRET = process.env.SESSION_SECRET || 'eshs-asb-local-development-session-secret';

const mongoStore = MongoStore.create({
  mongoUrl: process.env.MONGODB_URI || 'mongodb://localhost:27017/eshs-asb',
  collectionName: 'sessions',
  ttl: 30 * 24 * 60 * 60,
  touchAfter: 24 * 3600,
  autoRemove: 'native',
  stringify: false
});

mongoStore.on('error', (error) => {
  console.error('MongoDB session store error:', error);
});

mongoStore.on('connected', () => {
  console.log('MongoDB session store connected');
});

export const sessionConfig = session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: mongoStore,
  cookie: {
    maxAge: 30 * 24 * 60 * 60 * 1000,
    httpOnly: true,
    secure: 'auto',
    sameSite: 'lax'
  },
  name: 'eshs.admin.session'
});

declare module 'express-session' {
  interface SessionData {
    isAuthenticated: boolean;
    adminAuthenticated: boolean;
  }
}

const ADMIN_PASSWORD_HASH = bcrypt.hashSync(
  process.env.ADMIN_PASSWORD || 'admin',
  10
);

const ADMIN_PASSWORD_2_HASH = process.env.ADMIN_PASSWORD_2
  ? bcrypt.hashSync(process.env.ADMIN_PASSWORD_2, 10)
  : null;

export const requireAdminAuth = (req: Request, res: Response, next: NextFunction) => {
  if (req.session.adminAuthenticated) {
    return next();
  }
  res.status(401).json({ error: 'Authentication required' });
};

export const handleAdminLogin = async (req: Request, res: Response) => {
  const { password } = req.body;

  if (!password) {
    return res.status(400).json({ error: 'Password is required' });
  }

  const isValidPassword1 = await bcrypt.compare(password, ADMIN_PASSWORD_HASH);
  const isValidPassword2 = ADMIN_PASSWORD_2_HASH
    ? await bcrypt.compare(password, ADMIN_PASSWORD_2_HASH)
    : false;
  const isValid = isValidPassword1 || isValidPassword2;

  if (isValid) {
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

export const checkAdminAuth = (req: Request, res: Response) => {
  const authenticated = !!req.session.adminAuthenticated;

  res.json({
    authenticated,
    sessionId: req.sessionID,
    expiresAt: req.session.cookie?.expires || null
  });
};
