import { o as __toESM } from "../_runtime.mjs";
import { i as require_react, r as require_jsx_runtime, t as useQuery } from "../_libs/react+tanstack__react-query.mjs";
import { n as TSS_SERVER_FUNCTION, r as getServerFnById, t as createServerFn } from "./ssr.mjs";
import { n as array, o as object, r as boolean, s as string, t as _enum } from "../_libs/zod.mjs";
import { a as SquarePen, c as Phone, d as MicOff, f as Menu, h as Check, i as Trash2, l as PhoneOff, m as CircleAlert, n as Users, o as SendHorizontal, p as Info, s as Plus, t as X, u as Mic } from "../_libs/lucide-react.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { n as create, t as persist } from "../_libs/zustand.mjs";
import { t as clsx } from "../_libs/clsx.mjs";
import { t as twMerge } from "../_libs/tailwind-merge.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-CF3NgYDK.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var createSsrRpc = (functionId) => {
	const url = "/_serverFn/" + functionId;
	const serverFnMeta = { id: functionId };
	const fn = async (...args) => {
		return (await getServerFnById(functionId, { origin: "server" }))(...args);
	};
	return Object.assign(fn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
var turnInput = object({
	messages: array(object({
		role: _enum(["user", "assistant"]),
		content: string()
	})).max(24),
	voice: boolean().optional(),
	memory: array(object({
		category: string().max(24),
		text: string().max(240)
	})).max(48).optional(),
	otherTitles: array(string().max(80)).max(12).optional()
});
var runAgentTurn = createServerFn({ method: "POST" }).validator(turnInput).handler(createSsrRpc("6d7cd82177e6d276e369ea378945fba9dd62ee3623bfdeb5c7a7db1289fc6eb8"));
var getSnapshot = createServerFn({ method: "GET" }).handler(createSsrRpc("928e2a8bed6d48264ecc871971a822a243035834e591947a563ffbca75b9e9a4"));
var speakGreeting = createServerFn({ method: "POST" }).handler(createSsrRpc("fa208a739a1045ffafce8240083d5b65cc4a9b57f43d8128f57417f850e835bf"));
var transcribeAudio = createServerFn({ method: "POST" }).validator(object({
	audioBase64: string().min(20).max(2e6),
	mime: string().max(80).optional()
})).handler(createSsrRpc("88a5617652020962ef2664963dc18677220b6797f078c0388ba7710f709db744"));
var getWhatsAppStatus = createServerFn({ method: "GET" }).handler(createSsrRpc("c99399d4ec1f3c1ba13a388cd1525f0f88667dd4340dd1d4742f09557b6c1239"));
createServerFn({ method: "POST" }).handler(createSsrRpc("2c60afcbafe283adab2aa3bc4747618252771b291b80eacd584a308b15f9eb9d"));
var requestWhatsAppPairing = createServerFn({ method: "POST" }).validator(object({ phone: string().min(8).max(20) })).handler(createSsrRpc("7b44fd1dd6d6c73dc43a322ebf28687fcd246ba5b626cb98bf5974eb7010329d"));
var sendWhatsAppMessage = createServerFn({ method: "POST" }).validator(object({
	to: string().min(8).max(20),
	text: string().min(1).max(2e3)
})).handler(createSsrRpc("207e0deaca69643d6c4f1d42eb16c1f8188047f9f50dd7504e5b3c4c59c46a1a"));
var logoutWhatsAppLink = createServerFn({ method: "POST" }).handler(createSsrRpc("a712c54ef250ea32b33178838d0920487eb9cddbeab7d8abd6965a44b10ce3ad"));
var getStudioSchedule = createServerFn({ method: "GET" }).handler(createSsrRpc("c989707bb1936c41e47b55fe6811b0baed2ad8c4d1cee7d4ee0bd6c41e3125c0"));
createServerFn({ method: "POST" }).handler(createSsrRpc("a61abbf46cb5555f6c8b62d76df4cdbf39b794e54981ce14a91434fb4ba4442f"));
var pauseStudioCampaign = createServerFn({ method: "POST" }).validator(object({ id: string().min(8).max(80) })).handler(createSsrRpc("1676b2c876b8c73d846be70bd050990c60a1b28ac9efc48b0b48645cc84df644"));
var pollStudioJob = createServerFn({ method: "POST" }).validator(object({ id: string().min(8).max(80) })).handler(createSsrRpc("bad154fc7932e5df8c5c4d97c3c71296872e353fd8175b08d5eac5a2bcf798a2"));
createServerFn({ method: "GET" }).handler(createSsrRpc("598ee5ee960442c3e45f3f8e6f71f71345d5360ced1d54cfe62dbab73b0391ed"));
createServerFn({ method: "GET" }).handler(createSsrRpc("37e829d8f67658a37840205154bc43cd0400f4c3cfe8d41ad0bcaf2d7be4e82e"));
createServerFn({ method: "POST" }).validator(object({
	pageId: string().min(1),
	conversationId: string().min(1)
})).handler(createSsrRpc("c619a3eea344d9ad087624a921224058ab56cba72939029523969b9a7d434ead"));
var sendReply = createServerFn({ method: "POST" }).validator(object({
	pageId: string().min(1),
	recipientId: string().min(1),
	text: string().min(1).max(2e3)
})).handler(createSsrRpc("a3df0e366d80d0e1f8470d798d8bee51806d1fce2b83ee38305083e4cdf5a26a"));
createServerFn({ method: "GET" }).handler(createSsrRpc("5af26b65bc4ea1127bc968d7135d27c5356798130fbaa1fb2b1ab120f8657dee"));
createServerFn({ method: "POST" }).validator(object({
	pageIds: array(string()).min(1),
	message: string().min(1).max(63206),
	link: string().optional()
})).handler(createSsrRpc("e1199b46e59d91a67a6b30449efbbdab293e2d63040d0e2ba7cba468700fcce8"));
createServerFn({ method: "GET" }).handler(createSsrRpc("6b05301f3bea0ddf8ba00d83045ba2159fc796437f50013602a1c105418502ed"));
var getLeadBoard = createServerFn({ method: "POST" }).validator(object({
	query: string().max(120).optional(),
	pageId: string().optional()
})).handler(createSsrRpc("43a4968c278ac56ce4b23ef7eb09693e2920f08b2a77ee0a0e24b5d694118f8f"));
function uid(prefix = "m") {
	return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
function emptyConvo() {
	return {
		id: uid("c"),
		title: "New chat",
		updatedAt: Date.now(),
		messages: []
	};
}
function titleFrom(text) {
	const t = text.replace(/\s+/g, " ").trim();
	if (!t) return "New chat";
	return t.length > 42 ? `${t.slice(0, 40)}…` : t;
}
function newMessage(role, content, extra) {
	return {
		id: uid("m"),
		role,
		content,
		createdAt: Date.now(),
		actions: [],
		...extra
	};
}
function ensureActive(conversations, activeId) {
	if (conversations.some((c) => c.id === activeId)) return {
		conversations,
		activeId
	};
	const fallback = conversations[0] ?? emptyConvo();
	return {
		conversations: conversations.length ? conversations : [fallback],
		activeId: fallback.id
	};
}
var seed = emptyConvo();
var useChatStore = create()(persist((set, get) => ({
	conversations: [seed],
	activeId: seed.id,
	memory: [],
	add: (msg) => set((s) => {
		const { conversations, activeId } = ensureActive(s.conversations, s.activeId);
		return {
			conversations: conversations.map((c) => {
				if (c.id !== activeId) return c;
				const messages = [...c.messages, msg].slice(-80);
				const titled = (c.title === "New chat" || !c.title) && msg.role === "user" && msg.content.trim() ? titleFrom(msg.content) : c.title;
				return {
					...c,
					messages,
					title: titled,
					updatedAt: Date.now()
				};
			}),
			activeId
		};
	}),
	patch: (id, patch) => set((s) => ({ conversations: s.conversations.map((c) => c.id === s.activeId ? {
		...c,
		updatedAt: Date.now(),
		messages: c.messages.map((m) => m.id === id ? {
			...m,
			...patch
		} : m)
	} : c) })),
	newChat: () => {
		const s = get();
		const active = s.conversations.find((c) => c.id === s.activeId);
		if (active && active.messages.length === 0) return active.id;
		const c = emptyConvo();
		set({
			conversations: [c, ...s.conversations],
			activeId: c.id
		});
		return c.id;
	},
	selectChat: (id) => set((s) => {
		if (!s.conversations.some((c) => c.id === id)) return s;
		return { activeId: id };
	}),
	deleteChat: (id) => set((s) => {
		const rest = s.conversations.filter((c) => c.id !== id);
		const list = rest.length ? rest : [emptyConvo()];
		return {
			conversations: list,
			activeId: s.activeId === id ? list[0].id : s.activeId
		};
	}),
	clear: () => set((s) => ({ conversations: s.conversations.map((c) => c.id === s.activeId ? {
		...c,
		messages: [],
		title: "New chat",
		updatedAt: Date.now()
	} : c) })),
	remember: (facts) => set((s) => {
		const next = [...s.memory];
		for (const f of facts) {
			const text = f.text.replace(/\s+/g, " ").trim().slice(0, 240);
			if (!text) continue;
			const hit = next.findIndex((x) => x.text.toLowerCase() === text.toLowerCase());
			if (hit >= 0) {
				next[hit] = {
					...next[hit],
					category: f.category,
					text,
					at: Date.now()
				};
				continue;
			}
			next.push({
				id: uid("f"),
				category: f.category,
				text,
				at: Date.now()
			});
		}
		return { memory: next.slice(-48) };
	}),
	forget: (text) => set((s) => {
		const q = text.trim().toLowerCase();
		if (!q) return s;
		return { memory: s.memory.filter((f) => !f.text.toLowerCase().includes(q)) };
	})
}), {
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
		if (!state.conversations.some((c) => c.id === state.activeId)) state.activeId = state.conversations[0].id;
		try {
			if (state.conversations.every((c) => c.messages.length === 0)) {
				const raw = localStorage.getItem("aria-thread");
				if (!raw) return;
				const messages = JSON.parse(raw).state?.messages ?? [];
				if (messages.length) {
					const first = messages.find((m) => m.role === "user")?.content ?? "Earlier chat";
					state.conversations = [{
						id: uid("c"),
						title: titleFrom(first),
						updatedAt: messages[messages.length - 1]?.createdAt ?? Date.now(),
						messages
					}];
					state.activeId = state.conversations[0].id;
				}
			}
		} catch {}
	}
}));
function RecognitionCtor() {
	if (typeof window === "undefined") return null;
	const w = window;
	return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}
function canUseBrowserSpeech() {
	return RecognitionCtor() !== null;
}
function startBrowserListen(handlers) {
	const Ctor = RecognitionCtor();
	if (!Ctor) {
		handlers.onError("Voice input is not supported in this browser.");
		handlers.onEnd();
		return { stop: () => {} };
	}
	const rec = new Ctor();
	rec.lang = "en-US";
	rec.continuous = false;
	rec.interimResults = true;
	let stopped = false;
	let finalText = "";
	rec.onresult = (ev) => {
		let interim = "";
		for (let i = 0; i < ev.results.length; i++) {
			const row = ev.results[i];
			if (!row) continue;
			const t = row[0]?.transcript ?? "";
			if (row.isFinal) finalText += t;
			else interim += t;
		}
		if (interim) handlers.onInterim((finalText + " " + interim).trim());
	};
	rec.onerror = (ev) => {
		if (stopped) return;
		if (ev.error === "no-speech") {
			handlers.onEnd();
			return;
		}
		if (ev.error === "aborted") return;
		handlers.onError(ev.error === "not-allowed" ? "Microphone permission is blocked." : "Could not hear that.");
	};
	rec.onend = () => {
		if (stopped) return;
		const text = finalText.trim();
		if (text) handlers.onFinal(text);
		else handlers.onEnd();
	};
	rec.start();
	return { stop: () => {
		stopped = true;
		try {
			rec.abort();
		} catch {}
	} };
}
function playBase64Mp3(b64) {
	const bin = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
	const url = URL.createObjectURL(new Blob([bin], { type: "audio/mpeg" }));
	const el = new Audio(url);
	el.preload = "auto";
	const done = new Promise((resolve) => {
		const finish = () => {
			URL.revokeObjectURL(url);
			resolve();
		};
		el.addEventListener("ended", finish, { once: true });
		el.addEventListener("error", finish, { once: true });
	});
	el.play().catch(() => {});
	return {
		el,
		done
	};
}
function cn(...inputs) {
	return twMerge(clsx(inputs));
}
/** Human portrait — copper disc, not a chat-app glyph. */
function AbbieAvatar({ className, size = 40 }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: cn("relative inline-flex shrink-0 overflow-hidden rounded-full", className),
		style: {
			width: size,
			height: size
		},
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
			viewBox: "0 0 64 64",
			className: "size-full",
			"aria-hidden": true,
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
					cx: "32",
					cy: "32",
					r: "32",
					fill: "#C46A4A"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
					d: "M8 58c4-10 14-16 24-16s20 6 24 16v10H8V58Z",
					fill: "#8F4632"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
					d: "M22 48c2.5-6 7-9 10-9s7.5 3 10 9v12H22V48Z",
					fill: "#D7A07A"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ellipse", {
					cx: "32",
					cy: "28.5",
					rx: "12",
					ry: "14",
					fill: "#E8B892"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
					d: "M18 30c1-14 9-20 14-20 5.2 0 13 6.2 14 20 0 3.5-1.2 7-3 9-1.8-10-5.5-16-11-16s-9.2 6-11 16c-1.8-2-3-5.5-3-9Z",
					fill: "#241610"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
					d: "M20 22c3.5-5.5 8.5-8 12-7.4 2 .4 3.2 2.2 2.8 4.2-.5 2.4-2.6 3.2-4.8 2.2-2.6-1.2-6.8 0-9.2 2.6-1.4 1.5-2.8.6-2.4-1.6.2-1.2.8-2.4 1.6-4Z",
					fill: "#1A110E"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ellipse", {
					cx: "27",
					cy: "29.5",
					rx: "1.5",
					ry: "1.9",
					fill: "#241610"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ellipse", {
					cx: "37",
					cy: "29.5",
					rx: "1.5",
					ry: "1.9",
					fill: "#241610"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ellipse", {
					cx: "27.4",
					cy: "28.9",
					rx: "0.45",
					ry: "0.5",
					fill: "#F3D7C0"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ellipse", {
					cx: "37.4",
					cy: "28.9",
					rx: "0.45",
					ry: "0.5",
					fill: "#F3D7C0"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
					d: "M28 35.2c2.4 2.2 5.6 2.2 8 0",
					fill: "none",
					stroke: "#B56A4A",
					strokeWidth: "1.4",
					strokeLinecap: "round"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
					cx: "44.2",
					cy: "33.5",
					r: "1.9",
					fill: "none",
					stroke: "#E2B15A",
					strokeWidth: "1.2"
				})
			]
		})
	});
}
var PHASE_LABEL = {
	connecting: "Calling…",
	listening: "Listening",
	thinking: "Abbie’s thinking",
	speaking: "Speaking"
};
function CallOverlay({ open, phase, caption, muted, onHangup, onToggleMute }) {
	if (!open) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "fixed inset-0 z-50 flex flex-col bg-bg text-fg",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex flex-1 flex-col items-center justify-center px-6",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "relative mb-8 grid place-items-center",
					children: [(phase === "listening" || phase === "speaking") && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "call-ring absolute size-36 rounded-full border border-accent/40" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "call-ring absolute size-36 rounded-full border border-accent/30" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "call-ring absolute size-36 rounded-full border border-accent/20" })
					] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AbbieAvatar, { size: 112 })]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "font-display text-3xl font-semibold tracking-tight",
					children: "Abbie"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1.5 text-sm text-muted",
					children: PHASE_LABEL[phase]
				}),
				phase === "listening" && !muted && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-5 flex h-7 items-end gap-1",
					"aria-hidden": true,
					children: [
						0,
						1,
						2,
						3,
						4
					].map((i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "wave-bar w-1 rounded-full bg-accent",
						style: { height: `${10 + i * 7 % 18}px` }
					}, i))
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: cn("mt-8 min-h-16 max-w-sm text-center text-base leading-relaxed text-fg", !caption && "text-faint"),
					children: caption || (muted ? "Mic is muted" : "Just say it.")
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-10 flex items-center justify-center gap-10",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: onToggleMute,
						className: cn("flex size-14 flex-col items-center justify-center rounded-full transition-colors duration-150", muted ? "bg-accent text-accent-fg" : "bg-elevated text-fg"),
						"aria-label": muted ? "Unmute" : "Mute",
						children: muted ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MicOff, { className: "size-6" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mic, { className: "size-6" })
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: onHangup,
						className: "flex size-16 items-center justify-center rounded-full bg-danger text-accent-fg transition-transform duration-150 active:scale-[0.96]",
						"aria-label": "End call",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PhoneOff, { className: "size-7" })
					})]
				})
			]
		})
	});
}
function Input({ className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
		className: cn("h-11 w-full rounded-md bg-elevated px-3 text-sm text-fg shadow-[var(--shadow-border)] outline-none transition-[box-shadow] duration-150 placeholder:text-faint focus-visible:shadow-[var(--shadow-border-hover)] focus-visible:ring-2 focus-visible:ring-accent/40", className),
		...props
	});
}
var STARTERS = [
	{
		label: "Make a banner",
		text: "Make a 16:9 banner of what my business actually does. Use the first Facebook page and its category."
	},
	{
		label: "Fast video",
		text: "Make a fast 6-second video of the actual work my business does — match the Facebook page category, not a generic brand film. Use the first page."
	},
	{
		label: "Find leads",
		text: "Find people and pages that might want our business. Filter Meta lead forms, Messenger chats, comments, and matching ad audiences."
	},
	{
		label: "Post 4× a day",
		text: "Set up 4 Facebook posts a day with fresh banners of the actual business on my first page."
	},
	{
		label: "Send a WhatsApp",
		text: "I want to send a WhatsApp message."
	}
];
var WELCOME = "Hey — I’m Abbie. Tell me what you need and I’ll handle it. I remember how you work, so you don’t have to start from zero every time.";
function Messenger() {
	const snapshotQ = useQuery({
		queryKey: ["abbie-snapshot"],
		queryFn: async () => {
			const r = await getSnapshot();
			if (!r.data) throw new Error(r.error || "Could not load Meta");
			return r.data;
		},
		retry: 2,
		staleTime: 8e3,
		refetchOnMount: "always"
	});
	const waQ = useQuery({
		queryKey: ["wa-status"],
		queryFn: () => getWhatsAppStatus(),
		refetchInterval: (q) => q.state.data?.status === "connected" ? 15e3 : 2e3,
		staleTime: 1e3
	});
	const [infoOpen, setInfoOpen] = (0, import_react.useState)(false);
	const [chatsOpen, setChatsOpen] = (0, import_react.useState)(false);
	const [leadsOpen, setLeadsOpen] = (0, import_react.useState)(false);
	const studioQ = useQuery({
		queryKey: ["studio-schedule"],
		queryFn: getStudioSchedule,
		enabled: infoOpen,
		staleTime: 2e4
	});
	const leadsQ = useQuery({
		queryKey: ["lead-board"],
		queryFn: async () => {
			const r = await getLeadBoard({ data: {} });
			if (r.error) throw new Error(r.error);
			return r.data;
		},
		enabled: infoOpen || leadsOpen,
		staleTime: 45e3
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
	const messages = conversations.find((c) => c.id === activeId)?.messages ?? conversations[0]?.messages ?? [];
	const [hydrated, setHydrated] = (0, import_react.useState)(false);
	const [draft, setDraft] = (0, import_react.useState)("");
	const [busy, setBusy] = (0, import_react.useState)(false);
	const [listening, setListening] = (0, import_react.useState)(false);
	const [callOpen, setCallOpen] = (0, import_react.useState)(false);
	const [callPhase, setCallPhase] = (0, import_react.useState)("connecting");
	const [callCaption, setCallCaption] = (0, import_react.useState)("");
	const [muted, setMuted] = (0, import_react.useState)(false);
	const scroller = (0, import_react.useRef)(null);
	const ta = (0, import_react.useRef)(null);
	const listenStop = (0, import_react.useRef)(null);
	const audioEl = (0, import_react.useRef)(null);
	const callGen = (0, import_react.useRef)(0);
	const inCall = (0, import_react.useRef)(false);
	const mutedRef = (0, import_react.useRef)(false);
	const recorder = (0, import_react.useRef)(null);
	(0, import_react.useEffect)(() => setHydrated(true), []);
	(0, import_react.useEffect)(() => {
		mutedRef.current = muted;
	}, [muted]);
	(0, import_react.useEffect)(() => {
		const el = scroller.current;
		if (!el) return;
		el.scrollTop = el.scrollHeight;
	}, [
		messages,
		busy,
		hydrated
	]);
	const visible = hydrated ? messages : [];
	async function send(text, voice) {
		const trimmed = text.trim();
		if (!trimmed || busy) return;
		const user = newMessage("user", trimmed);
		const pending = newMessage("assistant", "", { pending: true });
		add(user);
		add(pending);
		setBusy(true);
		setDraft("");
		if (ta.current) ta.current.style.height = "auto";
		const gen = callGen.current;
		try {
			const store = useChatStore.getState();
			const result = await runAgentTurn({ data: {
				messages: store.conversations.find((c) => c.id === store.activeId)?.messages.filter((m) => m.content && !m.pending).map((m) => ({
					role: m.role,
					content: m.content
				})) ?? [],
				voice,
				memory: store.memory.map((f) => ({
					category: f.category,
					text: f.text
				})),
				otherTitles: store.conversations.filter((c) => c.id !== store.activeId && c.title !== "New chat").slice(0, 10).map((c) => c.title)
			} });
			if (!result.ok) {
				patch(pending.id, {
					pending: false,
					error: result.error,
					content: result.error
				});
				if (voice) toast.error(result.error);
				return;
			}
			patch(pending.id, {
				pending: false,
				content: result.text,
				actions: result.actions
			});
			if (result.memoryUpdates?.length) {
				const adds = result.memoryUpdates.filter((u) => u.action === "add");
				const drops = result.memoryUpdates.filter((u) => u.action === "remove");
				if (adds.length) remember(adds);
				for (const d of drops) forget(d.text);
			}
			snapshotQ.refetch();
			waQ.refetch();
			studioQ.refetch();
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
				content: "Something went wrong. Try again in a moment."
			});
		} finally {
			setBusy(false);
			if (inCall.current && gen === callGen.current && !mutedRef.current) queueMicrotask(() => startCallListen());
			else if (inCall.current && gen === callGen.current) {
				setCallPhase("listening");
				setCallCaption("");
			}
		}
	}
	function stopListen() {
		listenStop.current?.();
		listenStop.current = null;
		if (recorder.current && recorder.current.state !== "inactive") recorder.current.stop();
		recorder.current = null;
		setListening(false);
	}
	function startCallListen() {
		if (!inCall.current || mutedRef.current) return;
		stopListen();
		setCallPhase("listening");
		setCallCaption("");
		beginListen({
			onInterim: (t) => {
				if (inCall.current) setCallCaption(t);
			},
			onFinal: (t) => {
				if (!inCall.current) return;
				setCallCaption(t);
				setCallPhase("thinking");
				send(t, true);
			},
			onEmpty: () => {
				if (inCall.current && !mutedRef.current) startCallListen();
			}
		});
	}
	function beginListen(opts) {
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
				}
			});
			listenStop.current = handle.stop;
			return;
		}
		startMediaListen(opts);
	}
	async function startMediaListen(opts) {
		try {
			const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
			const rec = new MediaRecorder(stream);
			const chunks = [];
			rec.ondataavailable = (e) => {
				if (e.data.size) chunks.push(e.data);
			};
			rec.onstop = async () => {
				stream.getTracks().forEach((t) => t.stop());
				setListening(false);
				recorder.current = null;
				const blob = new Blob(chunks, { type: rec.mimeType || "audio/webm" });
				if (blob.size < 64) {
					opts.onEmpty();
					return;
				}
				const buf = await blob.arrayBuffer();
				const bytes = new Uint8Array(buf);
				let binary = "";
				const chunk = 32768;
				for (let i = 0; i < bytes.length; i += chunk) binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
				const out = await transcribeAudio({ data: {
					audioBase64: btoa(binary),
					mime: blob.type || "audio/webm"
				} });
				if (out.ok) opts.onFinal(out.text);
				else {
					toast.error(out.error);
					opts.onEmpty();
				}
			};
			recorder.current = rec;
			rec.start();
			listenStop.current = () => {
				if (rec.state !== "inactive") rec.stop();
			};
			window.setTimeout(() => {
				if (rec.state === "recording") rec.stop();
			}, 8e3);
		} catch {
			setListening(false);
			toast.error("Microphone permission is blocked.");
			opts.onEmpty();
		}
	}
	async function startCall() {
		if (callOpen) return;
		inCall.current = true;
		callGen.current += 1;
		const gen = callGen.current;
		setCallOpen(true);
		setMuted(false);
		mutedRef.current = false;
		setCallPhase("connecting");
		setCallCaption("");
		try {
			const greet = await speakGreeting();
			if (!inCall.current || gen !== callGen.current) return;
			if (greet.ok) {
				setCallPhase("speaking");
				setCallCaption("Hey, it’s Abbie. Tell me what you need — WhatsApp, a page post, a banner, a paused ads campaign — and I’ll take it from there.");
				const played = playBase64Mp3(greet.audio);
				audioEl.current = played.el;
				await played.done;
			}
		} catch {}
		if (inCall.current && gen === callGen.current && !mutedRef.current) startCallListen();
	}
	function hangup() {
		inCall.current = false;
		callGen.current += 1;
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
		if (next) {
			stopListen();
			setCallPhase("listening");
			setCallCaption("");
		} else if (inCall.current && !busy) startCallListen();
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
				send(t, true);
			},
			onEmpty: () => {}
		});
	}
	function onSubmit(e) {
		e?.preventDefault?.();
		send(draft, false);
	}
	function openLeads() {
		setLeadsOpen(true);
		leadsQ.refetch();
	}
	function onStarter(label, text) {
		if (label === "Find leads") {
			openLeads();
			return;
		}
		send(text, false);
	}
	const snapshot = snapshotQ.data ?? null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex h-dvh min-h-0 bg-bg text-fg",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "flex min-w-0 flex-1 flex-col bg-bg",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
						className: "flex h-14 shrink-0 items-center gap-1 border-b border-border px-1.5 sm:px-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconBtn, {
								label: "Open chats",
								onClick: () => setChatsOpen(true),
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Menu, { className: "size-6" })
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "relative",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AbbieAvatar, { size: 36 }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full border-2 border-bg bg-active" })]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "min-w-0 flex-1 pl-1",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "truncate text-[0.9375rem] font-semibold leading-tight",
									children: "Abbie"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "truncate text-[0.75rem] text-active",
									children: "Active now"
								})]
							}),
							waQ.data?.status !== "connected" && !waQ.data?.saved && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: () => setInfoOpen(true),
								className: "hidden h-9 shrink-0 items-center rounded-full bg-elevated px-3 text-xs font-medium text-accent sm:flex",
								children: "Link WhatsApp"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconBtn, {
								label: "Call Abbie",
								onClick: () => void startCall(),
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Phone, { className: "size-5" })
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconBtn, {
								label: "Leads",
								onClick: openLeads,
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Users, { className: "size-5" })
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconBtn, {
								label: "Account details",
								onClick: () => setInfoOpen(true),
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Info, { className: "size-5" })
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						ref: scroller,
						className: "min-h-0 flex-1 overflow-y-auto px-3 py-4 sm:px-6",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "mb-5 text-center text-[0.75rem] text-faint",
								children: ["Today · ", (/* @__PURE__ */ new Date()).toLocaleTimeString(void 0, {
									hour: "numeric",
									minute: "2-digit"
								})]
							}),
							visible.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "msg-enter mx-auto max-w-md",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(IncomingBubble, { text: WELCOME }),
									waQ.data?.status !== "connected" && waQ.data?.saved && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "mt-3 ml-11 max-w-xs rounded-lg bg-elevated px-3 py-3",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-sm font-medium",
											children: "WhatsApp"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
											className: "mt-1 text-xs leading-snug text-muted",
											children: [
												"Reconnecting",
												waQ.data.userPhone ? ` ${waQ.data.userPhone}` : " your linked phone",
												"… You won’t need to scan again."
											]
										})]
									}),
									waQ.data?.status !== "connected" && !waQ.data?.saved && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "mt-3 ml-11 max-w-xs rounded-lg bg-elevated px-3 py-3",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "text-sm font-medium",
												children: "Link WhatsApp"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "mt-1 text-xs leading-snug text-muted",
												children: "WhatsApp → Linked devices → Link a device"
											}),
											waQ.data?.qrDataUrl ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
												src: waQ.data.qrDataUrl,
												alt: "WhatsApp QR code",
												width: 224,
												height: 224,
												className: "mx-auto mt-3 size-56 rounded-md bg-accent-fg p-2"
											}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "mt-3 text-sm text-muted",
												children: waQ.data?.status === "error" ? waQ.data.error || "Could not start WhatsApp" : "Preparing a QR…"
											}),
											waQ.data?.pairingCode && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "mt-3 text-center font-mono text-xl tracking-widest",
												children: waQ.data.pairingCode
											}),
											waQ.data?.error && waQ.data.status !== "error" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "mt-2 text-xs text-danger",
												children: waQ.data.error
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
												type: "button",
												onClick: () => setInfoOpen(true),
												className: "mt-3 h-11 w-full rounded-md bg-subtle text-sm font-medium text-muted hover:text-fg",
												children: "Pairing code instead"
											})
										]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "mt-3 flex flex-wrap gap-2 pl-11",
										children: STARTERS.map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											type: "button",
											onClick: () => onStarter(s.label, s.text),
											className: "h-9 rounded-full border border-accent/40 px-3.5 text-sm font-medium text-accent transition-colors duration-150 hover:bg-accent/10",
											children: s.label
										}, s.label))
									})
								]
							}),
							visible.map((m, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MessageRow, {
								msg: m,
								showAvatar: m.role === "assistant" && visible[i - 1]?.role !== "assistant"
							}, m.id))
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
						onSubmit,
						className: "shrink-0 border-t border-border px-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 sm:px-3",
						children: [visible.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mb-1.5 flex gap-2 overflow-x-auto px-1 pb-0.5",
							children: STARTERS.slice(0, 3).map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								disabled: busy,
								onClick: () => onStarter(s.label, s.text),
								className: "h-8 shrink-0 rounded-full border border-accent/40 px-3 text-xs font-medium text-accent transition-colors duration-150 hover:bg-accent/10 disabled:opacity-40",
								children: s.label
							}, s.label))
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-end gap-1.5",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconBtn, {
									label: "Account details",
									onClick: () => setInfoOpen(true),
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "size-6" })
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "flex min-w-0 flex-1 items-end rounded-full bg-elevated px-4 py-1.5",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
										ref: ta,
										rows: 1,
										value: draft,
										placeholder: listening ? "Listening…" : "Aa",
										suppressHydrationWarning: true,
										onChange: (e) => {
											setDraft(e.target.value);
											const el = e.target;
											el.style.height = "auto";
											el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
										},
										onKeyDown: (e) => {
											if (e.key === "Enter" && !e.shiftKey) {
												e.preventDefault();
												onSubmit();
											}
										},
										className: "max-h-28 min-h-9 w-full resize-none bg-transparent py-1.5 text-[0.9375rem] text-fg outline-none placeholder:text-faint"
									})
								}),
								draft.trim() ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconBtn, {
									label: "Send",
									onClick: () => onSubmit(),
									tone: "accent",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SendHorizontal, { className: "size-5" })
								}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconBtn, {
									label: listening ? "Stop listening" : "Voice message",
									onClick: onMicComposer,
									tone: listening ? "accent" : "plain",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mic, { className: "size-6" })
								})
							]
						})]
					})
				]
			}),
			chatsOpen && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChatDrawer, {
				conversations: [...conversations].sort((a, b) => b.updatedAt - a.updatedAt),
				activeId,
				waLabel: waQ.data?.status === "connected" ? `WhatsApp · ${waQ.data.userPhone ?? waQ.data.userName ?? "linked"}` : waQ.data?.saved ? `WhatsApp · reconnecting${waQ.data.userPhone ? ` ${waQ.data.userPhone}` : ""}` : waQ.data?.status === "qr" ? "WhatsApp · scan QR to link" : snapshot ? `Pages · ${snapshot.operator}` : snapshotQ.isError ? "Meta is unreachable right now" : "Connecting…",
				onClose: () => setChatsOpen(false),
				onNew: () => {
					newChat();
					setChatsOpen(false);
				},
				onSelect: (id) => {
					selectChat(id);
					setChatsOpen(false);
				},
				onDelete: deleteChat
			}),
			leadsOpen && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LeadsDrawer, {
				board: leadsQ.data ?? null,
				error: leadsQ.error instanceof Error ? leadsQ.error.message : null,
				loading: leadsQ.isLoading || leadsQ.isFetching,
				link: waQ.data ?? null,
				onClose: () => setLeadsOpen(false),
				onReply: async (pageId, recipientId, text, phone, closed) => {
					if (!closed) {
						const result = await sendReply({ data: {
							pageId,
							recipientId,
							text
						} });
						if (result.ok) return {
							ok: true,
							message: result.message
						};
						if (result.extra?.reason !== "window") return {
							ok: false,
							message: result.message
						};
					}
					if (phone.replace(/\D/g, "").length < 8) return {
						ok: false,
						needsPhone: true,
						message: "Messenger closed this chat. Add their WhatsApp number — it sends from your phone."
					};
					if (waQ.data?.status !== "connected") return {
						ok: false,
						needsLink: true,
						message: "Scan the code. This message sends the moment WhatsApp links."
					};
					const wa = await sendWhatsAppMessage({ data: {
						to: phone,
						text
					} });
					return wa.ok ? {
						ok: true,
						message: wa.message
					} : {
						ok: false,
						needsPhone: true,
						message: wa.message
					};
				}
			}),
			infoOpen && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(InfoPanel, {
				snapshot,
				error: snapshotQ.error instanceof Error ? snapshotQ.error.message : null,
				wa: waQ.data ?? null,
				studio: studioQ.data?.data ?? null,
				leads: leadsQ.data ?? null,
				leadsError: leadsQ.error instanceof Error ? leadsQ.error.message : null,
				onClose: () => setInfoOpen(false),
				onClear: () => {
					clear();
					setInfoOpen(false);
				},
				onLogoutWa: async () => {
					await logoutWhatsAppLink();
					waQ.refetch();
				},
				onOpenLeads: () => {
					setInfoOpen(false);
					openLeads();
				},
				onPauseCampaign: async (id) => {
					await pauseStudioCampaign({ data: { id } });
					studioQ.refetch();
				},
				onPair: async (phone) => {
					await requestWhatsAppPairing({ data: { phone } });
					waQ.refetch();
				}
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CallOverlay, {
				open: callOpen,
				phase: callPhase,
				caption: callCaption,
				muted,
				onHangup: hangup,
				onToggleMute: toggleMute
			})
		]
	});
}
function ChatDrawer({ conversations, activeId, waLabel, onClose, onNew, onSelect, onDelete }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "fixed inset-0 z-40 flex bg-bg/60",
		onClick: onClose,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
			className: "drawer-in flex h-full w-full max-w-sm flex-col bg-surface shadow-[var(--shadow-border)]",
			onClick: (e) => e.stopPropagation(),
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex h-14 items-center gap-1 px-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconBtn, {
							label: "Close chats",
							onClick: onClose,
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "size-6" })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
							className: "min-w-0 flex-1 font-display text-xl font-semibold tracking-tight",
							children: "Chats"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconBtn, {
							label: "New chat",
							onClick: onNew,
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SquarePen, { className: "size-5" })
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "min-h-0 flex-1 overflow-y-auto",
					children: conversations.map((c) => {
						const preview = c.messages[c.messages.length - 1]?.content || "Empty chat";
						const active = c.id === activeId;
						return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: cn("flex items-stretch", active && "bg-elevated/80"),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								onClick: () => onSelect(c.id),
								className: "flex min-w-0 flex-1 items-center gap-3 px-4 py-3 text-left",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "relative shrink-0",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AbbieAvatar, { size: 48 }), active && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "absolute bottom-0 right-0 size-3 rounded-full border-2 border-surface bg-active" })]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "min-w-0 flex-1",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "flex items-center justify-between gap-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "truncate text-[0.9375rem] font-semibold",
											children: c.title
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "shrink-0 text-[0.6875rem] text-faint",
											children: formatWhen(c.updatedAt)
										})]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "mt-0.5 block truncate text-sm text-muted",
										children: preview
									})]
								})]
							}), c.messages.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								"aria-label": "Delete chat",
								onClick: () => onDelete(c.id),
								className: "flex size-11 shrink-0 items-center justify-center self-center text-faint hover:text-danger",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "size-4" })
							})]
						}, c.id);
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "border-t border-border px-4 py-3 text-[0.75rem] leading-relaxed text-faint",
					children: waLabel
				})
			]
		})
	});
}
function formatWhen(ts) {
	const d = new Date(ts);
	const now = /* @__PURE__ */ new Date();
	if (d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate()) return d.toLocaleTimeString(void 0, {
		hour: "numeric",
		minute: "2-digit"
	});
	return d.toLocaleDateString(void 0, {
		month: "short",
		day: "numeric"
	});
}
function IconBtn({ label, onClick, children, tone = "plain" }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		type: "button",
		"aria-label": label,
		onClick,
		className: cn("flex size-11 shrink-0 items-center justify-center rounded-full transition-colors duration-150", tone === "accent" ? "text-accent" : "text-accent hover:bg-elevated"),
		children
	});
}
function IncomingBubble({ text }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex items-end gap-2",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AbbieAvatar, { size: 28 }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "max-w-[min(78%,28rem)] rounded-lg rounded-bl-sm bg-bubble-in px-3.5 py-2 text-sm leading-snug break-words text-fg",
			children: text
		})]
	});
}
function MessageRow({ msg, showAvatar }) {
	const outgoing = msg.role === "user";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: cn("msg-enter mb-1.5 flex", outgoing ? "justify-end" : "items-end gap-2"),
		children: [!outgoing && (showAvatar ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AbbieAvatar, { size: 28 }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "size-7 shrink-0" })), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: cn("max-w-[min(78%,28rem)]", outgoing && "items-end"),
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: cn("rounded-lg px-3.5 py-2 text-sm leading-snug break-words whitespace-pre-wrap", outgoing ? "rounded-br-sm bg-bubble-out text-accent-fg" : "rounded-bl-sm bg-bubble-in text-fg", msg.error && "bg-danger/20 text-fg"),
				children: msg.pending ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TypingDots, {}) : msg.content
			}), msg.actions.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-1.5 space-y-1.5",
				children: msg.actions.map((a, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ActionChip, {
					action: a,
					messageId: msg.id,
					index: i
				}, `${msg.id}-${i}`))
			})]
		})]
	});
}
function TypingDots() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
		className: "inline-flex h-4 items-center gap-1 px-1",
		"aria-label": "Abbie is typing",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "typing-dot size-1.5 rounded-full bg-fg" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "typing-dot size-1.5 rounded-full bg-fg" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "typing-dot size-1.5 rounded-full bg-fg" })
		]
	});
}
function ActionChip({ action, messageId, index }) {
	const patch = useChatStore((s) => s.patch);
	const live = action;
	(0, import_react.useEffect)(() => {
		if (!action.jobId || action.mediaUrl) return;
		let stop = false;
		const run = async () => {
			for (let i = 0; i < 28 && !stop; i += 1) {
				await new Promise((r) => setTimeout(r, 3e3));
				if (stop) return;
				const result = await pollStudioJob({ data: { id: action.jobId } });
				if (stop) return;
				const store = useChatStore.getState();
				const msg = (store.conversations.find((c) => c.id === store.activeId)?.messages ?? []).find((m) => m.id === messageId);
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
						mediaKind: result.mediaKind
					};
					patch(messageId, { actions: next });
					return;
				}
				if (result.status === "failed") {
					next[index] = {
						...current,
						ok: false,
						title: "Video failed",
						detail: result.error || "Could not finish the video."
					};
					patch(messageId, { actions: next });
					return;
				}
			}
		};
		run();
		return () => {
			stop = true;
		};
	}, [
		action.jobId,
		action.mediaUrl,
		messageId,
		index,
		patch
	]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex items-start gap-2 rounded-md bg-elevated px-3 py-2",
		children: [live.ok ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "mt-0.5 size-4 shrink-0 text-success" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleAlert, { className: "mt-0.5 size-4 shrink-0 text-danger" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "min-w-0 flex-1",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm font-medium leading-snug",
					children: live.title
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs leading-snug text-muted",
					children: live.detail
				}),
				live.jobId && !live.mediaUrl && live.ok ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-xs text-faint",
					children: "Rendering…"
				}) : null,
				live.mediaUrl && live.mediaKind === "video" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("video", {
					src: live.mediaUrl,
					controls: true,
					playsInline: true,
					className: "mt-2 w-full rounded-md bg-subtle"
				}) : live.mediaUrl ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
					src: live.mediaUrl,
					alt: live.title,
					className: "mt-2 w-full rounded-md bg-subtle object-cover"
				}) : null,
				live.leads && live.leads.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LeadList, { leads: live.leads }) : null
			]
		})]
	});
}
function SOURCE_LABEL(source) {
	switch (source) {
		case "form": return "Lead form";
		case "messenger": return "Messenger";
		case "comment": return "Comment";
		case "mention": return "Tag";
		case "audience": return "Audience";
		case "page": return "Page";
	}
}
function LeadList({ leads }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
		className: "mt-2 space-y-2",
		children: leads.slice(0, 12).map((l) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
			className: "rounded-md bg-subtle px-2.5 py-2",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-baseline justify-between gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "truncate text-sm font-medium",
						children: l.name
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "shrink-0 text-xs tabular-nums text-faint",
						children: l.score
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-0.5 text-xs text-accent",
					children: [
						SOURCE_LABEL(l.source),
						l.pageName ? ` · ${l.pageName}` : "",
						l.audienceSize ? ` · ${l.audienceSize}` : ""
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-0.5 text-xs leading-snug text-muted",
					children: l.snippet || l.reason
				}),
				l.contact ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-0.5 text-xs text-faint",
					children: l.contact
				}) : null
			]
		}, l.id))
	});
}
var LEAD_FILTERS = [
	{
		id: "all",
		label: "All"
	},
	{
		id: "messenger",
		label: "Chats"
	},
	{
		id: "form",
		label: "Forms"
	},
	{
		id: "comment",
		label: "Comments"
	},
	{
		id: "page",
		label: "Pages"
	},
	{
		id: "audience",
		label: "Audiences"
	}
];
function LeadsDrawer({ board, error, loading, link, onClose, onReply }) {
	const [filter, setFilter] = (0, import_react.useState)("all");
	const [q, setQ] = (0, import_react.useState)("");
	const [openId, setOpenId] = (0, import_react.useState)(null);
	const leads = (0, import_react.useMemo)(() => {
		const needle = q.trim().toLowerCase();
		return (board?.leads ?? []).filter((l) => {
			if (filter !== "all" && l.source !== filter) return false;
			if (!needle) return true;
			return `${l.name} ${l.snippet} ${l.reason} ${l.pageName}`.toLowerCase().includes(needle);
		});
	}, [
		board,
		filter,
		q
	]);
	const people = leads.filter((l) => l.source !== "audience" && l.source !== "page").length;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "fixed inset-0 z-40 flex justify-end bg-bg/60",
		onClick: onClose,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
			className: "drawer-in flex h-full w-full max-w-md flex-col bg-surface shadow-[var(--shadow-border)]",
			onClick: (e) => e.stopPropagation(),
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex h-14 shrink-0 items-center gap-1 px-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconBtn, {
						label: "Close leads",
						onClick: onClose,
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "size-6" })
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "min-w-0 flex-1",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
							className: "font-display text-xl font-semibold tracking-tight",
							children: "Leads"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "truncate text-xs text-muted",
							children: loading && !board ? "Reading Meta…" : `${people} people · ${leads.filter((l) => l.source === "audience").length} audiences`
						})]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "shrink-0 space-y-2 px-3 pb-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						value: q,
						onChange: (e) => setQ(e.target.value),
						placeholder: "Filter by name or keyword",
						className: "h-11"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "flex gap-1.5 overflow-x-auto pb-0.5",
						children: LEAD_FILTERS.map((f) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: () => setFilter(f.id),
							className: cn("h-8 shrink-0 rounded-full px-3 text-xs font-medium", filter === f.id ? "bg-accent text-accent-fg" : "bg-elevated text-muted hover:text-fg"),
							children: f.label
						}, f.id))
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "min-h-0 flex-1 overflow-y-auto px-3 pb-8",
					children: [error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "px-1 py-4 text-sm text-muted",
						children: error
					}) : !board && loading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "px-1 py-4 text-sm text-muted",
						children: "Pulling chats, forms, and audiences…"
					}) : leads.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "px-1 py-4 text-sm text-muted",
						children: "Nothing matched. Meta only returns people who already engaged with your pages."
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
						className: "space-y-2",
						children: leads.map((l) => {
							const expanded = openId === l.id;
							const canReply = l.source === "messenger" && Boolean(l.participantId && l.pageId);
							return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
								className: "rounded-lg bg-elevated px-3 py-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									type: "button",
									onClick: () => setOpenId(expanded ? null : l.id),
									className: "w-full text-left",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "flex items-baseline justify-between gap-2",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "truncate text-sm font-semibold",
												children: l.name
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "shrink-0 text-xs tabular-nums text-faint",
												children: l.score
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "mt-0.5 block text-xs text-accent",
											children: [
												SOURCE_LABEL(l.source),
												l.pageName ? ` · ${l.pageName}` : "",
												l.audienceSize ? ` · ${l.audienceSize}` : ""
											]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "mt-1 block text-sm leading-snug text-muted",
											children: l.snippet || l.reason
										}),
										l.contact ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "mt-1 block text-xs text-faint",
											children: l.contact
										}) : null
									]
								}), expanded && canReply ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LeadReply, {
									name: l.name,
									closed: threadClosed(l.when),
									link,
									onSend: (text, phone) => onReply(l.pageId, l.participantId, text, phone, threadClosed(l.when))
								}) : expanded && l.source === "audience" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-2 text-xs leading-relaxed text-faint",
									children: "Use this interest in a paused Meta ads campaign. Ask Abbie to create one."
								}) : null]
							}, l.id);
						})
					}), board?.notes[1] ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-4 px-1 text-xs leading-relaxed text-faint",
						children: board.notes[1]
					}) : null]
				})
			]
		})
	});
}
function threadClosed(when) {
	if (!when) return true;
	const t = new Date(when).getTime();
	if (Number.isNaN(t)) return true;
	return Date.now() - t > 828e5;
}
function LeadReply({ name, closed, link, onSend }) {
	const [text, setText] = (0, import_react.useState)("");
	const [phone, setPhone] = (0, import_react.useState)("");
	const [sending, setSending] = (0, import_react.useState)(false);
	const [note, setNote] = (0, import_react.useState)(null);
	const [showPhone, setShowPhone] = (0, import_react.useState)(closed);
	const [showLink, setShowLink] = (0, import_react.useState)(false);
	const armed = (0, import_react.useRef)(false);
	const first = name.split(" ")[0] || name;
	const linked = link?.status === "connected";
	async function deliver(body, number) {
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
	(0, import_react.useEffect)(() => {
		if (!armed.current || !linked || sending) return;
		const body = text.trim();
		const number = phone.trim();
		if (!body || number.replace(/\D/g, "").length < 8) return;
		armed.current = false;
		deliver(body, number);
	}, [linked]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
		className: "mt-3 space-y-2",
		onSubmit: (e) => {
			e.preventDefault();
			const body = text.trim();
			if (!body || sending) return;
			deliver(body, phone);
		},
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
					value: text,
					onChange: (e) => setText(e.target.value),
					placeholder: `Message ${first}`,
					className: "h-11"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "submit",
					disabled: sending || !text.trim(),
					className: "h-11 shrink-0 rounded-md bg-accent px-3 text-sm font-medium text-accent-fg disabled:opacity-40",
					children: sending ? "Sending…" : "Send"
				})]
			}),
			showPhone ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
				value: phone,
				onChange: (e) => setPhone(e.target.value),
				placeholder: "Their WhatsApp number",
				inputMode: "tel",
				className: "h-11"
			}) : null,
			showLink && !linked ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "rounded-md bg-subtle px-3 py-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs leading-relaxed text-muted",
						children: "WhatsApp → Linked devices → Link a device"
					}),
					link?.qrDataUrl ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
						src: link.qrDataUrl,
						alt: "WhatsApp QR code",
						width: 224,
						height: 224,
						className: "mx-auto mt-3 size-44 rounded-md bg-accent-fg p-2"
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 text-xs text-faint",
						children: link?.status === "connecting" ? "Preparing the code…" : "Starting WhatsApp…"
					}),
					link?.pairingCode ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 text-center font-mono text-lg tracking-widest text-fg",
						children: link.pairingCode
					}) : null
				]
			}) : null,
			note ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-xs leading-relaxed text-muted",
				children: note
			}) : null
		]
	});
}
function InfoPanel({ snapshot, error, wa, studio, leads, leadsError, onClose, onOpenLeads, onClear, onLogoutWa, onPair, onPauseCampaign }) {
	const [pairPhone, setPairPhone] = (0, import_react.useState)("");
	const [pairing, setPairing] = (0, import_react.useState)(false);
	const lines = (0, import_react.useMemo)(() => {
		if (!snapshot) return [];
		return [
			{
				label: "Operator",
				items: [snapshot.operator]
			},
			{
				label: "Pages",
				items: snapshot.pages.map((p) => p.name)
			},
			{
				label: "Ad accounts",
				items: snapshot.adAccounts.map((a) => `${a.name} · ${a.currency}`)
			}
		];
	}, [snapshot]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "fixed inset-0 z-40 flex justify-end bg-bg/60",
		onClick: onClose,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
			className: "flex h-full w-full max-w-sm flex-col bg-surface shadow-[var(--shadow-border)]",
			onClick: (e) => e.stopPropagation(),
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex h-14 items-center justify-between px-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm font-semibold",
					children: "Accounts"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					"aria-label": "Close",
					onClick: onClose,
					className: "flex size-11 items-center justify-center rounded-full text-muted hover:text-fg",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "size-5" })
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "min-h-0 flex-1 space-y-5 overflow-y-auto px-4 pb-8",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mb-1.5 text-xs font-medium uppercase tracking-wider text-faint",
						children: "WhatsApp"
					}), wa && (wa.status === "connected" || wa.saved) ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "rounded-lg bg-elevated px-3 py-3",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-sm font-medium",
								children: wa.userName ?? "Linked"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-xs text-muted",
								children: wa.status === "connected" ? wa.userPhone ?? "Personal WhatsApp" : `Reconnecting${wa.userPhone ? ` ${wa.userPhone}` : "…"}`
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-2 text-xs leading-relaxed text-faint",
								children: "Session is saved. Abbie reconnects after a restart — no new QR unless you unlink."
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: () => void onLogoutWa(),
								className: "mt-3 h-11 w-full rounded-md bg-subtle text-sm font-medium text-muted hover:text-fg",
								children: "Unlink"
							})
						]
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "rounded-lg bg-elevated px-3 py-3",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-sm leading-snug text-fg",
								children: "Scan with your phone. WhatsApp → Linked devices → Link a device."
							}),
							wa?.qrDataUrl ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
								src: wa.qrDataUrl,
								alt: "WhatsApp QR code",
								width: 280,
								height: 280,
								className: "mx-auto mt-3 size-56 rounded-md bg-accent-fg p-2"
							}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-3 text-sm text-muted",
								children: wa?.status === "connecting" ? "Preparing a QR…" : "Starting WhatsApp…"
							}),
							wa?.pairingCode && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-3 text-center font-mono text-xl tracking-widest text-fg",
								children: wa.pairingCode
							}),
							wa?.error && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-2 text-xs text-danger",
								children: wa.error
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
								className: "mt-3 flex gap-2",
								onSubmit: (e) => {
									e.preventDefault();
									setPairing(true);
									onPair(pairPhone).finally(() => setPairing(false));
								},
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									value: pairPhone,
									onChange: (e) => setPairPhone(e.target.value),
									placeholder: "Or enter your number",
									inputMode: "tel",
									className: "h-11"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "submit",
									disabled: pairing || pairPhone.replace(/\D/g, "").length < 8,
									className: "h-11 shrink-0 rounded-md bg-accent px-3 text-sm font-medium text-accent-fg disabled:opacity-40",
									children: "Code"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-2 text-xs leading-relaxed text-faint",
								children: "Number with country code, no plus. After you scan once, the session is saved."
							})
						]
					})] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mb-1.5 text-xs font-medium uppercase tracking-wider text-faint",
						children: "Leads"
					}), leadsError ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-muted",
						children: leadsError
					}) : !leads ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-muted",
						children: "Reading Meta…"
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "rounded-lg bg-elevated px-3 py-3",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "text-sm",
								children: [
									leads.leads.filter((l) => l.source !== "audience" && l.source !== "page").length,
									" ",
									"people · ",
									leads.counts.audience ?? 0,
									" audiences"
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-1 text-xs leading-relaxed text-faint",
								children: "Ranked from chats, forms, comments, and matching ad interests."
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: onOpenLeads,
								className: "mt-3 h-11 w-full rounded-md bg-accent text-sm font-medium text-accent-fg",
								children: "Open leads"
							})
						]
					})] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mb-1.5 text-xs font-medium uppercase tracking-wider text-faint",
						children: "4× daily posts"
					}), !studio?.campaigns.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-muted",
						children: "Ask Abbie to schedule banners four times a day."
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "space-y-3",
						children: studio.campaigns.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "rounded-lg bg-elevated px-3 py-3",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-sm font-medium",
									children: c.pageName
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-xs text-muted",
									children: c.theme
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
									className: "mt-2 space-y-2",
									children: studio.slots.filter((s) => s.campaignId === c.id).slice(0, 4).map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
										className: "flex gap-2",
										children: [s.mediaUrl ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
											src: s.mediaUrl,
											alt: "",
											className: "size-11 shrink-0 rounded-md bg-subtle object-cover"
										}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "size-11 shrink-0 rounded-md bg-subtle" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "min-w-0 text-xs text-muted",
											children: [new Date(s.publishAt).toLocaleString(void 0, {
												timeZone: c.timezone || "Asia/Manila",
												weekday: "short",
												month: "short",
												day: "numeric",
												hour: "numeric",
												minute: "2-digit"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "block",
												children: s.status
											})]
										})]
									}, s.id))
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									onClick: () => void onPauseCampaign(c.id),
									className: "mt-3 h-11 w-full rounded-md bg-subtle text-sm font-medium text-muted hover:text-fg",
									children: "Pause schedule"
								})
							]
						}, c.id))
					})] }),
					error && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-danger",
						children: error
					}),
					lines.map((g) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mb-1.5 text-xs font-medium uppercase tracking-wider text-faint",
						children: g.label
					}), g.items.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-muted",
						children: "None connected"
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
						className: "space-y-1",
						children: g.items.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
							className: "text-sm text-fg",
							children: item
						}, item))
					})] }, g.label)),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: onClear,
						className: "mt-4 h-11 w-full rounded-md bg-elevated text-sm font-medium text-muted hover:text-fg",
						children: "Clear conversation"
					})
				]
			})]
		})
	});
}
function Home() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Messenger, {});
}
//#endregion
export { Home as component };
