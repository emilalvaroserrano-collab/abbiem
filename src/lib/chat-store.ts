import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AgentAction } from "@/lib/agent/types";
import type { ChatAttachment } from "@/lib/attachments";

export type ThreadMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: number;
  actions: AgentAction[];
  attachments?: ChatAttachment[];
  pending?: boolean;
  error?: string;
};

export type MemoryCategory = "person" | "preference" | "contact" | "business" | "style" | "other";

export type MemoryFact = {
  id: string;
  category: MemoryCategory;
  text: string;
  at: number;
};

export type Conversation = {
  id: string;
  title: string;
  updatedAt: number;
  messages: ThreadMessage[];
};

type ChatState = {
  conversations: Conversation[];
  activeId: string;
  memory: MemoryFact[];
  add: (msg: ThreadMessage) => void;
  patch: (id: string, patch: Partial<ThreadMessage>) => void;
  newChat: () => string;
  selectChat: (id: string) => void;
  deleteChat: (id: string) => void;
  clear: () => void;
  remember: (facts: Array<{ category: MemoryCategory; text: string }>) => void;
  forget: (text: string) => void;
};

function uid(prefix = "m") {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function emptyConvo(): Conversation {
  return { id: uid("c"), title: "New chat", updatedAt: Date.now(), messages: [] };
}

function titleFrom(text: string) {
  const t = text.replace(/\s+/g, " ").trim();
  if (!t) return "New chat";
  return t.length > 42 ? `${t.slice(0, 40)}…` : t;
}

export function newMessage(
  role: ThreadMessage["role"],
  content: string,
  extra?: Partial<ThreadMessage>,
): ThreadMessage {
  return {
    id: uid("m"),
    role,
    content,
    createdAt: Date.now(),
    actions: [],
    ...extra,
  };
}

function ensureActive(conversations: Conversation[], activeId: string) {
  if (conversations.some((c) => c.id === activeId)) return { conversations, activeId };
  const fallback = conversations[0] ?? emptyConvo();
  const list = conversations.length ? conversations : [fallback];
  return { conversations: list, activeId: fallback.id };
}

const seed = emptyConvo();

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      conversations: [seed],
      activeId: seed.id,
      memory: [],
      add: (msg) =>
        set((s) => {
          const { conversations, activeId } = ensureActive(s.conversations, s.activeId);
          return {
            conversations: conversations.map((c) => {
              if (c.id !== activeId) return c;
              const messages = [...c.messages, msg].slice(-80);
              const source = msg.content.trim() || msg.attachments?.[0]?.name || "";
              const titled =
                (c.title === "New chat" || !c.title) && msg.role === "user" && source
                  ? titleFrom(source)
                  : c.title;
              return { ...c, messages, title: titled, updatedAt: Date.now() };
            }),
            activeId,
          };
        }),
      patch: (id, patch) =>
        set((s) => ({
          conversations: s.conversations.map((c) =>
            c.id === s.activeId
              ? {
                  ...c,
                  updatedAt: Date.now(),
                  messages: c.messages.map((m) => (m.id === id ? { ...m, ...patch } : m)),
                }
              : c,
          ),
        })),
      newChat: () => {
        const s = get();
        const active = s.conversations.find((c) => c.id === s.activeId);
        if (active && active.messages.length === 0) return active.id;
        const c = emptyConvo();
        set({ conversations: [c, ...s.conversations], activeId: c.id });
        return c.id;
      },
      selectChat: (id) =>
        set((s) => {
          if (!s.conversations.some((c) => c.id === id)) return s;
          return { activeId: id };
        }),
      deleteChat: (id) =>
        set((s) => {
          const rest = s.conversations.filter((c) => c.id !== id);
          const list = rest.length ? rest : [emptyConvo()];
          const activeId = s.activeId === id ? list[0]!.id : s.activeId;
          return { conversations: list, activeId };
        }),
      clear: () =>
        set((s) => ({
          conversations: s.conversations.map((c) =>
            c.id === s.activeId ? { ...c, messages: [], title: "New chat", updatedAt: Date.now() } : c,
          ),
        })),
      remember: (facts) =>
        set((s) => {
          const next = [...s.memory];
          for (const f of facts) {
            const text = f.text.replace(/\s+/g, " ").trim().slice(0, 240);
            if (!text) continue;
            const hit = next.findIndex((x) => x.text.toLowerCase() === text.toLowerCase());
            if (hit >= 0) {
              next[hit] = { ...next[hit]!, category: f.category, text, at: Date.now() };
              continue;
            }
            next.push({ id: uid("f"), category: f.category, text, at: Date.now() });
          }
          return { memory: next.slice(-48) };
        }),
      forget: (text) =>
        set((s) => {
          const q = text.trim().toLowerCase();
          if (!q) return s;
          return { memory: s.memory.filter((f) => !f.text.toLowerCase().includes(q)) };
        }),
    }),
    {
      name: "abbie-desk",
      version: 1,
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        if (!state.conversations.length) {
          const c = emptyConvo();
          state.conversations = [c];
          state.activeId = c.id;
          return;
        }
        if (!state.conversations.some((c) => c.id === state.activeId)) {
          state.activeId = state.conversations[0]!.id;
        }
        try {
          if (state.conversations.every((c) => c.messages.length === 0)) {
            const raw = localStorage.getItem("aria-thread");
            if (!raw) return;
            const parsed = JSON.parse(raw) as { state?: { messages?: ThreadMessage[] } };
            const messages = parsed.state?.messages ?? [];
            if (messages.length) {
              const first = messages.find((m) => m.role === "user")?.content ?? "Earlier chat";
              state.conversations = [
                {
                  id: uid("c"),
                  title: titleFrom(first),
                  updatedAt: messages[messages.length - 1]?.createdAt ?? Date.now(),
                  messages,
                },
              ];
              state.activeId = state.conversations[0]!.id;
            }
          }
        } catch {
          /* ignore legacy */
        }
      },
    },
  ),
);

export function activeConversation(state: ChatState): Conversation {
  return (
    state.conversations.find((c) => c.id === state.activeId) ??
    state.conversations[0] ??
    emptyConvo()
  );
}
