import { createClient } from "@supabase/supabase-js";

/**
 * Supabase Storage (bucket público "fotos").
 *
 * Upload server-side usa a SERVICE_ROLE key — bypassa RLS, NUNCA exposta ao
 * browser. Leitura é pública (bucket public + policy "Public read fotos"),
 * logo guardamos a URL pública diretamente na `key` da foto e o display
 * resolve via getPhotoImageUrl (branch http).
 */

const SUPABASE_URL =
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SERVICE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || "";

export const STORAGE_BUCKET = "fotos";

let _admin: ReturnType<typeof createClient> | null = null;
function admin() {
  if (!_admin) {
    _admin = createClient(SUPABASE_URL, SERVICE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return _admin;
}

/** True quando há URL + service key — só então fazemos upload real. */
export function storageEnabled(): boolean {
  return !!SUPABASE_URL && !!SERVICE_KEY;
}

/**
 * Faz upload do buffer para o bucket "fotos".
 * Devolve { key, url, fileSize } onde `url` é a URL pública servível.
 */
export async function uploadToStorage(
  path: string,
  buffer: Buffer,
  contentType: string = "image/jpeg"
): Promise<{ key: string; url: string; fileSize: number }> {
  const { error } = await admin()
    .storage.from(STORAGE_BUCKET)
    .upload(path, buffer, { contentType, upsert: true });

  if (error) {
    throw new Error(`Supabase Storage upload falhou: ${error.message}`);
  }

  const { data } = admin().storage.from(STORAGE_BUCKET).getPublicUrl(path);

  return { key: data.publicUrl, url: data.publicUrl, fileSize: buffer.length };
}

/** URL pública para um path no bucket "fotos". */
export function getStoragePublicUrl(path: string): string {
  const { data } = admin().storage.from(STORAGE_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
