/*
  The client's businesses (portal.businesses). Every signed-in user can read
  them (documents print their details); only the owner can add or edit
  (enforced by the database). Logos live in the private 'branding' bucket.
*/
import { errorMessage, portal, supabase } from '../lib/supabase';

export interface Business {
  id: string;
  legal_name: string;
  trading_name: string;
  address: string;
  phone: string;
  ntn: string | null;
  strn: string | null;
  tax_registered: boolean;
  logo_path: string | null;
  invoice_footer: string;
  active: boolean;
}

export type BusinessInput = Omit<Business, 'id'>;

const COLUMNS = 'id, legal_name, trading_name, address, phone, ntn, strn, tax_registered, logo_path, invoice_footer, active';

export async function fetchBusinesses(): Promise<Business[]> {
  const { data, error } = await portal().from('businesses').select(COLUMNS).order('legal_name');
  if (error) throw new Error(errorMessage(error));
  return (data ?? []) as Business[];
}

function clean(input: BusinessInput): BusinessInput {
  const blank = (v: string | null) => (v && v.trim() ? v.trim() : null);
  return {
    ...input,
    legal_name: input.legal_name.trim(),
    trading_name: input.trading_name.trim(),
    address: input.address.trim(),
    phone: input.phone.trim(),
    ntn: blank(input.ntn),
    strn: blank(input.strn),
    invoice_footer: input.invoice_footer.trim(),
  };
}

function friendly(err: unknown): Error {
  const msg = errorMessage(err);
  if (/businesses_tax_numbers/.test(msg)) return new Error('A tax-registered business needs both NTN and STRN.');
  if (/businesses_legal_name_key|duplicate key/.test(msg)) return new Error('A business with this legal name already exists.');
  return new Error(msg);
}

export async function createBusiness(input: BusinessInput): Promise<Business> {
  const { data, error } = await portal().from('businesses').insert(clean(input)).select(COLUMNS).single();
  if (error) throw friendly(error);
  return data as Business;
}

export async function updateBusiness(id: string, input: BusinessInput): Promise<void> {
  const { error } = await portal().from('businesses').update(clean(input)).eq('id', id);
  if (error) throw friendly(error);
}

const LOGO_TYPES: Record<string, string> = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/svg+xml': 'svg' };
export const MAX_LOGO_BYTES = 2 * 1024 * 1024;

/** Uploads a logo and saves its path on the business. Returns the new path. */
export async function uploadLogo(businessId: string, file: File): Promise<string> {
  const ext = LOGO_TYPES[file.type];
  if (!ext) throw new Error('Use a PNG, JPG or SVG image.');
  if (file.size > MAX_LOGO_BYTES) throw new Error('The logo must be under 2 MB.');
  const path = `${businessId}/logo-${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from('branding').upload(path, file, {
    contentType: file.type,
    upsert: false,
  });
  if (error) throw new Error(errorMessage(error));
  const { error: saveError } = await portal().from('businesses').update({ logo_path: path }).eq('id', businessId);
  if (saveError) throw new Error(errorMessage(saveError));
  return path;
}

/** Short-lived link to show a private logo on screen. */
export async function logoUrl(path: string): Promise<string | null> {
  const { data, error } = await supabase.storage.from('branding').createSignedUrl(path, 60 * 60);
  if (error) return null;
  return data.signedUrl;
}
