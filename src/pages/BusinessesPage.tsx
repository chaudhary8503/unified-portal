import { useCallback, useEffect, useState, type FormEvent } from 'react';
import {
  createBusiness,
  fetchBusinesses,
  logoUrl,
  updateBusiness,
  uploadLogo,
  type Business,
  type BusinessInput,
} from '../businesses/api';
import '../styles/controls.css';
import './BusinessesPage.css';

const EMPTY: BusinessInput = {
  legal_name: '',
  trading_name: '',
  address: '',
  phone: '',
  ntn: '',
  strn: '',
  tax_registered: false,
  logo_path: null,
  invoice_footer: '',
  active: true,
};

type Mode = { kind: 'list' } | { kind: 'new' } | { kind: 'edit'; id: string };

/**
 * Owner-only: the client's businesses. Each shop and the factory belongs to
 * one business (set in Inventory). Invoices and purchases use its name,
 * address, logo and tax status.
 */
function BusinessesPage() {
  const [items, setItems] = useState<Business[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>({ kind: 'list' });

  const reload = useCallback(
    () =>
      fetchBusinesses()
        .then((rows) => {
          setItems(rows);
          setError(null);
        })
        .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Could not load businesses.')),
    [],
  );

  useEffect(() => {
    reload();
  }, [reload]);

  if (error && !items) return <div className="notice notice-error">{error}</div>;
  if (!items) return <div className="empty-state">Loading businesses…</div>;

  if (mode.kind !== 'list') {
    const existing = mode.kind === 'edit' ? items.find((b) => b.id === mode.id) : undefined;
    return (
      <BusinessForm
        key={existing?.id ?? 'new'}
        existing={existing}
        onDone={async () => {
          await reload();
          setMode({ kind: 'list' });
        }}
        onCancel={() => setMode({ kind: 'list' })}
      />
    );
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">Businesses</h1>
          <p className="page-sub">
            Your business names and tax details. Each shop and the factory is linked to one business, and its
            invoices show that business’s details.
          </p>
        </div>
        <button type="button" className="btn btn-primary" onClick={() => setMode({ kind: 'new' })}>
          + Add business
        </button>
      </div>

      {items.length === 0 ? (
        <div className="card biz-empty">
          <h2 className="section-title">No businesses yet</h2>
          <p className="muted">
            Add at least one business before shops and the factory are set up in Inventory.
          </p>
        </div>
      ) : (
        <div className="biz-grid">
          {items.map((b) => (
            <button
              key={b.id}
              type="button"
              className={`card biz-card ${b.active ? '' : 'inactive'}`}
              onClick={() => setMode({ kind: 'edit', id: b.id })}
            >
              <span className="biz-card-head">
                <BusinessLogo path={b.logo_path} name={b.legal_name} />
                <span className="biz-card-names">
                  <span className="biz-name">{b.legal_name}</span>
                  {b.trading_name && <span className="biz-trading">{b.trading_name}</span>}
                </span>
              </span>
              <span className="biz-pills">
                {b.tax_registered ? (
                  <span className="pill pill-green">Tax registered</span>
                ) : (
                  <span className="pill pill-muted">Not registered</span>
                )}
                {!b.active && <span className="pill pill-muted">Inactive</span>}
              </span>
              {b.tax_registered && (
                <span className="biz-tax mono">
                  NTN {b.ntn} · STRN {b.strn}
                </span>
              )}
              {(b.address || b.phone) && (
                <span className="biz-contact">{[b.address, b.phone].filter(Boolean).join(' · ')}</span>
              )}
              <span className="biz-edit">Edit →</span>
            </button>
          ))}
        </div>
      )}
    </>
  );
}

function BusinessLogo({ path, name }: { path: string | null; name: string }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    if (path) {
      logoUrl(path).then((u) => {
        if (!cancelled) setUrl(u);
      });
    }
    return () => {
      cancelled = true;
    };
  }, [path]);
  if (path && url) return <img className="biz-logo" src={url} alt="" />;
  return (
    <span className="biz-logo biz-logo-empty" aria-hidden="true">
      {name[0]?.toUpperCase() ?? '?'}
    </span>
  );
}

/* ---------- add / edit form ---------- */

interface BusinessFormProps {
  existing?: Business;
  onDone: () => void | Promise<void>;
  onCancel: () => void;
}

function BusinessForm({ existing, onDone, onCancel }: BusinessFormProps) {
  const [form, setForm] = useState<BusinessInput>(() =>
    existing ? { ...existing, ntn: existing.ntn ?? '', strn: existing.strn ?? '' } : EMPTY,
  );
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [touched, setTouched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof BusinessInput>(key: K, value: BusinessInput[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const problems = {
    legal_name: form.legal_name.trim() ? null : 'Enter the legal name.',
    ntn: form.tax_registered && !form.ntn?.trim() ? 'Required for a registered business.' : null,
    strn: form.tax_registered && !form.strn?.trim() ? 'Required for a registered business.' : null,
  };
  const valid = !problems.legal_name && !problems.ntn && !problems.strn;

  async function submit(e: FormEvent) {
    e.preventDefault();
    setTouched(true);
    if (!valid || busy) return;
    setBusy(true);
    setError(null);
    try {
      let id = existing?.id;
      if (existing) {
        await updateBusiness(existing.id, form);
      } else {
        id = (await createBusiness(form)).id;
      }
      if (logoFile && id) await uploadLogo(id, logoFile);
      await onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save.');
      setBusy(false);
    }
  }

  return (
    <>
      <button type="button" className="btn btn-link detail-back" onClick={onCancel}>
        ← Back to businesses
      </button>
      <div className="page-head">
        <div>
          <h1 className="page-title">{existing ? existing.legal_name : 'Add business'}</h1>
          <p className="page-sub">These details appear on invoices, statements and purchase records.</p>
        </div>
      </div>

      <form className="card biz-form" onSubmit={submit} noValidate>
        <div className="biz-form-grid">
          <label className="field">
            <span>Legal name</span>
            <input className="input" value={form.legal_name} onChange={(e) => set('legal_name', e.target.value)} />
            {touched && problems.legal_name && <span className="field-error">{problems.legal_name}</span>}
          </label>
          <label className="field">
            <span>Trading name (optional)</span>
            <input className="input" value={form.trading_name} onChange={(e) => set('trading_name', e.target.value)} />
          </label>
          <label className="field biz-span">
            <span>Address</span>
            <input className="input" value={form.address} onChange={(e) => set('address', e.target.value)} />
          </label>
          <label className="field">
            <span>Phone</span>
            <input className="input" value={form.phone} onChange={(e) => set('phone', e.target.value)} />
          </label>
          <div className="field">
            <span>Sales tax</span>
            <label className="biz-check">
              <input
                type="checkbox"
                checked={form.tax_registered}
                onChange={(e) => set('tax_registered', e.target.checked)}
              />
              <span>This business is tax-registered</span>
            </label>
          </div>
          {form.tax_registered && (
            <>
              <label className="field">
                <span>NTN (National Tax Number)</span>
                <input className="input mono" value={form.ntn ?? ''} onChange={(e) => set('ntn', e.target.value)} />
                {touched && problems.ntn && <span className="field-error">{problems.ntn}</span>}
              </label>
              <label className="field">
                <span>STRN (Sales Tax Registration Number)</span>
                <input className="input mono" value={form.strn ?? ''} onChange={(e) => set('strn', e.target.value)} />
                {touched && problems.strn && <span className="field-error">{problems.strn}</span>}
              </label>
            </>
          )}
          <label className="field biz-span">
            <span>Invoice footer (optional)</span>
            <input
              className="input"
              value={form.invoice_footer}
              onChange={(e) => set('invoice_footer', e.target.value)}
              placeholder="e.g. Goods once sold are not returnable without a receipt."
            />
          </label>
          <div className="field biz-span">
            <span>Logo (PNG, JPG or SVG, under 2 MB)</span>
            <div className="biz-logo-row">
              {existing && <BusinessLogo path={existing.logo_path} name={existing.legal_name || '?'} />}
              <input
                type="file"
                accept="image/png,image/jpeg,image/svg+xml"
                onChange={(e) => setLogoFile(e.target.files?.[0] ?? null)}
              />
            </div>
          </div>
          {existing && (
            <div className="field">
              <span>Status</span>
              <label className="biz-check">
                <input type="checkbox" checked={form.active} onChange={(e) => set('active', e.target.checked)} />
                <span>Active</span>
              </label>
              <span className="field-hint">Inactive businesses stay on old documents but can’t be used for new ones.</span>
            </div>
          )}
        </div>

        {error && <div className="notice notice-error biz-error">{error}</div>}

        <div className="form-actions biz-actions">
          <button type="submit" className="btn btn-primary" disabled={busy}>
            {busy ? 'Saving…' : existing ? 'Save changes' : 'Add business'}
          </button>
          <button type="button" className="btn" disabled={busy} onClick={onCancel}>
            Cancel
          </button>
        </div>
      </form>
    </>
  );
}

export default BusinessesPage;
