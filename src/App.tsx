import { useState, type ComponentType } from 'react';
import './App.css';
import Header from './components/Header';
import type { View } from './components/TabNav';
import InventoryPage from './pages/InventoryPage';
import OverviewPage from './pages/OverviewPage';
import ProductionMonitorPage from './pages/ProductionMonitorPage';
import RateCalculatorPage from './pages/RateCalculatorPage';
import SalesDashboardPage from './pages/SalesDashboardPage';

const PAGES: Record<View, ComponentType> = {
  overview: OverviewPage,
  'rate-calculator': RateCalculatorPage,
  production: ProductionMonitorPage,
  sales: SalesDashboardPage,
  inventory: InventoryPage,
};

function App() {
  const [view, setView] = useState<View>('overview');
  const Page = PAGES[view];

  return (
    <div className="app-shell">
      <Header active={view} onChange={setView} />

      <main className="app-body">
        <div className="page">
          <div className="page-inner">
            <Page />
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
