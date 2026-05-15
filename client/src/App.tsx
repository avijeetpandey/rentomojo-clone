import { useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Toaster } from '@/components/ui/toaster';
import { applyThemeClass, useThemeStore } from '@/store/themeStore';
import HomePage from '@/pages/HomePage';
import LoginPage from '@/pages/LoginPage';
import RegisterPage from '@/pages/RegisterPage';
import CatalogPage from '@/pages/CatalogPage';
import ProductDetailPage from '@/pages/ProductDetailPage';
import CartPage from '@/pages/CartPage';
import CheckoutPage from '@/pages/CheckoutPage';
import DashboardPage from '@/pages/DashboardPage';

function ThemeBoot() {
  const theme = useThemeStore((s) => s.theme);
  useEffect(() => {
    applyThemeClass(theme);
  }, [theme]);
  return null;
}

export default function App() {
  return (
    <BrowserRouter>
      <Toaster>
        <ThemeBoot />
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route
              path="/catalog"
              element={
                <ProtectedRoute>
                  <CatalogPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/products/:slug"
              element={
                <ProtectedRoute>
                  <ProductDetailPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/cart"
              element={
                <ProtectedRoute>
                  <CartPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/checkout"
              element={
                <ProtectedRoute>
                  <CheckoutPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </Toaster>
    </BrowserRouter>
  );
}
