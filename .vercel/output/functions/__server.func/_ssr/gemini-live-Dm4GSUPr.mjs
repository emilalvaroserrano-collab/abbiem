import { t as createServerFn } from "./ssr.mjs";
import { n as array, o as object, s as string } from "../_libs/zod.mjs";
import { n as createSsrRpc } from "./routes-DcW9bOFb.mjs";
import { a as Modality, i as MediaResolution, r as GoogleGenAI } from "../_libs/@google/genai.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/gemini-live-Dm4GSUPr.js
var memorySchema = array(object({
	category: string().max(24),
	text: string().max(240)
})).max(48).optional();
var openLiveSession = createServerFn({ method: "POST" }).validator(object({
	memory: memorySchema,
	otherTitles: array(string().max(80)).max(12).optional()
})).handler(createSsrRpc("8232f19314eae57315397fca5e2f8a509ec4e3fcecd5419b5e4e83030de71b65"));
var runVoiceTool = createServerFn({ method: "POST" }).validator(object({
	name: string().min(1).max(64),
	args: string().max(8e3).optional()
})).handler(createSsrRpc("d9eee2a0db3f8293ec019f23a9d3309859fc308976df1c7dfa369267a058977a"));
function bytesToBase64(bytes) {
	let binary = "";
	const step = 32768;
	for (let i = 0; i < bytes.length; i += step) binary += String.fromCharCode(...bytes.subarray(i, i + step));
	return btoa(binary);
}
function base64ToBytes(data) {
	const binary = atob(data);
	const bytes = new Uint8Array(binary.length);
	for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
	return bytes;
}
function downsample(input, inRate, outRate) {
	if (inRate === outRate) return input;
	const ratio = inRate / outRate;
	const length = Math.floor(input.length / ratio);
	const out = new Float32Array(length);
	for (let i = 0; i < length; i++) out[i] = input[Math.floor(i * ratio)] ?? 0;
	return out;
}
function floatToPcm16(input) {
	const pcm = new Int16Array(input.length);
	for (let i = 0; i < input.length; i++) {
		const s = Math.max(-1, Math.min(1, input[i] ?? 0));
		pcm[i] = s < 0 ? s * 32768 : s * 32767;
	}
	return new Uint8Array(pcm.buffer);
}
async function startGeminiLive(opts) {
	const opened = await openLiveSession({ data: {
		memory: opts.memory,
		otherTitles: opts.otherTitles
	} });
	if (!opened.ok) {
		opts.onError(opened.error);
		opts.onPhase("listening");
		return {
			stop: () => {},
			setMuted: () => {}
		};
	}
	if (opts.isCancelled()) return {
		stop: () => {},
		setMuted: () => {}
	};
	const ai = new GoogleGenAI({ apiKey: opened.token });
	let session = null;
	let stopped = false;
	let muted = opts.isMuted();
	const sources = [];
	let playCtx = null;
	let nextTime = 0;
	let micCtx = null;
	let micStream = null;
	let userBuf = "";
	let abbieBuf = "";
	const turnActions = [];
	function flushTurn() {
		const user = userBuf.trim();
		const abbie = abbieBuf.trim();
		userBuf = "";
		const actions = turnActions.splice(0, turnActions.length);
		abbieBuf = "";
		if (user) opts.onUserText(user);
		if (abbie || actions.length) opts.onAssistant(abbie || "Done.", actions);
	}
	function stopPlayback() {
		for (const src of sources.splice(0, sources.length)) try {
			src.stop();
		} catch {}
		if (playCtx) nextTime = playCtx.currentTime;
	}
	function playPcm(b64) {
		if (stopped) return;
		if (!playCtx) playCtx = new AudioContext({ sampleRate: 24e3 });
		const bytes = base64ToBytes(b64);
		const samples = new Int16Array(bytes.buffer, bytes.byteOffset, Math.floor(bytes.byteLength / 2));
		if (!samples.length) return;
		const buffer = playCtx.createBuffer(1, samples.length, 24e3);
		const channel = buffer.getChannelData(0);
		for (let i = 0; i < samples.length; i++) channel[i] = (samples[i] ?? 0) / 32768;
		const src = playCtx.createBufferSource();
		src.buffer = buffer;
		src.connect(playCtx.destination);
		const start = Math.max(playCtx.currentTime + .02, nextTime);
		src.start(start);
		nextTime = start + buffer.duration;
		sources.push(src);
		src.onended = () => {
			const i = sources.indexOf(src);
			if (i >= 0) sources.splice(i, 1);
		};
		opts.onPhase("speaking");
	}
	async function onMessage(message) {
		if (stopped) return;
		const content = message.serverContent;
		if (content?.interrupted) {
			stopPlayback();
			opts.onPhase("listening");
		}
		const interim = content?.interimInputTranscription?.text || content?.inputTranscription?.text;
		if (interim) {
			userBuf = interim;
			opts.onCaption(interim);
			opts.onPhase("listening");
		}
		if (content?.outputTranscription?.text) {
			abbieBuf += content.outputTranscription.text;
			opts.onCaption(abbieBuf);
		}
		for (const part of content?.modelTurn?.parts ?? []) {
			const data = part.inlineData?.data;
			if (typeof data === "string" && data) playPcm(data);
		}
		if (message.toolCall?.functionCalls?.length && session) {
			opts.onPhase("thinking");
			const responses = [];
			for (const call of message.toolCall.functionCalls) {
				if (!call.name) continue;
				try {
					const out = await runVoiceTool({ data: {
						name: call.name,
						args: JSON.stringify(call.args ?? {})
					} });
					turnActions.push(...out.actions);
					if (out.memoryUpdates.length) opts.onMemory(out.memoryUpdates);
					responses.push({
						id: call.id,
						name: call.name,
						response: { result: out.result }
					});
				} catch (err) {
					responses.push({
						id: call.id,
						name: call.name,
						response: { error: err instanceof Error ? err.message : "Tool failed" }
					});
				}
			}
			if (!stopped) session.sendToolResponse({ functionResponses: responses });
		}
		if (content?.turnComplete) {
			flushTurn();
			opts.onPhase("listening");
		}
	}
	session = await ai.live.connect({
		model: opened.model,
		config: {
			responseModalities: [Modality.AUDIO],
			mediaResolution: MediaResolution.MEDIA_RESOLUTION_MEDIUM,
			systemInstruction: opened.systemInstruction,
			speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: "Aoede" } } },
			contextWindowCompression: {
				triggerTokens: "104857",
				slidingWindow: { targetTokens: "52428" }
			},
			inputAudioTranscription: {},
			outputAudioTranscription: {},
			tools: [{ functionDeclarations: opened.tools }, { googleSearch: {} }]
		},
		callbacks: {
			onopen: () => opts.onPhase("listening"),
			onmessage: (message) => {
				onMessage(message);
			},
			onerror: (e) => opts.onError(e.message || "The live call dropped."),
			onclose: () => {
				if (!stopped) opts.onPhase("listening");
			}
		}
	});
	if (opts.isCancelled()) {
		session.close();
		return {
			stop: () => {},
			setMuted: () => {}
		};
	}
	try {
		micStream = await navigator.mediaDevices.getUserMedia({ audio: {
			channelCount: 1,
			echoCancellation: true,
			noiseSuppression: true
		} });
		micCtx = new AudioContext();
		const source = micCtx.createMediaStreamSource(micStream);
		const processor = micCtx.createScriptProcessor(4096, 1, 1);
		const sink = micCtx.createGain();
		sink.gain.value = 0;
		processor.onaudioprocess = (event) => {
			if (stopped || muted || !session) return;
			const pcm = floatToPcm16(downsample(event.inputBuffer.getChannelData(0), micCtx?.sampleRate || 48e3, 16e3));
			session.sendRealtimeInput({ audio: {
				data: bytesToBase64(pcm),
				mimeType: "audio/pcm;rate=16000"
			} });
		};
		source.connect(processor);
		processor.connect(sink);
		sink.connect(micCtx.destination);
	} catch {
		opts.onError("Microphone permission is blocked.");
	}
	return {
		setMuted: (next) => {
			muted = next;
		},
		stop: () => {
			stopped = true;
			stopPlayback();
			micStream?.getTracks().forEach((track) => track.stop());
			micCtx?.close();
			playCtx?.close();
			try {
				session?.close();
			} catch {}
			session = null;
		}
	};
}
//#endregion
export { startGeminiLive };
