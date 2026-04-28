import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type ChatQA = {
  q_en: string;
  q_ka: string;
  a_en: string;
  a_ka: string;
};

export type ChatSettings = {
  chat_knowledge_en: string;
  chat_knowledge_ka: string;
  chat_qas: ChatQA[];
};

export const CHAT_DEFAULTS: ChatSettings = {
  chat_knowledge_en: "",
  chat_knowledge_ka: "",
  chat_qas: [],
};

const KEYS = ["chat_knowledge_en", "chat_knowledge_ka", "chat_qas"] as const;

export function useChatSettings() {
  return useQuery({
    queryKey: ["chat-settings"],
    queryFn: async (): Promise<ChatSettings> => {
      const { data, error } = await supabase
        .from("site_settings")
        .select("key,value")
        .in("key", KEYS as unknown as string[]);
      if (error) throw error;
      const map: Record<string, string | null> = {};
      for (const r of data ?? []) map[r.key] = r.value;
      let qas: ChatQA[] = [];
      try {
        qas = map.chat_qas ? (JSON.parse(map.chat_qas) as ChatQA[]) : [];
      } catch {
        qas = [];
      }
      return {
        chat_knowledge_en: map.chat_knowledge_en || "",
        chat_knowledge_ka: map.chat_knowledge_ka || "",
        chat_qas: qas,
      };
    },
  });
}
