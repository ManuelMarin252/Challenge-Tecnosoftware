import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider } from "./context/AuthContext";
import { useAuth } from "./hooks/use-auth";
import { ThemeProvider } from "./context/ThemeContext";
import { Layout } from "./Layout";
import { Login } from "./pages/Login";
import { Dashboard } from "./pages/dashboard/Dashboard";
import { Products } from "./pages/admin/Products";
import { Inventory } from "./pages/Inventory";
import { Categories } from "./pages/Categories";
import { Users } from "./pages/Users";
import { Profile } from "./pages/Profile";
import { Shop } from "./pages/Shop";
import { type PropsWithChildren } from 'react';

function ProtectedRoute({ children }: PropsWithChildren) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children ? <>{children}</> : <Outlet />;
}

function AppRoutes() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={isAuthenticated ? <Navigate to="/" replace /> : <Login />} />
      
      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/shop" element={<Shop />} />
        <Route path="/admin/products" element={<Products />} />
        <Route path="/inventory" element={<Inventory />} />
        <Route path="/categories" element={<Categories />} />
        <Route path="/users" element={<Users />} />
        <Route path="/profile" element={<Profile />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
