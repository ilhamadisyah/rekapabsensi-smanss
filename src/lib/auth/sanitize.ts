/**
 * Utility sanitasi string untuk mencegah Cross-Site Scripting (XSS)
 * dan injeksi kode HTML berbahaya.
 */

/**
 * Escape karakter HTML dasar
 */
export function escapeHtml(str: string): string {
  if (!str || typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Sanitasi string input teks umum (menghapus tag HTML dan script)
 */
export function sanitizeInputText(str: string, maxLength: number = 500): string {
  if (!str || typeof str !== 'string') return '';
  // Hapus script tags dan isinya
  let clean = str.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  // Hapus semua HTML tags
  clean = clean.replace(/<[^>]+>/g, '');
  // Hapus karakter control null byte
  clean = clean.replace(/\0/g, '');
  // Batasi panjang
  clean = clean.trim().slice(0, maxLength);
  return clean;
}

/**
 * Validasi dan sanitasi username (hanya huruf, angka, underscore, titik, dash)
 */
export function sanitizeUsername(username: string): string {
  if (!username || typeof username !== 'string') return '';
  return username.trim().toLowerCase().replace(/[^a-z0-9_.-]/g, '').slice(0, 50);
}

/**
 * Validasi dan sanitasi email
 */
export function sanitizeEmail(email: string): string {
  if (!email || typeof email !== 'string') return '';
  return email.trim().toLowerCase().slice(0, 150);
}
