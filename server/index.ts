import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { connectWithRetry } from "./mongo-utils";
import { connectDB } from "@shared/mongodb-schema";
import { sessionConfig } from "./auth";

const app = express();

app.set('trust proxy', 1);

app.use((req, res, next) => {
  const contentLength = parseInt(req.headers['content-length'] || '0');
  const maxSize = 50 * 1024 * 1024;

  if (contentLength > maxSize) {
    console.error(`Request too large: ${contentLength} bytes (max: ${maxSize})`);
    return res.status(413).json({
      message: "Request too large",
      maxSize: "50MB",
      receivedSize: `${Math.round(contentLength / 1024 / 1024)}MB`
    });
  }

  next();
});

app.use('/api/upload', (req, res, next) => {
  console.log(`Upload request: ${req.headers['content-length']} bytes`);
  next();
});

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: false, limit: '50mb' }));
app.use(sessionConfig);

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  await connectWithRetry();
  await connectDB();

  const server = await registerRoutes(app);

  app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    console.error('Global error handler:', {
      url: req.url,
      method: req.method,
      error: err.message,
      status,
      stack: err.stack
    });

    if (req.path.startsWith('/api/')) {
      return res.status(status).json({
        message,
        error: err.code || 'UNKNOWN_ERROR'
      });
    }

    res.status(status).json({ message });
  });

  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const port = 5005;
  server.listen({
    port,
    host: "0.0.0.0",
  }, () => {
    log(`serving on port ${port}`);
  });
})();
