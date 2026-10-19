/*
  Module addresses — each module runs as its own app and opens in a new tab.
  null = not deployed yet (the tile shows "Coming soon").
  When the domain is connected, change these to the planned addresses:
    portal.powerantcables.com, inventory., sales., customers., suppliers.,
    production., rates.
*/
export const RATE_CALCULATOR_URL = 'https://powerant-mobile.web.app/';
export const PRODUCTION_MONITOR_URL = 'https://production-monitor-chi.vercel.app/';
export const SALES_DASHBOARD_URL = 'https://sales-dashboard-sxh3.vercel.app/';
export const INVENTORY_URL = 'https://inventorysystem-rho.vercel.app/';
export const CUSTOMERS_URL: string | null = null;
export const SUPPLIERS_URL: string | null = null;

export type ModuleId = 'production' | 'sales' | 'inventory' | 'customers' | 'suppliers' | 'rate-calculator';

/** Modules whose access the owner controls from the Team screen. */
export type PermissionModuleId = 'production' | 'sales' | 'inventory' | 'customers' | 'suppliers';

export interface PortalModule {
  id: ModuleId;
  name: string;
  description: string;
  /** null = not deployed yet */
  url: string | null;
  /**
   * Which database module's permissions decide access to this tile.
   * null = owner only (no employee permissions defined for it).
   */
  permissionModule: PermissionModuleId | null;
  /** Has an alerts_summary view in the database (shown on the Overview). */
  hasAlerts: boolean;
}

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
    hasAlerts: true,
    name: 'Production Monitor',
    description: 'Orders, stage records and machine output',
    url: PRODUCTION_MONITOR_URL,
  },
  {
    id: 'sales',
    permissionModule: 'sales',
    hasAlerts: true,
    name: 'Sales Dashboard',
    description: 'Receipts, payments and returns',
    url: SALES_DASHBOARD_URL,
  },
  {
    id: 'inventory',
    permissionModule: 'inventory',
    hasAlerts: true,
    name: 'Inventory',
    description: 'Stock at the factory and every shop',
    url: INVENTORY_URL,
  },
  {
    id: 'customers',
    permissionModule: 'customers',
    hasAlerts: true,
    name: 'Customer Management',
    description: 'Customers, balances and statements',
    url: CUSTOMERS_URL,
  },
  {
    id: 'suppliers',
    permissionModule: 'suppliers',
    hasAlerts: true,
    name: 'Supplier Management',
    description: 'Purchases, deliveries and payables',
    url: SUPPLIERS_URL,
  },
  {
    id: 'rate-calculator',
    permissionModule: null,
    hasAlerts: false,
    name: 'Rate Calculator',
    description: 'Daily cable rates and pricing',
    url: RATE_CALCULATOR_URL,
  },
];

/** Full address for an alert's link (module address + hash route). */
export function moduleLink(module: PortalModule, linkPath?: string | null): string | null {
  if (!module.url) return null;
  if (!linkPath) return module.url;
  return module.url.replace(/\/?$/, '/') + linkPath.replace(/^\//, '');
}
