import { BrowserRouter as Router, Navigate, Route, Routes } from 'react-router-dom';
import AppShell from './components/layout/AppShell';
import AnalyticsPage from './pages/AnalyticsPage';
import CompanyDashboard from './pages/CompanyDashboard';
import Dashboard from './pages/Dashboard';
import ProductComparePage from './pages/ProductComparePage';
import ProductDetailsPage from './pages/ProductDetailsPage';
import ProductList from './pages/ProductList';

function App() {
  return (
    <Router>
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/products" element={<ProductList />} />
          <Route path="/compare" element={<ProductComparePage />} />
          <Route path="/products/:id" element={<ProductDetailsPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/company" element={<CompanyDashboard />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
