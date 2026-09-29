import { o as __toESM } from "../_runtime.mjs";
import { n as require_pino } from "../_libs/@whiskeysockets/baileys+[...].mjs";
import { t as require_lib } from "../_libs/qrcode.mjs";
import { mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
//#region node_modules/.nitro/vite/services/ssr/assets/baileys.server-BlSjz9yw.js
var import_pino = /* @__PURE__ */ __toESM(require_pino());
var import_lib = /* @__PURE__ */ __toESM(require_lib());
var g = globalThis;
var logger = (0, import_pino.default)({ level: "silent" });
var IDENTITY_FILE = "session.json";
function session() {
	if (!g.__ariaBaileys) g.__ariaBaileys = {
		sock: null,
		startPromise: null,
		shouldReconnect: true,
		generation: 0,
		hydrated: false,
		registered: false,
		status: "idle",
		qrDataUrl: null,
		pairingCode: null,
		userName: null,
		userPhone: null,
		error: null
	};
	else {
		const s = g.__ariaBaileys;
		if (typeof s.generation !== "number") s.generation = 0;
		if (typeof s.registered !== "boolean") s.registered = false;
		if (typeof s.hydrated !== "boolean") s.hydrated = false;
	}
	return g.__ariaBaileys;
}
function authDir() {
	const local = join(process.cwd(), ".data", "baileys");
	try {
		mkdirSync(local, { recursive: true });
		return local;
	} catch {
		const tmp = join("/tmp", "aria-baileys");
		mkdirSync(tmp, { recursive: true });
		return tmp;
	}
}
function phoneFromJid(jid) {
	if (!jid) return null;
	return (jid.split("@")[0] ?? "").split(":")[0] || null;
}
function digits(input) {
	return input.replace(/[^\d]/g, "");
}
function sleep(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}
function writeJson(path, data) {
	const tmp = `${path}.tmp`;
	writeFileSync(tmp, JSON.stringify(data));
	renameSync(tmp, path);
}
function readIdentity() {
	try {
		const raw = readFileSync(join(authDir(), IDENTITY_FILE), "utf8");
		const parsed = JSON.parse(raw);
		if (!parsed || typeof parsed !== "object") return null;
		const userName = typeof parsed.userName === "string" ? parsed.userName : null;
		const userPhone = typeof parsed.userPhone === "string" ? parsed.userPhone : null;
		if (!userName && !userPhone) return null;
		return {
			userName,
			userPhone
		};
	} catch {
		return null;
	}
}
function writeIdentity(id) {
	try {
		mkdirSync(authDir(), { recursive: true });
		writeJson(join(authDir(), IDENTITY_FILE), {
			userName: id.userName,
			userPhone: id.userPhone,
			at: Date.now()
		});
	} catch {}
}
function hasCredsFile() {
	try {
		readFileSync(join(authDir(), "creds.json"), "utf8");
		return true;
	} catch {
		return false;
	}
}
function peekRegistered() {
	try {
		const raw = readFileSync(join(authDir(), "creds.json"), "utf8");
		return JSON.parse(raw).registered === true;
	} catch {
		return false;
	}
}
function peekMeFromCreds() {
	try {
		const raw = readFileSync(join(authDir(), "creds.json"), "utf8");
		const parsed = JSON.parse(raw);
		const phone = phoneFromJid(parsed.me?.id);
		const name = parsed.me?.name ?? null;
		if (!phone && !name) return null;
		return {
			userName: name,
			userPhone: phone
		};
	} catch {
		return null;
	}
}
function applyIdentity(id) {
	if (!id) return;
	const s = session();
	if (id.userPhone) s.userPhone = id.userPhone;
	if (id.userName) s.userName = id.userName;
}
function persistIdentity() {
	const s = session();
	if (!s.registered && !s.userPhone && !s.userName) return;
	writeIdentity({
		userName: s.userName,
		userPhone: s.userPhone
	});
}
function hydrateFromDisk() {
	const s = session();
	if (s.hydrated) return;
	s.hydrated = true;
	if (!peekRegistered()) return;
	s.registered = true;
	applyIdentity(readIdentity() ?? peekMeFromCreds());
	if (s.status === "idle") s.status = "connecting";
}
function wipeAuth() {
	try {
		rmSync(authDir(), {
			recursive: true,
			force: true
		});
	} catch {}
}
function getStatus() {
	hydrateFromDisk();
	const s = session();
	return {
		status: s.status,
		qrDataUrl: s.registered ? null : s.qrDataUrl,
		pairingCode: s.registered ? null : s.pairingCode,
		userName: s.userName,
		userPhone: s.userPhone,
		error: s.error,
		saved: s.registered
	};
}
function getLinkSummary() {
	hydrateFromDisk();
	const s = session();
	return {
		status: s.status,
		userName: s.userName,
		userPhone: s.userPhone,
		error: s.error,
		saved: s.registered
	};
}
function ensureStarted() {
	hydrateFromDisk();
	startSocket();
}
async function waitForLink(timeoutMs) {
	hydrateFromDisk();
	const s = session();
	if (s.status === "connected") return getStatus();
	if (!s.registered && s.status === "qr" && s.qrDataUrl) return getStatus();
	if (s.status === "error" && !s.startPromise && !s.registered) return getStatus();
	const budget = timeoutMs ?? (s.registered ? 1e4 : 8e3);
	startSocket();
	const t0 = Date.now();
	while (Date.now() - t0 < budget) {
		const cur = session();
		if (cur.status === "connected") return getStatus();
		if (!cur.registered && cur.status === "qr" && cur.qrDataUrl) return getStatus();
		if (cur.status === "error") return getStatus();
		await sleep(200);
	}
	return getStatus();
}
async function startSocket() {
	hydrateFromDisk();
	const s = session();
	if (s.sock && !s.registered && !hasCredsFile()) {
		try {
			s.sock.end();
		} catch {}
		s.sock = null;
	}
	if (s.sock && (s.status === "connected" || s.status === "qr" || s.status === "connecting")) return;
	if (s.startPromise) return s.startPromise;
	s.shouldReconnect = true;
	if (s.status !== "connected") s.status = "connecting";
	if (!s.registered) s.error = null;
	s.startPromise = (async () => {
		const gen = ++session().generation;
		try {
			const baileys = await import("../_libs/@whiskeysockets/baileys+[...].mjs").then((n) => n.t);
			const dir = authDir();
			mkdirSync(dir, { recursive: true });
			const { state, saveCreds } = await baileys.useMultiFileAuthState(dir);
			await saveCreds();
			if (state.creds.registered) {
				s.registered = true;
				applyIdentity({
					userName: state.creds.me?.name ?? s.userName,
					userPhone: phoneFromJid(state.creds.me?.id) ?? s.userPhone
				});
				persistIdentity();
			}
			let version;
			try {
				version = (await Promise.race([baileys.fetchLatestWaWebVersion(), sleep(2500).then(() => {
					throw new Error("version timeout");
				})])).version;
			} catch {
				version = void 0;
			}
			if (session().generation !== gen) return;
			const sock = baileys.makeWASocket({
				auth: {
					creds: state.creds,
					keys: baileys.makeCacheableSignalKeyStore(state.keys, logger)
				},
				version,
				logger,
				printQRInTerminal: false,
				markOnlineOnConnect: false,
				connectTimeoutMs: 2e4,
				browser: baileys.Browsers.macOS("Abbie")
			});
			s.sock = sock;
			sock.ev.on("creds.update", (async () => {
				await saveCreds();
				if (state.creds.registered) {
					const cur = session();
					cur.registered = true;
					applyIdentity({
						userName: state.creds.me?.name ?? cur.userName,
						userPhone: phoneFromJid(state.creds.me?.id) ?? cur.userPhone
					});
					persistIdentity();
				}
			}));
			sock.ev.on("connection.update", (async (update) => {
				if (session().generation !== gen) return;
				const cur = session();
				if (update.qr && !cur.registered) {
					cur.status = "qr";
					cur.qrDataUrl = await import_lib.toDataURL(update.qr, {
						width: 280,
						margin: 1,
						color: {
							dark: "#000000",
							light: "#ffffff"
						}
					});
					if (session().generation !== gen) return;
					cur.error = null;
				}
				if (update.connection === "open") {
					cur.status = "connected";
					cur.registered = true;
					cur.qrDataUrl = null;
					cur.pairingCode = null;
					cur.error = null;
					applyIdentity({
						userName: sock.user?.name ?? state.creds.me?.name ?? cur.userName,
						userPhone: phoneFromJid(sock.user?.id) ?? phoneFromJid(state.creds.me?.id) ?? cur.userPhone
					});
					persistIdentity();
					saveCreds();
				}
				if (update.connection === "connecting" && cur.status !== "qr" && cur.status !== "connected") cur.status = "connecting";
				if (update.connection === "close") {
					const loggedOut = update.lastDisconnect?.error?.output?.statusCode === baileys.DisconnectReason.loggedOut;
					if (cur.sock === sock) cur.sock = null;
					cur.qrDataUrl = null;
					cur.pairingCode = null;
					if (loggedOut) {
						cur.shouldReconnect = false;
						cur.registered = false;
						cur.status = "idle";
						cur.userName = null;
						cur.userPhone = null;
						cur.error = "WhatsApp was unlinked. Scan again to reconnect.";
						wipeAuth();
						cur.hydrated = true;
						return;
					}
					cur.status = "connecting";
					cur.error = cur.registered ? "Reconnecting your WhatsApp…" : update.lastDisconnect?.error?.message ?? "Reconnecting…";
					if (cur.shouldReconnect) setTimeout(() => {
						if (session().generation !== gen) return;
						if (!session().shouldReconnect) return;
						startSocket();
					}, 2500);
				}
			}));
		} catch (err) {
			if (session().generation !== gen) return;
			s.sock = null;
			s.status = s.registered ? "connecting" : "error";
			s.error = err instanceof Error ? err.message : "Could not start WhatsApp.";
		}
	})().finally(() => {
		s.startPromise = null;
	});
	return s.startPromise;
}
async function requestPairing(phone) {
	hydrateFromDisk();
	const n = digits(phone);
	const s = session();
	if (s.registered) return getStatus();
	if (n.length < 8) {
		s.error = "Enter the phone in international format, digits only.";
		return getStatus();
	}
	await startSocket();
	const t0 = Date.now();
	while (!session().sock && Date.now() - t0 < 8e3) await sleep(200);
	const sock = session().sock;
	if (!sock) return getStatus();
	try {
		s.pairingCode = (await sock.requestPairingCode(n)).replace(/(\d{4})(\d{4})/, "$1-$2");
		s.error = null;
	} catch (err) {
		s.error = err instanceof Error ? err.message : "Could not request a pairing code.";
	}
	return getStatus();
}
async function sendWhatsAppText(to, text) {
	hydrateFromDisk();
	await waitForLink(session().registered ? 15e3 : 8e3);
	const s = session();
	if (s.status !== "connected" || !s.sock) return {
		ok: false,
		message: s.registered ? "WhatsApp is reconnecting. Try again in a moment." : s.status === "qr" ? "Scan the WhatsApp QR first, then try again." : "Link WhatsApp first — scan the QR from your phone (WhatsApp → Linked devices)."
	};
	const n = digits(to);
	if (n.length < 8) return {
		ok: false,
		message: "That phone number looks incomplete."
	};
	const body = text.trim();
	if (!body) return {
		ok: false,
		message: "Write a message first."
	};
	try {
		const hit = (await s.sock.onWhatsApp(n)).find((row) => row?.exists && row.jid);
		if (!hit?.exists || !hit.jid) return {
			ok: false,
			message: "That number is not on WhatsApp."
		};
		return {
			ok: true,
			id: (await s.sock.sendMessage(hit.jid, { text: body }))?.key?.id ?? void 0,
			message: `Sent to ${n} from ${s.userPhone ?? "your WhatsApp"}`
		};
	} catch (err) {
		return {
			ok: false,
			message: err instanceof Error ? err.message : "WhatsApp send failed."
		};
	}
}
async function logoutWhatsApp() {
	const s = session();
	s.shouldReconnect = false;
	s.generation += 1;
	try {
		await s.sock?.logout();
	} catch {
		try {
			s.sock?.end();
		} catch {}
	}
	s.sock = null;
	s.status = "idle";
	s.registered = false;
	s.qrDataUrl = null;
	s.pairingCode = null;
	s.userName = null;
	s.userPhone = null;
	s.error = null;
	s.hydrated = true;
	wipeAuth();
	return getStatus();
}
//#endregion
export { ensureStarted, getLinkSummary, logoutWhatsApp, requestPairing, sendWhatsAppText, waitForLink };
