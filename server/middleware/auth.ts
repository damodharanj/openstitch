import { ClerkExpressRequireAuth, ClerkExpressWithAuth } from '@clerk/clerk-sdk-node';

// Middleware to enforce authentication
// Usage: app.get('/protected', requireAuth(), (req, res) => { ... })
export const requireAuth = () => ClerkExpressRequireAuth();

// Middleware to populate auth context but allow unauthenticated requests
// Usage: app.get('/public', withAuth(), (req, res) => { ... })
export const withAuth = () => ClerkExpressWithAuth();
