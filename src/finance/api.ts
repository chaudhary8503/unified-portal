/*
  Finance overview data. Each money module provides one summary function
  (shared contract v4, "Finance summary formats"):
    customers.get_receivables_summary()
    suppliers.get_payables_summary(p_from, p_to)
    sales.get_cash_summary(p_from, p_to)
    inventory.get_stock_value_summary()
  A module that isn't live yet is reported as "not connected", so this
  screen fills in by itself as each module goes live.
*/
import { supabase } from '../lib/supabase';

export interface Aging {
  d0_30: number;
  d31_60: number;
  d61_90: number;
  d90_plus: number;
}

export interface TopBalance {
  id: string;
  name: string;
  balance: number;
  overdue: number;
}

export interface Receivables {
  total_receivable: number;
  customer_advances: number;
  overdue_total: number;
  overdue_count: number;
  aging: Aging;
  top_balances: TopBalance[];
}

export interface Payables {
  total_payable: number;
  supplier_advances: number;
  overdue_total: number;
  overdue_count: number;
  aging: Aging;
  due_7_days: number;
  due_30_days: number;
  payments_made: number;
  top_balances: TopBalance[];
}

export interface CashSummary {
  cash_sales: number;
  credit_sales: number;
  customer_payments: number;
}

export interface StockValue {
  total_value: number;
  by_category: { category: string; value: number }[];
  by_location: { location_id: string; name: string; value: number }[];
}

export type Loaded<T> =
  | { status: 'loading' }
  | { status: 'ok'; data: T }
  | { status: 'not_connected' }
  | { status: 'error'; message: string };

const NOT_CONNECTED = new Set(['PGRST106', 'PGRST202', 'PGRST205', '42883', '42P01', '3F000']);

async function call<T>(schema: string, fn: string, args?: Record<string, unknown>): Promise<Loaded<T>> {
  try {
    const { data, error } = await supabase.schema(schema).rpc(fn, args ?? {});
    if (error) {
      const code = (error as { code?: string }).code ?? '';
      if (NOT_CONNECTED.has(code) || /schema must be one of|could not find|does not exist/i.test(error.message)) {
        return { status: 'not_connected' };
      }
      return { status: 'error', message: error.message };
    }
    if (data == null) return { status: 'not_connected' };
    return { status: 'ok', data: data as T };
  } catch (err) {
    return { status: 'error', message: err instanceof Error ? err.message : 'Failed' };
  }
}

export const loadReceivables = () => call<Receivables>('customers', 'get_receivables_summary');
export const loadPayables = (from: string, to: string) =>
  call<Payables>('suppliers', 'get_payables_summary', { p_from: from, p_to: to });
export const loadCash = (from: string, to: string) =>
  call<CashSummary>('sales', 'get_cash_summary', { p_from: from, p_to: to });
export const loadStockValue = () => call<StockValue>('inventory', 'get_stock_value_summary');

/* ---------- periods (Asia/Karachi business dates) ---------- */

export type PeriodId = 'this_month' | 'last_month' | 'last_3_months' | 'this_year';

export const PERIODS: { id: PeriodId; label: string }[] = [
  { id: 'this_month', label: 'This month' },
  { id: 'last_month', label: 'Last month' },
  { id: 'last_3_months', label: 'Last 3 months' },
  { id: 'this_year', label: 'This year' },
];

const iso = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export function periodRange(id: PeriodId, today = new Date()): { from: string; to: string } {
  const y = today.getFullYear();
  const m = today.getMonth();
  switch (id) {
    case 'last_month':
      return { from: iso(new Date(y, m - 1, 1)), to: iso(new Date(y, m, 0)) };
    case 'last_3_months':
      return { from: iso(new Date(y, m - 2, 1)), to: iso(today) };
    case 'this_year':
      return { from: iso(new Date(y, 0, 1)), to: iso(today) };
    default:
      return { from: iso(new Date(y, m, 1)), to: iso(today) };
  }
}

const PKR = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });
export const money = (n: number | null | undefined) => `PKR ${PKR.format(Math.round(Number(n) || 0))}`;
