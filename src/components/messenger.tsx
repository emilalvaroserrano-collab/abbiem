import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Check,
  CircleAlert,
  Info,
  Menu,
  Mic,
  Phone,
  Plus,
  Paperclip,
  SendHorizontal,
  SquarePen,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { getSnapshot, runAgentTurn } from "@/lib/agent/functions";
import {
  getWhatsAppStatus,
  logoutWhatsAppLink,
  requestWhatsAppPairing,
} from "@/lib/whatsapp/functions";
import { getStudioSchedule, pauseStudioCampaign, pollStudioJob } from "@/lib/studio/functions";
import { getLeadBoard, sendReply } from "@/lib/meta/functions";
import { sendWhatsAppMessage } from "@/lib/whatsapp/functions";
import type { WaStatus } from "@/lib/whatsapp/types";
import type { AgentAction } from "@/lib/agent/types";
import type { LeadHit, LeadSource } from "@/lib/meta/types";
import { newMessage, useChatStore, type Conversation, type ThreadMessage } from "@/lib/chat-store";
import { attachmentNote, filesToAttachments, type ChatAttachment } from "@/lib/attachments";
import { canUseBrowserSpeech, playBase64Mp3, startBrowserListen } from "@/lib/speech";
import { AbbieAvatar } from "@/components/marks";
import { CallOverlay, type CallPhase } from "@/components/call-overlay";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { OperatorSnapshot } from "@/lib/meta/types";

const STARTERS = [
  { label: "Make a banner", text: "Make a 16:9 banner of what my business actually does. Use the first Facebook page and its category." },
  { label: "Fast video", text: "Make a fast 6-second video of the actual work my business does — match the Facebook page category, not a generic brand film. Use the first page." },
  { label: "Find leads", text: "Find people and pages that might want our business. Filter Meta lead forms, Messenger chats, comments, and matching ad audiences." },
  { label: "Post 4× a day", text: "Set up 4 Facebook posts a day with fresh banners of the actual business on my first page." },
  { label: "Send a WhatsApp", text: "I want to send a WhatsApp message." },
];

const WELCOME =
  "Hey — I’m Abbie. Tell me what you need and I’ll handle it. I remember how you work, so you don’t have to start from zero every time.";

export function Messenger() {
  const snapshotQ = useQuery({
    queryKey: ["abbie-snapshot"],
    queryFn: async () => {
      const r = await getSnapshot();
      if (!r.data) throw new Error(r.error || "Could not load Meta");
      return r.data;
    },
    retry: 2,
    staleTime: 8_000,
    refetchOnMount: "always",
  });
  const waQ = useQuery({
    queryKey: ["wa-status"],
    queryFn: () => getWhatsAppStatus(),
    refetchInterval: (q) => (q.state.data?.status === "connected" ? 15_000 : 2_000),
    staleTime: 1_000,
  });
  const [infoOpen, setInfoOpen] = useState(false);
  const [chatsOpen, setChatsOpen] = useState(false);
  const [leadsOpen, setLeadsOpen] = useState(false);
  const studioQ = useQuery({
    queryKey: ["studio-schedule"],
    queryFn: getStudioSchedule,
    enabled: infoOpen,
    staleTime: 20_000,
  });
  const leadsQ = useQuery({
    queryKey: ["lead-board"],
    queryFn: async () => {
      const r = await getLeadBoard({ data: {} });
      if (r.error) throw new Error(r.error);
      return r.data;
    },
    enabled: infoOpen || leadsOpen,
    staleTime: 45_000,
  });

  const conversations = useChatStore((s) => s.conversations);
  const activeId = useChatStore((s) => s.activeId);
  const add = useChatStore((s) => s.add);
  const patch = useChatStore((s) => s.patch);
  const clear = useChatStore((s) => s.clear);
  const newChat = useChatStore((s) => s.newChat);
  const selectChat = useChatStore((s) => s.selectChat);
  const deleteChat = useChatStore((s) => s.deleteChat);
  const remember = useChatStore((s) => s.remember);
  const forget = useChatStore((s) => s.forget);
  const messages =
    conversations.find((c) => c.id === activeId)?.messages ??
    conversations[0]?.messages ??
    [];

  const [hydrated, setHydrated] = useState(false);
  const [draft, setDraft] = useState("");
  const [attachments, setAttachments] = useState<ChatAttachment[]>([]);
  const [busy, setBusy] = useState(false);
  const [listening, setListening] = useState(false);
  const [callOpen, setCallOpen] = useState(false);
  const [callPhase, setCallPhase] = useState<CallPhase>("connecting");
  const [callCaption, setCallCaption] = useState("");
  const [muted, setMuted] = useState(false);

  const scroller = useRef<HTMLDivElement>(null);
  const ta = useRef<HTMLTextAreaElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const listenStop = useRef<null | (() => void)>(null);
  const audioEl = useRef<HTMLAudioElement | null>(null);
  const callGen = useRef(0);
  const inCall = useRef(false);
  const mutedRef = useRef(false);
  const liveRef = useRef<{ stop: () => void; setMuted: (muted: boolean) => void } | null>(null);

  useEffect(() => setHydrated(true), []);
  useEffect(() => {
    mutedRef.current = muted;
  }, [muted]);
  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages, busy, hydrated]);

  const visible = hydrated ? messages : [];

  async function send(text: string, voice: boolean) {
    const trimmed = text.trim();
    const files = voice ? [] : attachments;
    if ((!trimmed && files.length === 0) || busy) return;
    const shown = trimmed;
    const user = newMessage("user", shown, { attachments: files.length ? files : undefined });
    const pending = newMessage("assistant", "", { pending: true });
    add(user);
    add(pending);
    setBusy(true);
    setDraft("");
    setAttachments([]);
    if (ta.current) {
      ta.current.style.height = "auto";
    }
    const gen = callGen.current;
    try {
      const store = useChatStore.getState();
      const history =
        store.conversations
          .find((c) => c.id === store.activeId)
          ?.messages.filter((m) => !m.pending && (m.content || m.attachments?.length))
          .map((m, index, all) => {
            const notes = (m.attachments ?? []).map(attachmentNote).join("\n");
            const content = [m.content.trim(), notes].filter(Boolean).join("\n").slice(0, 8000);
            const last = index === all.length - 1;
            const images =
              last && m.role === "user"
                ? (m.attachments ?? [])
                    .filter((file) => file.kind === "image" && file.url)
                    .map((file) => file.url as string)
                : undefined;
            return { role: m.role, content, images };
          }) ?? [];
      const result = await runAgentTurn({
        data: {
          messages: history,
          voice,
          memory: store.memory.map((f) => ({ category: f.category, text: f.text })),
          otherTitles: store.conversations
            .filter((c) => c.id !== store.activeId && c.title !== "New chat")
            .slice(0, 10)
            .map((c) => c.title),
        },
      });
      if (!result.ok) {
        patch(pending.id, {
          pending: false,
          error: result.error,
          content: result.error,
        });
        if (voice) toast.error(result.error);
        return;
      }
      patch(pending.id, {
        pending: false,
        content: result.text,
        actions: result.actions,
      });
      if (result.memoryUpdates?.length) {
        const adds = result.memoryUpdates.filter((u) => u.action === "add");
        const drops = result.memoryUpdates.filter((u) => u.action === "remove");
        if (adds.length) remember(adds);
        for (const d of drops) forget(d.text);
      }
      void snapshotQ.refetch();
      void waQ.refetch();
      void studioQ.refetch();
      if (voice && result.audio) {
        if (inCall.current && gen === callGen.current) {
          setCallPhase("speaking");
          setCallCaption(result.text);
        }
        const played = playBase64Mp3(result.audio);
        audioEl.current = played.el;
        await played.done;
      }
    } catch {
      patch(pending.id, {
        pending: false,
        error: "Something went wrong.",
        content: "Something went wrong. Try again in a moment.",
      });
    } finally {
      setBusy(false);
    }
  }

  function stopListen() {
    listenStop.current?.();
    listenStop.current = null;
    setListening(false);
  }

  function beginListen(opts: {
    onInterim: (t: string) => void;
    onFinal: (t: string) => void;
    onEmpty: () => void;
  }) {
    setListening(true);
    if (canUseBrowserSpeech()) {
      const handle = startBrowserListen({
        onInterim: opts.onInterim,
        onFinal: (t) => {
          setListening(false);
          listenStop.current = null;
          opts.onFinal(t);
        },
        onError: (err) => {
          setListening(false);
          listenStop.current = null;
          toast.error(err);
          opts.onEmpty();
        },
        onEnd: () => {
          setListening(false);
          listenStop.current = null;
          opts.onEmpty();
        },
      });
      listenStop.current = handle.stop;
      return;
    }
    void startMediaListen(opts);
  }

  function startMediaListen(opts: { onEmpty: () => void }) {
    setListening(false);
    toast.error("This browser can’t type from the mic. Use the call button — that’s live voice.");
    opts.onEmpty();
  }

  async function startCall() {
    if (callOpen || liveRef.current) return;
    inCall.current = true;
    callGen.current += 1;
    const gen = callGen.current;
    setCallOpen(true);
    setMuted(false);
    mutedRef.current = false;
    setCallPhase("connecting");
    setCallCaption("");
    stopListen();
    const store = useChatStore.getState();
    const { startGeminiLive } = await import("@/lib/voice/gemini-live");
    let handle;
    try {
      handle = await startGeminiLive({
      memory: store.memory.map((m) => ({ category: m.category, text: m.text })),
      otherTitles: store.conversations.filter((c) => c.id !== store.activeId).map((c) => c.title),
      isMuted: () => mutedRef.current,
      isCancelled: () => !inCall.current || gen !== callGen.current,
      onPhase: (phase) => {
        if (gen === callGen.current) setCallPhase(phase);
      },
      onCaption: (text) => {
        if (gen === callGen.current) setCallCaption(text);
      },
      onUserText: (text) => {
        if (gen === callGen.current) add(newMessage("user", text));
      },
      onAssistant: (text, actions) => {
        if (gen === callGen.current) add(newMessage("assistant", text, { actions }));
      },
      onMemory: (updates) => {
        const adds = updates.filter((u) => u.action === "add");
        const drops = updates.filter((u) => u.action === "remove");
        if (adds.length) remember(adds);
        for (const drop of drops) forget(drop.text);
      },
      onError: (message) => {
        if (gen !== callGen.current) return;
        toast.error(message);
        setCallCaption(message);
      },
    });
    } catch {
      if (gen === callGen.current) {
        toast.error("The live call didn’t connect.");
        setCallCaption("The live call didn’t connect.");
      }
      return;
    }
    if (!handle || !inCall.current || gen !== callGen.current) {
      handle?.stop();
      return;
    }
    liveRef.current = handle;
  }

  function hangup() {
    inCall.current = false;
    callGen.current += 1;
    liveRef.current?.stop();
    liveRef.current = null;
    stopListen();
    audioEl.current?.pause();
    audioEl.current = null;
    setCallOpen(false);
    setCallCaption("");
    setMuted(false);
  }

  function toggleMute() {
    const next = !muted;
    setMuted(next);
    mutedRef.current = next;
    liveRef.current?.setMuted(next);
    if (next) {
      stopListen();
      setCallCaption("");
    }
  }

  function onMicComposer() {
    if (listening) {
      stopListen();
      return;
    }
    beginListen({
      onInterim: (t) => setDraft(t),
      onFinal: (t) => {
        setDraft("");
        void send(t, true);
      },
      onEmpty: () => {},
    });
  }

  function onSubmit(e?: { preventDefault?: () => void }) {
    e?.preventDefault?.();
    void send(draft, false);
  }

  async function onPickFiles(list: FileList | File[] | null) {
    const picked = list ? [...list] : [];
    if (!picked.length) return;
    const { attachments: next, errors } = await filesToAttachments(picked, attachments.length);
    if (errors.length) toast.error(errors[0]);
    if (next.length) setAttachments((current) => [...current, ...next].slice(0, 4));
    if (fileInput.current) fileInput.current.value = "";
  }

  function openLeads() {
    setLeadsOpen(true);
    void leadsQ.refetch();
  }

  function onStarter(label: string, text: string) {
    if (label === "Find leads") {
      openLeads();
      return;
    }
    void send(text, false);
  }

  const snapshot = snapshotQ.data ?? null;

  return (
    <div className="flex h-dvh min-h-0 bg-bg text-fg">
      <section className="flex min-w-0 flex-1 flex-col bg-bg">
        <header className="flex h-14 shrink-0 items-center gap-1 border-b border-border px-1.5 sm:px-2">
          <IconBtn label="Open chats" onClick={() => setChatsOpen(true)}>
            <Menu className="size-6" />
          </IconBtn>
          <span className="relative">
            <AbbieAvatar size={36} />
            <span className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full border-2 border-bg bg-active" />
          </span>
          <div className="min-w-0 flex-1 pl-1">
            <p className="truncate text-[0.9375rem] font-semibold leading-tight">Abbie</p>
            <p className="truncate text-[0.75rem] text-active">Active now</p>
          </div>
          {waQ.data?.status !== "connected" && !waQ.data?.saved && (
            <button
              type="button"
              onClick={() => setInfoOpen(true)}
              className="hidden h-9 shrink-0 items-center rounded-full bg-elevated px-3 text-xs font-medium text-accent sm:flex"
            >
              Link WhatsApp
            </button>
          )}
          <IconBtn label="Call Abbie" onClick={() => void startCall()}>
            <Phone className="size-5" />
          </IconBtn>
          <IconBtn label="Leads" onClick={openLeads}>
            <Users className="size-5" />
          </IconBtn>
          <IconBtn label="Account details" onClick={() => setInfoOpen(true)}>
            <Info className="size-5" />
          </IconBtn>
        </header>

        <div ref={scroller} className="min-h-0 flex-1 overflow-y-auto px-3 py-4 sm:px-6">
          <p className="mb-5 text-center text-[0.75rem] text-faint">
            Today · {new Date().toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
          </p>
          {visible.length === 0 && (
            <div className="msg-enter mx-auto max-w-md">
              <IncomingBubble text={WELCOME} />
              {waQ.data?.status !== "connected" && waQ.data?.saved && (
                <div className="mt-3 ml-11 max-w-xs rounded-lg bg-elevated px-3 py-3">
                  <p className="text-sm font-medium">WhatsApp</p>
                  <p className="mt-1 text-xs leading-snug text-muted">
                    Reconnecting{waQ.data.userPhone ? ` ${waQ.data.userPhone}` : " your linked phone"}…
                    You won’t need to scan again.
                  </p>
                </div>
              )}
              {waQ.data?.status !== "connected" && !waQ.data?.saved && (
                <div className="mt-3 ml-11 max-w-xs rounded-lg bg-elevated px-3 py-3">
                  <p className="text-sm font-medium">Link WhatsApp</p>
                  <p className="mt-1 text-xs leading-snug text-muted">
                    WhatsApp → Linked devices → Link a device
                  </p>
                  {waQ.data?.qrDataUrl ? (
                    <img
                      src={waQ.data.qrDataUrl}
                      alt="WhatsApp QR code"
                      width={224}
                      height={224}
                      className="mx-auto mt-3 size-56 rounded-md bg-accent-fg p-2"
                    />
                  ) : (
                    <p className="mt-3 text-sm text-muted">
                      {waQ.data?.status === "error"
                        ? waQ.data.error || "Could not start WhatsApp"
                        : "Preparing a QR…"}
                    </p>
                  )}
                  {waQ.data?.pairingCode && (
                    <p className="mt-3 text-center font-mono text-xl tracking-widest">
                      {waQ.data.pairingCode}
                    </p>
                  )}
                  {waQ.data?.error && waQ.data.status !== "error" && (
                    <p className="mt-2 text-xs text-danger">{waQ.data.error}</p>
                  )}
                  <button
                    type="button"
                    onClick={() => setInfoOpen(true)}
                    className="mt-3 h-11 w-full rounded-md bg-subtle text-sm font-medium text-muted hover:text-fg"
                  >
                    Pairing code instead
                  </button>
                </div>
              )}
              <div className="mt-3 flex flex-wrap gap-2 pl-11">
                {STARTERS.map((s) => (
                  <button
                    key={s.label}
                    type="button"
                    onClick={() => onStarter(s.label, s.text)}
                    className="h-9 rounded-full border border-accent/40 px-3.5 text-sm font-medium text-accent transition-colors duration-150 hover:bg-accent/10"
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          )}
          {visible.map((m, i) => (
            <MessageRow
              key={m.id}
              msg={m}
              showAvatar={m.role === "assistant" && visible[i - 1]?.role !== "assistant"}
            />
          ))}
        </div>

        <form
          onSubmit={onSubmit}
          className="shrink-0 border-t border-border px-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 sm:px-3"
        >
          {visible.length > 0 && (
            <div className="mb-1.5 flex gap-2 overflow-x-auto px-1 pb-0.5">
              {STARTERS.slice(0, 3).map((s) => (
                <button
                  key={s.label}
                  type="button"
                  disabled={busy}
                  onClick={() => onStarter(s.label, s.text)}
                  className="h-8 shrink-0 rounded-full border border-accent/40 px-3 text-xs font-medium text-accent transition-colors duration-150 hover:bg-accent/10 disabled:opacity-40"
                >
                  {s.label}
                </button>
              ))}
            </div>
          )}
          {attachments.length > 0 && (
            <div className="mb-2 flex gap-2 overflow-x-auto px-1">
              {attachments.map((file) => (
                <div key={file.id} className="relative shrink-0">
                  {file.kind === "image" && file.url ? (
                    <img
                      src={file.url}
                      alt=""
                      className="size-16 rounded-md object-cover"
                    />
                  ) : (
                    <div className="flex h-16 w-28 items-center gap-1.5 rounded-md bg-elevated px-2">
                      <Paperclip className="size-3.5 shrink-0 text-muted" />
                      <span className="truncate text-xs text-fg">{file.name}</span>
                    </div>
                  )}
                  <button
                    type="button"
                    aria-label={`Remove ${file.name}`}
                    onClick={() =>
                      setAttachments((current) => current.filter((item) => item.id !== file.id))
                    }
                    className="absolute -right-1 -top-1 grid size-5 place-items-center rounded-full bg-fg text-bg"
                  >
                    <X className="size-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="flex items-end gap-1.5">
            <IconBtn label="Account details" onClick={() => setInfoOpen(true)}>
              <Plus className="size-6" />
            </IconBtn>
            <div className="flex min-w-0 flex-1 items-end rounded-full bg-elevated py-1.5 pl-1.5 pr-4">
              <button
                type="button"
                aria-label="Attach a photo or file"
                onClick={() => fileInput.current?.click()}
                className="flex size-9 shrink-0 items-center justify-center rounded-full text-muted hover:text-fg"
              >
                <Paperclip className="size-5" />
              </button>
              <input
                ref={fileInput}
                type="file"
                multiple
                accept="image/*,.pdf,.txt,.md,.csv,.json,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip"
                className="hidden"
                onChange={(e) => void onPickFiles(e.target.files)}
              />
              <textarea
                ref={ta}
                rows={1}
                value={draft}
                placeholder={listening ? "Listening…" : "Aa"}
                suppressHydrationWarning
                onChange={(e) => {
                  setDraft(e.target.value);
                  const el = e.target;
                  el.style.height = "auto";
                  el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
                }}
                onPaste={(e) => {
                  const pasted = [...e.clipboardData.files];
                  if (!pasted.length) return;
                  e.preventDefault();
                  void onPickFiles(pasted);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    onSubmit();
                  }
                }}
                className="max-h-28 min-h-9 w-full resize-none bg-transparent py-1.5 text-[0.9375rem] text-fg outline-none placeholder:text-faint"
              />
            </div>
            {draft.trim() || attachments.length > 0 ? (
              <IconBtn label="Send" onClick={() => onSubmit()} tone="accent">
                <SendHorizontal className="size-5" />
              </IconBtn>
            ) : (
              <IconBtn
                label={listening ? "Stop listening" : "Voice message"}
                onClick={onMicComposer}
                tone={listening ? "accent" : "plain"}
              >
                <Mic className="size-6" />
              </IconBtn>
            )}
          </div>
        </form>
      </section>

      {chatsOpen && (
        <ChatDrawer
          conversations={[...conversations].sort((a, b) => b.updatedAt - a.updatedAt)}
          activeId={activeId}
          waLabel={
            waQ.data?.status === "connected"
              ? `WhatsApp · ${waQ.data.userPhone ?? waQ.data.userName ?? "linked"}`
              : waQ.data?.saved
                ? `WhatsApp · reconnecting${waQ.data.userPhone ? ` ${waQ.data.userPhone}` : ""}`
                : waQ.data?.status === "qr"
                  ? "WhatsApp · scan QR to link"
                  : snapshot
                    ? `Pages · ${snapshot.operator}`
                    : snapshotQ.isError
                      ? "Meta is unreachable right now"
                      : "Connecting…"
          }
          onClose={() => setChatsOpen(false)}
          onNew={() => {
            newChat();
            setChatsOpen(false);
          }}
          onSelect={(id) => {
            selectChat(id);
            setChatsOpen(false);
          }}
          onDelete={deleteChat}
        />
      )}

      {leadsOpen && (
        <LeadsDrawer
          board={leadsQ.data ?? null}
          error={leadsQ.error instanceof Error ? leadsQ.error.message : null}
          loading={leadsQ.isLoading || leadsQ.isFetching}
          link={waQ.data ?? null}
          onClose={() => setLeadsOpen(false)}
          onReply={async (pageId, recipientId, text, phone, closed) => {
            if (!closed) {
              const result = await sendReply({ data: { pageId, recipientId, text } });
              if (result.ok) return { ok: true, message: result.message };
              if (result.extra?.reason !== "window") {
                return { ok: false, message: result.message };
              }
            }
            const digits = phone.replace(/\D/g, "");
            if (digits.length < 8) {
              return {
                ok: false,
                needsPhone: true,
                message:
                  "Messenger closed this chat. Add their WhatsApp number — it sends from your phone.",
              };
            }
            if (waQ.data?.status !== "connected") {
              return {
                ok: false,
                needsLink: true,
                message: "Scan the code. This message sends the moment WhatsApp links.",
              };
            }
            const wa = await sendWhatsAppMessage({ data: { to: phone, text } });
            return wa.ok
              ? { ok: true, message: wa.message }
              : { ok: false, needsPhone: true, message: wa.message };
          }}
        />
      )}

      {infoOpen && (
        <InfoPanel
          snapshot={snapshot}
          error={snapshotQ.error instanceof Error ? snapshotQ.error.message : null}
          wa={waQ.data ?? null}
          studio={studioQ.data?.data ?? null}
          leads={leadsQ.data ?? null}
          leadsError={leadsQ.error instanceof Error ? leadsQ.error.message : null}
          onClose={() => setInfoOpen(false)}
          onClear={() => {
            clear();
            setInfoOpen(false);
          }}
          onLogoutWa={async () => {
            await logoutWhatsAppLink();
            void waQ.refetch();
          }}
          onOpenLeads={() => {
            setInfoOpen(false);
            openLeads();
          }}
          onPauseCampaign={async (id) => {
            await pauseStudioCampaign({ data: { id } });
            void studioQ.refetch();
          }}
          onPair={async (phone) => {
            await requestWhatsAppPairing({ data: { phone } });
            void waQ.refetch();
          }}
        />
      )}

      <CallOverlay
        open={callOpen}
        phase={callPhase}
        caption={callCaption}
        muted={muted}
        onHangup={hangup}
        onToggleMute={toggleMute}
      />
    </div>
  );
}

function ChatDrawer({
  conversations,
  activeId,
  waLabel,
  onClose,
  onNew,
  onSelect,
  onDelete,
}: {
  conversations: Conversation[];
  activeId: string;
  waLabel: string;
  onClose: () => void;
  onNew: () => void;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="fixed inset-0 z-40 flex bg-bg/60" onClick={onClose}>
      <aside
        className="drawer-in flex h-full w-full max-w-sm flex-col bg-surface shadow-[var(--shadow-border)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex h-14 items-center gap-1 px-2">
          <IconBtn label="Close chats" onClick={onClose}>
            <X className="size-6" />
          </IconBtn>
          <h1 className="min-w-0 flex-1 font-display text-xl font-semibold tracking-tight">Chats</h1>
          <IconBtn label="New chat" onClick={onNew}>
            <SquarePen className="size-5" />
          </IconBtn>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          {conversations.map((c) => {
            const last = c.messages[c.messages.length - 1];
            const preview = last?.content || "Empty chat";
            const active = c.id === activeId;
            return (
              <div key={c.id} className={cn("flex items-stretch", active && "bg-elevated/80")}>
                <button
                  type="button"
                  onClick={() => onSelect(c.id)}
                  className="flex min-w-0 flex-1 items-center gap-3 px-4 py-3 text-left"
                >
                  <span className="relative shrink-0">
                    <AbbieAvatar size={48} />
                    {active && (
                      <span className="absolute bottom-0 right-0 size-3 rounded-full border-2 border-surface bg-active" />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className="truncate text-[0.9375rem] font-semibold">{c.title}</span>
                      <span className="shrink-0 text-[0.6875rem] text-faint">
                        {formatWhen(c.updatedAt)}
                      </span>
                    </span>
                    <span className="mt-0.5 block truncate text-sm text-muted">{preview}</span>
                  </span>
                </button>
                {c.messages.length > 0 && (
                  <button
                    type="button"
                    aria-label="Delete chat"
                    onClick={() => onDelete(c.id)}
                    className="flex size-11 shrink-0 items-center justify-center self-center text-faint hover:text-danger"
                  >
                    <Trash2 className="size-4" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
        <div className="border-t border-border px-4 py-3 text-[0.75rem] leading-relaxed text-faint">
          {waLabel}
        </div>
      </aside>
    </div>
  );
}

function formatWhen(ts: number) {
  const d = new Date(ts);
  const now = new Date();
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
  if (sameDay) {
    return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  }
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function IconBtn({
  label,
  onClick,
  children,
  tone = "plain",
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
  tone?: "plain" | "accent";
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={cn(
        "flex size-11 shrink-0 items-center justify-center rounded-full transition-colors duration-150",
        tone === "accent" ? "text-accent" : "text-accent hover:bg-elevated",
      )}
    >
      {children}
    </button>
  );
}

function IncomingBubble({ text }: { text: string }) {
  return (
    <div className="flex items-end gap-2">
      <AbbieAvatar size={28} />
      <div className="max-w-[min(78%,28rem)] rounded-lg rounded-bl-sm bg-bubble-in px-3.5 py-2 text-sm leading-snug break-words text-fg">
        {text}
      </div>
    </div>
  );
}

function MessageRow({ msg, showAvatar }: { msg: ThreadMessage; showAvatar: boolean }) {
  const outgoing = msg.role === "user";
  return (
    <div className={cn("msg-enter mb-1.5 flex", outgoing ? "justify-end" : "items-end gap-2")}>
      {!outgoing &&
        (showAvatar ? <AbbieAvatar size={28} /> : <span className="size-7 shrink-0" />)}
      <div className={cn("max-w-[min(78%,28rem)]", outgoing && "items-end")}>
        <div
          className={cn(
            "rounded-lg px-3.5 py-2 text-sm leading-snug break-words whitespace-pre-wrap",
            outgoing
              ? "rounded-br-sm bg-bubble-out text-accent-fg"
              : "rounded-bl-sm bg-bubble-in text-fg",
            msg.error && "bg-danger/20 text-fg",
          )}
        >
          {msg.pending ? (
            <TypingDots />
          ) : (
            <>
              {msg.attachments && msg.attachments.length > 0 && (
                <div className={cn("flex flex-col gap-1.5", msg.content && "mb-1.5")}>
                  {msg.attachments.map((file) =>
                    file.kind === "image" && file.url ? (
                      <img
                        key={file.id}
                        src={file.url}
                        alt={file.name}
                        className="max-h-52 w-full rounded-md object-cover"
                      />
                    ) : (
                      <span key={file.id} className="flex items-center gap-1.5 text-xs">
                        <Paperclip className="size-3.5 shrink-0" />
                        <span className="truncate">{file.name}</span>
                      </span>
                    ),
                  )}
                </div>
              )}
              {msg.content}
            </>
          )}
        </div>
        {msg.actions.length > 0 && (
          <div className="mt-1.5 space-y-1.5">
            {msg.actions.map((a, i) => (
              <ActionChip key={`${msg.id}-${i}`} action={a} messageId={msg.id} index={i} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function TypingDots() {
  return (
    <span className="inline-flex h-4 items-center gap-1 px-1" aria-label="Abbie is typing">
      <span className="typing-dot size-1.5 rounded-full bg-fg" />
      <span className="typing-dot size-1.5 rounded-full bg-fg" />
      <span className="typing-dot size-1.5 rounded-full bg-fg" />
    </span>
  );
}

function ActionChip({
  action,
  messageId,
  index,
}: {
  action: AgentAction;
  messageId: string;
  index: number;
}) {
  const patch = useChatStore((s) => s.patch);
  const live = action;

  useEffect(() => {
    if (!action.jobId || action.mediaUrl) return;
    let stop = false;
    const run = async () => {
      for (let i = 0; i < 28 && !stop; i += 1) {
        await new Promise((r) => setTimeout(r, 3000));
        if (stop) return;
        const result = await pollStudioJob({ data: { id: action.jobId! } });
        if (stop) return;
        const store = useChatStore.getState();
        const messages =
          store.conversations.find((c) => c.id === store.activeId)?.messages ?? [];
        const msg = messages.find((m) => m.id === messageId);
        if (!msg) return;
        const next = [...msg.actions];
        const current = next[index];
        if (!current) return;
        if (result.status === "done" && result.mediaUrl) {
          next[index] = {
            ...current,
            ok: true,
            title: result.mediaKind === "video" ? "Showcase video ready" : "Creative ready",
            detail: "Play it below.",
            mediaUrl: result.mediaUrl,
            mediaKind: result.mediaKind,
          };
          patch(messageId, { actions: next });
          return;
        }
        if (result.status === "failed") {
          next[index] = {
            ...current,
            ok: false,
            title: "Video failed",
            detail: result.error || "Could not finish the video.",
          };
          patch(messageId, { actions: next });
          return;
        }
      }
    };
    void run();
    return () => {
      stop = true;
    };
  }, [action.jobId, action.mediaUrl, messageId, index, patch]);

  return (
    <div className="flex items-start gap-2 rounded-md bg-elevated px-3 py-2">
      {live.ok ? (
        <Check className="mt-0.5 size-4 shrink-0 text-success" />
      ) : (
        <CircleAlert className="mt-0.5 size-4 shrink-0 text-danger" />
      )}
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium leading-snug">{live.title}</p>
        <p className="text-xs leading-snug text-muted">{live.detail}</p>
        {live.jobId && !live.mediaUrl && live.ok ? (
          <p className="mt-2 text-xs text-faint">Rendering…</p>
        ) : null}
        {live.mediaUrl && live.mediaKind === "video" ? (
          <video
            src={live.mediaUrl}
            controls
            playsInline
            className="mt-2 w-full rounded-md bg-subtle"
          />
        ) : live.mediaUrl ? (
          <img
            src={live.mediaUrl}
            alt={live.title}
            className="mt-2 w-full rounded-md bg-subtle object-cover"
          />
        ) : null}
        {live.leads && live.leads.length > 0 ? <LeadList leads={live.leads} /> : null}
      </div>
    </div>
  );
}

function SOURCE_LABEL(source: LeadSource) {
  switch (source) {
    case "form":
      return "Lead form";
    case "messenger":
      return "Messenger";
    case "comment":
      return "Comment";
    case "mention":
      return "Tag";
    case "audience":
      return "Audience";
    case "page":
      return "Page";
  }
}

function LeadList({ leads }: { leads: LeadHit[] }) {
  return (
    <ul className="mt-2 space-y-2">
      {leads.slice(0, 12).map((l) => (
        <li key={l.id} className="rounded-md bg-subtle px-2.5 py-2">
          <div className="flex items-baseline justify-between gap-2">
            <p className="truncate text-sm font-medium">{l.name}</p>
            <span className="shrink-0 text-xs tabular-nums text-faint">{l.score}</span>
          </div>
          <p className="mt-0.5 text-xs text-accent">
            {SOURCE_LABEL(l.source)}
            {l.pageName ? ` · ${l.pageName}` : ""}
            {l.audienceSize ? ` · ${l.audienceSize}` : ""}
          </p>
          <p className="mt-0.5 text-xs leading-snug text-muted">{l.snippet || l.reason}</p>
          {l.contact ? <p className="mt-0.5 text-xs text-faint">{l.contact}</p> : null}
        </li>
      ))}
    </ul>
  );
}

const LEAD_FILTERS: Array<{ id: "all" | LeadSource; label: string }> = [
  { id: "all", label: "All" },
  { id: "messenger", label: "Chats" },
  { id: "form", label: "Forms" },
  { id: "comment", label: "Comments" },
  { id: "page", label: "Pages" },
  { id: "audience", label: "Audiences" },
];

function LeadsDrawer({
  board,
  error,
  loading,
  link,
  onClose,
  onReply,
}: {
  board: { leads: LeadHit[]; notes: string[] } | null;
  error: string | null;
  loading: boolean;
  link: WaStatus | null;
  onClose: () => void;
  onReply: (
    pageId: string,
    recipientId: string,
    text: string,
    phone: string,
    closed: boolean,
  ) => Promise<{ ok: boolean; message: string; needsPhone?: boolean; needsLink?: boolean }>;
}) {
  const [filter, setFilter] = useState<"all" | LeadSource>("all");
  const [q, setQ] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  const leads = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return (board?.leads ?? []).filter((l) => {
      if (filter !== "all" && l.source !== filter) return false;
      if (!needle) return true;
      return `${l.name} ${l.snippet} ${l.reason} ${l.pageName}`.toLowerCase().includes(needle);
    });
  }, [board, filter, q]);

  const people = leads.filter((l) => l.source !== "audience" && l.source !== "page").length;

  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-bg/60" onClick={onClose}>
      <aside
        className="drawer-in flex h-full w-full max-w-md flex-col bg-surface shadow-[var(--shadow-border)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex h-14 shrink-0 items-center gap-1 px-2">
          <IconBtn label="Close leads" onClick={onClose}>
            <X className="size-6" />
          </IconBtn>
          <div className="min-w-0 flex-1">
            <h1 className="font-display text-xl font-semibold tracking-tight">Leads</h1>
            <p className="truncate text-xs text-muted">
              {loading && !board
                ? "Reading Meta…"
                : `${people} people · ${leads.filter((l) => l.source === "audience").length} audiences`}
            </p>
          </div>
        </div>
        <div className="shrink-0 space-y-2 px-3 pb-2">
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Filter by name or keyword"
            className="h-11"
          />
          <div className="flex gap-1.5 overflow-x-auto pb-0.5">
            {LEAD_FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilter(f.id)}
                className={cn(
                  "h-8 shrink-0 rounded-full px-3 text-xs font-medium",
                  filter === f.id
                    ? "bg-accent text-accent-fg"
                    : "bg-elevated text-muted hover:text-fg",
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-8">
          {error ? (
            <p className="px-1 py-4 text-sm text-muted">{error}</p>
          ) : !board && loading ? (
            <p className="px-1 py-4 text-sm text-muted">Pulling chats, forms, and audiences…</p>
          ) : leads.length === 0 ? (
            <p className="px-1 py-4 text-sm text-muted">
              Nothing matched. Meta only returns people who already engaged with your pages.
            </p>
          ) : (
            <ul className="space-y-2">
              {leads.map((l) => {
                const expanded = openId === l.id;
                const canReply = l.source === "messenger" && Boolean(l.participantId && l.pageId);
                return (
                  <li key={l.id} className="rounded-lg bg-elevated px-3 py-3">
                    <button
                      type="button"
                      onClick={() => setOpenId(expanded ? null : l.id)}
                      className="w-full text-left"
                    >
                      <span className="flex items-baseline justify-between gap-2">
                        <span className="truncate text-sm font-semibold">{l.name}</span>
                        <span className="shrink-0 text-xs tabular-nums text-faint">{l.score}</span>
                      </span>
                      <span className="mt-0.5 block text-xs text-accent">
                        {SOURCE_LABEL(l.source)}
                        {l.pageName ? ` · ${l.pageName}` : ""}
                        {l.audienceSize ? ` · ${l.audienceSize}` : ""}
                      </span>
                      <span className="mt-1 block text-sm leading-snug text-muted">
                        {l.snippet || l.reason}
                      </span>
                      {l.contact ? (
                        <span className="mt-1 block text-xs text-faint">{l.contact}</span>
                      ) : null}
                    </button>
                    {expanded && canReply ? (
                      <LeadReply
                        name={l.name}
                        closed={threadClosed(l.when)}
                        link={link}
                        onSend={(text, phone) =>
                          onReply(l.pageId, l.participantId!, text, phone, threadClosed(l.when))
                        }
                      />
                    ) : expanded && l.source === "audience" ? (
                      <p className="mt-2 text-xs leading-relaxed text-faint">
                        Use this interest in a paused Meta ads campaign. Ask Abbie to create one.
                      </p>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )}
          {board?.notes[1] ? (
            <p className="mt-4 px-1 text-xs leading-relaxed text-faint">{board.notes[1]}</p>
          ) : null}
        </div>
      </aside>
    </div>
  );
}

function threadClosed(when: string | null) {
  if (!when) return true;
  const t = new Date(when).getTime();
  if (Number.isNaN(t)) return true;
  return Date.now() - t > 23 * 60 * 60 * 1000;
}

function LeadReply({
  name,
  closed,
  link,
  onSend,
}: {
  name: string;
  closed: boolean;
  link: WaStatus | null;
  onSend: (
    text: string,
    phone: string,
  ) => Promise<{ ok: boolean; message: string; needsPhone?: boolean; needsLink?: boolean }>;
}) {
  const [text, setText] = useState("");
  const [phone, setPhone] = useState("");
  const [sending, setSending] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [showPhone, setShowPhone] = useState(closed);
  const [showLink, setShowLink] = useState(false);
  const armed = useRef(false);
  const first = name.split(" ")[0] || name;
  const linked = link?.status === "connected";

  async function deliver(body: string, number: string) {
    setSending(true);
    setNote(null);
    try {
      const result = await onSend(body, number);
      setNote(result.message);
      setShowPhone(closed || Boolean(result.needsPhone) || Boolean(result.needsLink));
      setShowLink(Boolean(result.needsLink));
      armed.current = Boolean(result.needsLink);
      if (result.ok) {
        setText("");
        armed.current = false;
        toast.success(result.message);
      }
    } catch {
      setNote("Could not send. Try again.");
    } finally {
      setSending(false);
    }
  }

  useEffect(() => {
    if (!armed.current || !linked || sending) return;
    const body = text.trim();
    const number = phone.trim();
    if (!body || number.replace(/\D/g, "").length < 8) return;
    armed.current = false;
    void deliver(body, number);
    // deliver once when the phone finishes linking
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [linked]);

  return (
    <form
      className="mt-3 space-y-2"
      onSubmit={(e) => {
        e.preventDefault();
        const body = text.trim();
        if (!body || sending) return;
        void deliver(body, phone);
      }}
    >
      <div className="flex gap-2">
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={`Message ${first}`}
          className="h-11"
        />
        <button
          type="submit"
          disabled={sending || !text.trim()}
          className="h-11 shrink-0 rounded-md bg-accent px-3 text-sm font-medium text-accent-fg disabled:opacity-40"
        >
          {sending ? "Sending…" : "Send"}
        </button>
      </div>
      {showPhone ? (
        <Input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Their WhatsApp number"
          inputMode="tel"
          className="h-11"
        />
      ) : null}
      {showLink && !linked ? (
        <div className="rounded-md bg-subtle px-3 py-3">
          <p className="text-xs leading-relaxed text-muted">
            WhatsApp → Linked devices → Link a device
          </p>
          {link?.qrDataUrl ? (
            <img
              src={link.qrDataUrl}
              alt="WhatsApp QR code"
              width={224}
              height={224}
              className="mx-auto mt-3 size-44 rounded-md bg-accent-fg p-2"
            />
          ) : (
            <p className="mt-2 text-xs text-faint">
              {link?.status === "connecting" ? "Preparing the code…" : "Starting WhatsApp…"}
            </p>
          )}
          {link?.pairingCode ? (
            <p className="mt-2 text-center font-mono text-lg tracking-widest text-fg">{link.pairingCode}</p>
          ) : null}
        </div>
      ) : null}
      {note ? <p className="text-xs leading-relaxed text-muted">{note}</p> : null}
    </form>
  );
}

function InfoPanel({
  snapshot,
  error,
  wa,
  studio,
  leads,
  leadsError,
  onClose,
  onOpenLeads,
  onClear,
  onLogoutWa,
  onPair,
  onPauseCampaign,
}: {
  snapshot: OperatorSnapshot | null;
  error: string | null;
  wa: WaStatus | null;
  studio: {
    campaigns: Array<{ id: string; pageName: string; theme: string; timezone: string }>;
    slots: Array<{
      id: string;
      campaignId: string;
      publishAt: string;
      caption: string;
      mediaUrl: string | null;
      status: string;
    }>;
  } | null;
  leads: { leads: LeadHit[]; counts: Partial<Record<LeadSource, number>>; notes: string[] } | null;
  leadsError: string | null;
  onClose: () => void;
  onOpenLeads: () => void;
  onClear: () => void;
  onLogoutWa: () => Promise<void>;
  onPair: (phone: string) => Promise<void>;
  onPauseCampaign: (id: string) => Promise<void>;
}) {
  const [pairPhone, setPairPhone] = useState("");
  const [pairing, setPairing] = useState(false);
  const lines = useMemo(() => {
    if (!snapshot) return [];
    return [
      { label: "Operator", items: [snapshot.operator] },
      { label: "Pages", items: snapshot.pages.map((p) => p.name) },
      { label: "Ad accounts", items: snapshot.adAccounts.map((a) => `${a.name} · ${a.currency}`) },
    ];
  }, [snapshot]);

  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-bg/60" onClick={onClose}>
      <aside
        className="flex h-full w-full max-w-sm flex-col bg-surface shadow-[var(--shadow-border)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex h-14 items-center justify-between px-4">
          <p className="text-sm font-semibold">Accounts</p>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="flex size-11 items-center justify-center rounded-full text-muted hover:text-fg"
          >
            <X className="size-5" />
          </button>
        </div>
        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-4 pb-8">
          <section>
            <p className="mb-1.5 text-xs font-medium uppercase tracking-wider text-faint">
              WhatsApp
            </p>
            {wa && (wa.status === "connected" || wa.saved) ? (
              <div className="rounded-lg bg-elevated px-3 py-3">
                <p className="text-sm font-medium">{wa.userName ?? "Linked"}</p>
                <p className="text-xs text-muted">
                  {wa.status === "connected"
                    ? (wa.userPhone ?? "Personal WhatsApp")
                    : `Reconnecting${wa.userPhone ? ` ${wa.userPhone}` : "…"}`}
                </p>
                <p className="mt-2 text-xs leading-relaxed text-faint">
                  Session is saved. Abbie reconnects after a restart — no new QR unless you unlink.
                </p>
                <button
                  type="button"
                  onClick={() => void onLogoutWa()}
                  className="mt-3 h-11 w-full rounded-md bg-subtle text-sm font-medium text-muted hover:text-fg"
                >
                  Unlink
                </button>
              </div>
            ) : (
              <div className="rounded-lg bg-elevated px-3 py-3">
                <p className="text-sm leading-snug text-fg">
                  Scan with your phone. WhatsApp → Linked devices → Link a device.
                </p>
                {wa?.qrDataUrl ? (
                  <img
                    src={wa.qrDataUrl}
                    alt="WhatsApp QR code"
                    width={280}
                    height={280}
                    className="mx-auto mt-3 size-56 rounded-md bg-accent-fg p-2"
                  />
                ) : (
                  <p className="mt-3 text-sm text-muted">
                    {wa?.status === "connecting" ? "Preparing a QR…" : "Starting WhatsApp…"}
                  </p>
                )}
                {wa?.pairingCode && (
                  <p className="mt-3 text-center font-mono text-xl tracking-widest text-fg">
                    {wa.pairingCode}
                  </p>
                )}
                {wa?.error && <p className="mt-2 text-xs text-danger">{wa.error}</p>}
                <form
                  className="mt-3 flex gap-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    setPairing(true);
                    void onPair(pairPhone).finally(() => setPairing(false));
                  }}
                >
                  <Input
                    value={pairPhone}
                    onChange={(e) => setPairPhone(e.target.value)}
                    placeholder="Or enter your number"
                    inputMode="tel"
                    className="h-11"
                  />
                  <button
                    type="submit"
                    disabled={pairing || pairPhone.replace(/\D/g, "").length < 8}
                    className="h-11 shrink-0 rounded-md bg-accent px-3 text-sm font-medium text-accent-fg disabled:opacity-40"
                  >
                    Code
                  </button>
                </form>
                <p className="mt-2 text-xs leading-relaxed text-faint">
                  Number with country code, no plus. After you scan once, the session is saved.
                </p>
              </div>
            )}
          </section>
          <section>
            <p className="mb-1.5 text-xs font-medium uppercase tracking-wider text-faint">
              Leads
            </p>
            {leadsError ? (
              <p className="text-sm text-muted">{leadsError}</p>
            ) : !leads ? (
              <p className="text-sm text-muted">Reading Meta…</p>
            ) : (
              <div className="rounded-lg bg-elevated px-3 py-3">
                <p className="text-sm">
                  {leads.leads.filter((l) => l.source !== "audience" && l.source !== "page").length}{" "}
                  people · {leads.counts.audience ?? 0} audiences
                </p>
                <p className="mt-1 text-xs leading-relaxed text-faint">
                  Ranked from chats, forms, comments, and matching ad interests.
                </p>
                <button
                  type="button"
                  onClick={onOpenLeads}
                  className="mt-3 h-11 w-full rounded-md bg-accent text-sm font-medium text-accent-fg"
                >
                  Open leads
                </button>
              </div>
            )}
          </section>
          <section>
            <p className="mb-1.5 text-xs font-medium uppercase tracking-wider text-faint">
              4× daily posts
            </p>
            {!studio?.campaigns.length ? (
              <p className="text-sm text-muted">
                Ask Abbie to schedule banners four times a day.
              </p>
            ) : (
              <div className="space-y-3">
                {studio.campaigns.map((c) => (
                  <div key={c.id} className="rounded-lg bg-elevated px-3 py-3">
                    <p className="text-sm font-medium">{c.pageName}</p>
                    <p className="text-xs text-muted">{c.theme}</p>
                    <ul className="mt-2 space-y-2">
                      {studio.slots
                        .filter((s) => s.campaignId === c.id)
                        .slice(0, 4)
                        .map((s) => (
                          <li key={s.id} className="flex gap-2">
                            {s.mediaUrl ? (
                              <img
                                src={s.mediaUrl}
                                alt=""
                                className="size-11 shrink-0 rounded-md bg-subtle object-cover"
                              />
                            ) : (
                              <span className="size-11 shrink-0 rounded-md bg-subtle" />
                            )}
                            <span className="min-w-0 text-xs text-muted">
                              {new Date(s.publishAt).toLocaleString(undefined, {
                                timeZone: c.timezone || "Asia/Manila",
                                weekday: "short",
                                month: "short",
                                day: "numeric",
                                hour: "numeric",
                                minute: "2-digit",
                              })}
                              <span className="block">{s.status}</span>
                            </span>
                          </li>
                        ))}
                    </ul>
                    <button
                      type="button"
                      onClick={() => void onPauseCampaign(c.id)}
                      className="mt-3 h-11 w-full rounded-md bg-subtle text-sm font-medium text-muted hover:text-fg"
                    >
                      Pause schedule
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
          {error && <p className="text-sm text-danger">{error}</p>}
          {lines.map((g) => (
            <div key={g.label}>
              <p className="mb-1.5 text-xs font-medium uppercase tracking-wider text-faint">
                {g.label}
              </p>
              {g.items.length === 0 ? (
                <p className="text-sm text-muted">None connected</p>
              ) : (
                <ul className="space-y-1">
                  {g.items.map((item) => (
                    <li key={item} className="text-sm text-fg">
                      {item}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={onClear}
            className="mt-4 h-11 w-full rounded-md bg-elevated text-sm font-medium text-muted hover:text-fg"
          >
            Clear conversation
          </button>
        </div>
      </aside>
    </div>
  );
}
