import { supabase } from "@/lib/supabase";

export async function uploadEventBanner(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Apenas ficheiros de imagem são permitidos");
  }

  if (file.size > 5 * 1024 * 1024) {
    throw new Error("Imagem não pode exceder 5MB");
  }

  const timestamp = Date.now();
  const filename = `${timestamp}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
  const path = `event-banners/${filename}`;

  const { error, data } = await supabase.storage
    .from("fotos")
    .upload(path, file, { upsert: false });

  if (error) {
    throw new Error(`Upload falhou: ${error.message}`);
  }

  const { data: publicUrlData } = supabase.storage
    .from("fotos")
    .getPublicUrl(path);

  return publicUrlData.publicUrl;
}
