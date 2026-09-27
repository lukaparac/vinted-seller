import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/** Dohvaća potpisane URL-ove za privatne fotografije artikla. */
export function useSignedImages(paths: string[]) {
  const key = paths.join("|");
  return useQuery({
    queryKey: ["signed-images", key],
    enabled: paths.length > 0,
    staleTime: 1000 * 60 * 30,
    queryFn: async () => {
      const { data, error } = await supabase.storage
        .from("item-photos")
        .createSignedUrls(paths, 60 * 60);
      if (error) throw error;
      const map: Record<string, string> = {};
      data?.forEach((row) => {
        if (row.path && row.signedUrl) map[row.path] = row.signedUrl;
      });
      return map;
    },
  });
}
