// Type extensions for Express Request object
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

export {};
