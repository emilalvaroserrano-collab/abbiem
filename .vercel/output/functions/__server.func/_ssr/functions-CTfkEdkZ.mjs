import { t as createServerFn } from "./ssr.mjs";
import { t as createServerRpc } from "./createServerRpc-A6pJPYTF.mjs";
import { n as array, o as object, s as string } from "../_libs/zod.mjs";
import { i as executeTool, n as buildSystemPrompt, r as ensureSecrets, t as AGENT_TOOLS } from "./tools-aZUoFc6I.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/functions-CTfkEdkZ.js
var MODEL = "models/gemini-3.8-live";
var memorySchema = array(object({
	category: string().max(24),
	text: string().max(240)
})).max(48).optional();
var openLiveSession_createServerFn_handler = createServerRpc({
	id: "8232f19314eae57315397fca5e2f8a509ec4e3fcecd5419b5e4e83030de71b65",
	name: "openLiveSession",
	filename: "src/lib/voice/functions.ts"
}, (opts) => openLiveSession.__executeServer(opts));
var openLiveSession = createServerFn({ method: "POST" }).validator(object({
	memory: memorySchema,
	otherTitles: array(string().max(80)).max(12).optional()
})).handler(openLiveSession_createServerFn_handler, async ({ data }) => {
	ensureSecrets();
	const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
	if (!apiKey) return {
		ok: false,
		error: "Voice isn’t connected. A Gemini key is missing."
	};
	const { fetchOperatorSnapshot } = await import("./graph.server-CjL3s8xK.mjs");
	const { GoogleGenAI } = await import("../_libs/@google/genai.mjs").then((n) => n.t);
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
	const systemInstruction = buildSystemPrompt(snapshot, true, (data.memory ?? []).map((m) => ({
		category: m.category,
		text: m.text
	})), data.otherTitles ?? []);
	const client = new GoogleGenAI({ apiKey });
	let token;
	try {
		token = await client.authTokens.create({ config: {
			uses: 1,
			expireTime: new Date(Date.now() + 18e5).toISOString(),
			newSessionExpireTime: new Date(Date.now() + 6e4).toISOString()
		} });
	} catch (err) {
		const raw = err instanceof Error ? err.message : "";
		return {
			ok: false,
			error: /suspended|PERMISSION_DENIED|403/i.test(raw) ? "Google suspended this Gemini key, so the live call can’t start." : "Gemini wouldn’t open a live session."
		};
	}
	const name = token.name;
	if (!name) return {
		ok: false,
		error: "Gemini didn’t hand back a live session."
	};
	return {
		ok: true,
		token: name,
		model: MODEL,
		systemInstruction,
		tools: AGENT_TOOLS.map((tool) => ({
			name: tool.function.name,
			description: tool.function.description,
			parameters: tool.function.parameters
		}))
	};
});
var runVoiceTool_createServerFn_handler = createServerRpc({
	id: "d9eee2a0db3f8293ec019f23a9d3309859fc308976df1c7dfa369267a058977a",
	name: "runVoiceTool",
	filename: "src/lib/voice/functions.ts"
}, (opts) => runVoiceTool.__executeServer(opts));
var runVoiceTool = createServerFn({ method: "POST" }).validator(object({
	name: string().min(1).max(64),
	args: string().max(8e3).optional()
})).handler(runVoiceTool_createServerFn_handler, async ({ data }) => {
	const { fetchOperatorSnapshot } = await import("./graph.server-CjL3s8xK.mjs");
	const snapshot = await fetchOperatorSnapshot();
	const actions = [];
	const memoryUpdates = [];
	return {
		result: await executeTool(data.name, data.args || "{}", snapshot, actions, memoryUpdates),
		actions,
		memoryUpdates
	};
});
//#endregion
export { openLiveSession_createServerFn_handler, runVoiceTool_createServerFn_handler };
