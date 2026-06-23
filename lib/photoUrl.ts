/**
 * Resolve a URL de imagem mostrável a partir da `key` de uma foto.
 *
 * - Uploads locais (dev/mock) começam por "uploads/" e são servidos por Next
 *   a partir de /public → devolvemos "/uploads/...".
 * - Caso contrário (S3 em produção, ou keys de seed antigas) caímos num
 *   placeholder com o nome da foto.
 */
export function getPhotoImageUrl(
  key: string | null | undefined,
  name = "Foto"
): string {
  if (key && key.startsWith("uploads/")) {
    return `/${key}`;
  }
  if (key && (key.startsWith("http://") || key.startsWith("https://"))) {
    return key;
  }
  return `https://via.placeholder.com/600x400?text=${encodeURIComponent(name)}`;
}
