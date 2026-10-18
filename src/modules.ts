// Deployed module URLs — each module runs as its own app and opens in a new tab.
export const RATE_CALCULATOR_URL = 'https://powerant-mobile.web.app/';
export const PRODUCTION_MONITOR_URL = 'https://production-monitor-chi.vercel.app/';
export const SALES_DASHBOARD_URL = 'https://sales-dashboard-sxh3.vercel.app/';
export const INVENTORY_URL = 'https://inventorysystem-rho.vercel.app/';

export type ModuleId = 'production' | 'sales' | 'inventory' | 'rate-calculator';

export interface PortalModule {
  id: ModuleId;
  name: string;
  description: string;
  url: string;
  /**
   * Which database module's permissions decide access to this tile.
   * null = owner only (no employee permissions defined for it).
   */
  permissionModule: PermissionModuleId | null;
}

/** Modules whose access the owner controls from the Team screen. */
export type PermissionModuleId = 'production' | 'sales' | 'inventory' | 'customers' | 'suppliers';

export const PERMISSION_MODULES: { id: PermissionModuleId; name: string }[] = [
  { id: 'production', name: 'Production Monitor' },
  { id: 'sales', name: 'Sales Dashboard' },
  { id: 'inventory', name: 'Inventory' },
  { id: 'customers', name: 'Customer Management' },
  { id: 'suppliers', name: 'Supplier Management' },
];

export const MODULES: PortalModule[] = [
  {
    id: 'production',
    permissionModule: 'production',
    name: 'Production Monitor',
    description: 'Operator entries and machine output',
    url: PRODUCTION_MONITOR_URL,
  },
  {
    id: 'sales',
    permissionModule: 'sales',
    name: 'Sales Dashboard',
    description: 'Orders, customers and payments',
    url: SALES_DASHBOARD_URL,
  },
  {
    id: 'inventory',
    permissionModule: 'inventory',
    name: 'Inventory',
    description: 'Stock levels across shops',
    url: INVENTORY_URL,
  },
  {
    id: 'rate-calculator',
    permissionModule: null,
    name: 'Rate Calculator',
    description: 'Daily cable rates and pricing',
    url: RATE_CALCULATOR_URL,
  },
];
