import { useEffect, useState, type ReactNode } from 'react';
import {
  loadCash,
  loadPayables,
  loadReceivables,
  loadStockValue,
  money,
  PERIODS,
  periodRange,
  type CashSummary,
  type Loaded,
  type Payables,
  type PeriodId,
  type Receivables,
  type StockValue,
  type TopBalance,
} from '../finance/api';
import '../styles/controls.css';
import './FinancePage.css';

const CATEGORY_NAMES: Record<string, string> = {
  copper: 'Copper',
  pvc: 'PVC',
  finished_cable: 'Finished cable',
  consumable: 'Consumables',
};

/** Owner-only: money owed both ways, cash in and out, stock value. */
function FinancePage() {
  const [period, setPeriod] = useState<PeriodId>('this_month');
  const [receivables, setReceivables] = useState<Loaded<Receivables>>({ status: 'loading' });
  const [stock, setStock] = useState<Loaded<StockValue>>({ status: 'loading' });
  // Period-dependent data is tagged with its period so changing the period
  // shows "loading" without resetting state inside the effect.
  const [periodData, setPeriodData] = useState<{
    period: PeriodId;
    payables: Loaded<Payables>;
    cash: Loaded<CashSummary>;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadReceivables().then((r) => !cancelled && setReceivables(r));
    loadStockValue().then((r) => !cancelled && setStock(r));
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const { from, to } = periodRange(period);
    Promise.all([loadPayables(from, to), loadCash(from, to)]).then(([payables, cash]) => {
      if (!cancelled) setPeriodData({ period, payables, cash });
    });
    return () => {
      cancelled = true;
    };
  }, [period]);

  const current = periodData?.period === period ? periodData : null;
  const payables: Loaded<Payables> = current?.payables ?? { status: 'loading' };
  const cash: Loaded<CashSummary> = current?.cash ?? { status: 'loading' };
  const periodLabel = PERIODS.find((p) => p.id === period)?.label.toLowerCase() ?? '';

  const rOk = receivables.status === 'ok' ? receivables.data : null;
  const pOk = payables.status === 'ok' ? payables.data : null;
  const cOk = cash.status === 'ok' ? cash.data : null;
  const sOk = stock.status === 'ok' ? stock.data : null;

  const cashIn = cOk ? Number(cOk.cash_sales) + Number(cOk.customer_payments) : null;
  const cashOut = pOk ? Number(pOk.payments_made) : null;

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">Finance overview</h1>
          <p className="page-sub">Money owed to you and by you, cash in and out, and stock value.</p>
        </div>
        <label className="field fin-period">
          <span>Period (for cash in and out)</span>
          <select className="select" value={period} onChange={(e) => setPeriod(e.target.value as PeriodId)}>
            {PERIODS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* ---------- headline tiles ---------- */}
      <div className="fin-tiles">
        <Tile
          label="Customers owe you"
          state={receivables.status}
          value={rOk && money(rOk.total_receivable)}
          sub={rOk && (Number(rOk.overdue_total) > 0 ? `${money(rOk.overdue_total)} overdue` : 'Nothing overdue')}
          warn={!!rOk && Number(rOk.overdue_total) > 0}
          waitingFor="Customer Management"
        />
        <Tile
          label="You owe suppliers"
          state={payables.status}
          value={pOk && money(pOk.total_payable)}
          sub={pOk && (Number(pOk.overdue_total) > 0 ? `${money(pOk.overdue_total)} overdue` : 'Nothing overdue')}
          warn={!!pOk && Number(pOk.overdue_total) > 0}
          waitingFor="Supplier Management"
        />
        <Tile
          label="Net position"
          state={rOk && pOk ? 'ok' : receivables.status === 'loading' || payables.status === 'loading' ? 'loading' : 'not_connected'}
          value={rOk && pOk && money(Number(rOk.total_receivable) - Number(pOk.total_payable))}
          sub="Owed to you minus what you owe"
          waitingFor="Customers and Suppliers"
        />
        <Tile
          label="Stock value"
          state={stock.status}
          value={sOk && money(sOk.total_value)}
          sub="At average purchase cost"
          waitingFor="Inventory"
        />
      </div>

      {/* ---------- cash in and out ---------- */}
      <section className="card fin-section">
        <h2 className="section-title">Cash in and out, {periodLabel}</h2>
        <table className="fin-table">
          <tbody>
            <Row label="Cash sales" value={cOk && money(cOk.cash_sales)} state={cash.status} />
            <Row label="Payments received from customers" value={cOk && money(cOk.customer_payments)} state={cash.status} />
            <Row label="Total cash in" value={cashIn != null ? money(cashIn) : null} state={cash.status} strong />
            <Row label="Payments made to suppliers" value={pOk && money(pOk.payments_made)} state={payables.status} />
            <Row
              label="Net cash (in minus out)"
              value={cashIn != null && cashOut != null ? money(cashIn - cashOut) : null}
              state={cOk && pOk ? 'ok' : cash.status === 'loading' || payables.status === 'loading' ? 'loading' : 'not_connected'}
              strong
            />
            <Row label="Credit sales (not yet cash)" value={cOk && money(cOk.credit_sales)} state={cash.status} muted />
          </tbody>
        </table>
        {cash.status !== 'ok' && cash.status !== 'loading' && (
          <p className="fin-note">{waiting(cash.status, 'Sales')} Until then, cash in and net cash stay blank.</p>
        )}
      </section>

      <div className="fin-two">
        {/* ---------- aging ---------- */}
        <section className="card fin-section">
          <h2 className="section-title">How long amounts have been outstanding</h2>
          <table className="fin-table fin-cols">
            <thead>
              <tr>
                <th>Age</th>
                <th>Customers owe you</th>
                <th>You owe suppliers</th>
              </tr>
            </thead>
            <tbody>
              {(
                [
                  ['0–30 days', 'd0_30'],
                  ['31–60 days', 'd31_60'],
                  ['61–90 days', 'd61_90'],
                  ['Over 90 days', 'd90_plus'],
                ] as const
              ).map(([label, key]) => (
                <tr key={key}>
                  <td>{label}</td>
                  <td className="num">{cell(receivables.status, rOk && money(rOk.aging?.[key]))}</td>
                  <td className="num">{cell(payables.status, pOk && money(pOk.aging?.[key]))}</td>
                </tr>
              ))}
              <tr className="fin-strong">
                <td>Advances held</td>
                <td className="num">{cell(receivables.status, rOk && money(rOk.customer_advances))}</td>
                <td className="num">{cell(payables.status, pOk && money(pOk.supplier_advances))}</td>
              </tr>
            </tbody>
          </table>
          <p className="fin-note">Advances are payments received or made before an invoice.</p>
        </section>

        {/* ---------- coming up ---------- */}
        <section className="card fin-section">
          <h2 className="section-title">Supplier payments coming up</h2>
          <table className="fin-table">
            <tbody>
              <Row label="Due in the next 7 days" value={pOk && money(pOk.due_7_days)} state={payables.status} />
              <Row label="Due in the next 30 days" value={pOk && money(pOk.due_30_days)} state={payables.status} />
              <Row
                label="Overdue now"
                value={pOk && `${money(pOk.overdue_total)} (${pOk.overdue_count} invoice${pOk.overdue_count === 1 ? '' : 's'})`}
                state={payables.status}
              />
            </tbody>
          </table>
          <h2 className="section-title fin-sub">Customer payments overdue</h2>
          <table className="fin-table">
            <tbody>
              <Row
                label="Overdue now"
                value={rOk && `${money(rOk.overdue_total)} (${rOk.overdue_count} invoice${rOk.overdue_count === 1 ? '' : 's'})`}
                state={receivables.status}
              />
            </tbody>
          </table>
        </section>
      </div>

      <div className="fin-two">
        <TopList title="Largest customer balances" state={receivables.status} rows={rOk?.top_balances} waitingFor="Customer Management" />
        <TopList title="Largest supplier balances" state={payables.status} rows={pOk?.top_balances} waitingFor="Supplier Management" />
      </div>

      {/* ---------- stock value detail ---------- */}
      <section className="card fin-section">
        <h2 className="section-title">Stock value</h2>
        {stock.status !== 'ok' ? (
          <p className="fin-empty">{waiting(stock.status, 'Inventory')}</p>
        ) : (
          <div className="fin-two fin-inner">
            <table className="fin-table fin-cols">
              <thead>
                <tr>
                  <th>By category</th>
                  <th>Value</th>
                </tr>
              </thead>
              <tbody>
                {stock.data.by_category.map((c) => (
                  <tr key={c.category}>
                    <td>{CATEGORY_NAMES[c.category] ?? c.category}</td>
                    <td className="num">{money(c.value)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <table className="fin-table fin-cols">
              <thead>
                <tr>
                  <th>By location</th>
                  <th>Value</th>
                </tr>
              </thead>
              <tbody>
                {stock.data.by_location.map((l) => (
                  <tr key={l.location_id}>
                    <td>{l.name}</td>
                    <td className="num">{money(l.value)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}

/* ---------- pieces ---------- */

type Status = Loaded<unknown>['status'];

function waiting(status: Status, moduleName: string): string {
  if (status === 'loading') return 'Loading…';
  if (status === 'error') return 'Couldn’t load. Try again later.';
  return `Shows here once ${moduleName} is live.`;
}

function cell(status: Status, value: ReactNode): ReactNode {
  if (status === 'ok') return value;
  return <span className="muted">{status === 'loading' ? '…' : '–'}</span>;
}

function Tile({
  label,
  value,
  sub,
  state,
  warn,
  waitingFor,
}: {
  label: string;
  value: ReactNode;
  sub: ReactNode;
  state: Status;
  warn?: boolean;
  waitingFor: string;
}) {
  return (
    <div className="card fin-tile">
      <span className="fin-tile-label">{label}</span>
      {state === 'ok' ? (
        <>
          <span className="fin-tile-value mono">{value}</span>
          <span className={`fin-tile-sub ${warn ? 'warn' : ''}`}>{sub}</span>
        </>
      ) : (
        <span className="fin-tile-wait">{waiting(state, waitingFor)}</span>
      )}
    </div>
  );
}

function Row({
  label,
  value,
  state,
  strong,
  muted,
}: {
  label: string;
  value: ReactNode;
  state: Status;
  strong?: boolean;
  muted?: boolean;
}) {
  return (
    <tr className={`${strong ? 'fin-strong' : ''} ${muted ? 'fin-muted' : ''}`}>
      <td>{label}</td>
      <td className="num">{cell(state, value)}</td>
    </tr>
  );
}

function TopList({
  title,
  state,
  rows,
  waitingFor,
}: {
  title: string;
  state: Status;
  rows?: TopBalance[];
  waitingFor: string;
}) {
  return (
    <section className="card fin-section">
      <h2 className="section-title">{title}</h2>
      {state !== 'ok' ? (
        <p className="fin-empty">{waiting(state, waitingFor)}</p>
      ) : !rows?.length ? (
        <p className="fin-empty">No balances.</p>
      ) : (
        <table className="fin-table fin-cols">
          <thead>
            <tr>
              <th>Name</th>
              <th>Balance</th>
              <th>Overdue</th>
            </tr>
          </thead>
          <tbody>
            {rows.slice(0, 8).map((r) => (
              <tr key={r.id}>
                <td>{r.name}</td>
                <td className="num">{money(r.balance)}</td>
                <td className={`num ${Number(r.overdue) > 0 ? 'fin-warn' : 'muted'}`}>
                  {Number(r.overdue) > 0 ? money(r.overdue) : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

export default FinancePage;
