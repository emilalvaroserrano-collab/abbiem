import { t as createServerFn } from "./ssr.mjs";
import { t as createServerRpc } from "./createServerRpc-A6pJPYTF.mjs";
import { n as array, o as object, r as boolean, s as string, t as _enum } from "../_libs/zod.mjs";
import { i as executeTool, n as buildSystemPrompt, r as ensureSecrets, t as AGENT_TOOLS } from "./tools-aZUoFc6I.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/functions-DFLMO30f.js
var turnInput = object({
	messages: array(object({
		role: _enum(["user", "assistant"]),
		content: string().max(12e3),
		images: array(string().max(4e5)).max(4).optional()
	})).max(24),
	voice: boolean().optional(),
	memory: array(object({
		category: string().max(24),
		text: string().max(240)
	})).max(48).optional(),
	otherTitles: array(string().max(80)).max(12).optional()
});
var OLLAMA_MODEL = () => process.env.OLLAMA_MODEL || "gemma4:31b";
function toolArgs(value) {
	if (typeof value === "string") return value;
	try {
		return JSON.stringify(value ?? {});
	} catch {
		return "{}";
	}
}
async function completeTurn(messages, voice, memory, otherTitles) {
	ensureSecrets();
	const apiKey = process.env.OLLAMA_CLOUD_API_KEY || process.env.OLLAMA_API_KEY;
	if (!apiKey) return {
		ok: false,
		error: "Chat isn’t connected. OLLAMA_CLOUD_API_KEY is missing."
	};
	const { fetchOperatorSnapshot } = await import("./graph.server-CjL3s8xK.mjs");
	const snapshot = await fetchOperatorSnapshot().catch(() => ({
		operator: "Connected operator",
		pages: [],
		instagram: [],
		adAccounts: [],
		inboxUnread: 0,
		whatsappLink: {
			status: "idle",
			userName: null,
			userPhone: null,
			error: null,
			saved: false
		}
	}));
	const convo = [{
		role: "system",
		content: buildSystemPrompt(snapshot, voice, memory, otherTitles)
	}, ...messages.map((m) => ({
		role: m.role,
		content: m.content,
		...m.images?.length ? { images: m.images.map((image) => image.replace(/^data:image\/[a-zA-Z0-9.+-]+;base64,/, "")) } : {}
	}))];
	const actions = [];
	const memoryUpdates = [];
	let guard = 0;
	while (guard++ < 5) {
		const res = await fetch("https://ollama.com/api/chat", {
			method: "POST",
			headers: {
				Authorization: `Bearer ${apiKey}`,
				"Content-Type": "application/json"
			},
			body: JSON.stringify({
				model: OLLAMA_MODEL(),
				messages: convo,
				tools: AGENT_TOOLS,
				stream: false,
				options: {
					temperature: voice ? .55 : .62,
					num_predict: voice ? 360 : 720
				}
			})
		});
		if (!res.ok) return {
			ok: false,
			error: res.status === 429 ? "Give me a second — I’m catching my breath." : res.status === 401 ? "Ollama rejected the cloud key." : `Something’s off on my side (${res.status}). Try that again.`
		};
		const msg = (await res.json()).message;
		if (!msg) return {
			ok: false,
			error: "I blanked for a second. Say that again?"
		};
		const calls = (msg.tool_calls ?? []).filter((call) => call.function?.name).map((call) => ({ function: {
			name: call.function.name,
			arguments: toolArgs(call.function.arguments)
		} }));
		if (calls.length) {
			convo.push({
				role: "assistant",
				content: typeof msg.content === "string" ? msg.content : "",
				tool_calls: msg.tool_calls
			});
			for (const call of calls) {
				const result = await executeTool(call.function.name, call.function.arguments, snapshot, actions, memoryUpdates);
				convo.push({
					role: "tool",
					name: call.function.name,
					tool_name: call.function.name,
					content: result
				});
			}
			continue;
		}
		return {
			ok: true,
			text: (typeof msg.content === "string" ? msg.content : "").trim() || (actions.length ? "Done." : "I’m here."),
			actions,
			audio: null,
			memoryUpdates
		};
	}
	return {
		ok: false,
		error: "I got tangled running that. Try a simpler ask."
	};
}
var runAgentTurn_createServerFn_handler = createServerRpc({
	id: "6d7cd82177e6d276e369ea378945fba9dd62ee3623bfdeb5c7a7db1289fc6eb8",
	name: "runAgentTurn",
	filename: "src/lib/agent/functions.ts"
}, (opts) => runAgentTurn.__executeServer(opts));
var runAgentTurn = createServerFn({ method: "POST" }).validator(turnInput).handler(runAgentTurn_createServerFn_handler, async ({ data }) => {
	const trimmed = data.messages.map((m) => ({
		role: m.role,
		content: m.content.slice(0, 8e3),
		images: m.images?.slice(0, 4)
	})).filter((m) => m.content.trim() || m.images && m.images.length > 0).slice(-18);
	if (!trimmed.length || trimmed[trimmed.length - 1]?.role !== "user") return {
		ok: false,
		error: "Say something first."
	};
	try {
		return await completeTurn(trimmed, Boolean(data.voice), (data.memory ?? []).map((m) => ({
			category: m.category,
			text: m.text
		})), data.otherTitles ?? []);
	} catch (e) {
		return {
			ok: false,
			error: e instanceof Error ? e.message : "That didn’t land. Try again."
		};
	}
});
var getSnapshot_createServerFn_handler = createServerRpc({
	id: "928e2a8bed6d48264ecc871971a822a243035834e591947a563ffbca75b9e9a4",
	name: "getSnapshot",
	filename: "src/lib/agent/functions.ts"
}, (opts) => getSnapshot.__executeServer(opts));
var getSnapshot = createServerFn({ method: "GET" }).handler(getSnapshot_createServerFn_handler, async () => {
	try {
		const { fetchOperatorSnapshot } = await import("./graph.server-CjL3s8xK.mjs");
		return {
			data: await fetchOperatorSnapshot(),
			error: null
		};
	} catch (e) {
		return {
			data: null,
			error: e instanceof Error ? e.message : "Could not load Meta accounts."
		};
	}
});
//#endregion
export { getSnapshot_createServerFn_handler, runAgentTurn_createServerFn_handler };
