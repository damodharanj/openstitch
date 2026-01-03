import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { CanvasLayout } from './components/layout/CanvasLayout';
import { ProjectList } from './components/dashboard/ProjectList';
import { ProjectProvider } from './context/ProjectContext';
import { ClerkProvider, SignedIn, SignedOut, SignIn, SignUp } from '@clerk/clerk-react';

// You will need to add this to your .env.local
const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!PUBLISHABLE_KEY) {
  throw new Error("Missing Publishable Key")
}

function ClerkProviderWithRoutes() {
  const navigate = useNavigate();

  return (
    <ClerkProvider
      publishableKey={PUBLISHABLE_KEY}
      routerPush={(to) => navigate(to)}
      routerReplace={(to) => navigate(to, { replace: true })}
    >
      <ProjectProvider>
        <Routes>
          <Route path="/sign-in/*" element={<div className="flex items-center justify-center h-screen bg-gray-900"><SignIn routing="path" path="/sign-in" /></div>} />
          <Route path="/sign-up/*" element={<div className="flex items-center justify-center h-screen bg-gray-900"><SignUp routing="path" path="/sign-up" /></div>} />

          <Route path="/" element={
            <>
              <SignedIn><ProjectList /></SignedIn>
              <SignedOut><Navigate to="/sign-in" /></SignedOut>
            </>
          } />
          <Route path="/project/:projectId" element={
            <>
              <SignedIn><CanvasLayout /></SignedIn>
              <SignedOut><Navigate to="/sign-in" /></SignedOut>
            </>
          } />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ProjectProvider>
    </ClerkProvider>
  );
}

function App() {
  return (
    <BrowserRouter>
      <ClerkProviderWithRoutes />
    </BrowserRouter>
  );
}

export default App;
