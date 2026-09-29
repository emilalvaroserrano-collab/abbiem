import type { LeadHit } from "@/lib/meta/types";

export type AgentAction = {
  kind:
    | "whatsapp"
    | "post"
    | "campaign"
    | "messenger"
    | "inbox"
    | "info"
    | "creative"
    | "schedule"
    | "leads";
  ok: boolean;
  title: string;
  detail: string;
  mediaUrl?: string | null;
  mediaKind?: "image" | "video" | null;
  jobId?: string | null;
  leads?: LeadHit[];
};

export type ChatTurn = {
  role: "user" | "assistant";
  content: string;
  images?: string[];
};

export type MemoryUpdate = {
  action: "add" | "remove";
  category: "person" | "preference" | "contact" | "business" | "style" | "other";
  text: string;
};

export type AgentTurnOk = {
  ok: true;
  text: string;
  actions: AgentAction[];
  audio: string | null;
  memoryUpdates: MemoryUpdate[];
};

export type AgentTurnErr = {
  ok: false;
  error: string;
};

export type AgentTurnResult = AgentTurnOk | AgentTurnErr;
