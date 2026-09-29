import {
  GoogleGenAI,
  MediaResolution,
  Modality,
  type LiveServerMessage,
  type Session,
} from "@google/genai/web";
import { openLiveSession, runVoiceTool } from "@/lib/voice/functions";
import type { AgentAction, MemoryUpdate } from "@/lib/agent/types";

export type LivePhase = "connecting" | "listening" | "thinking" | "speaking";

type StartOpts = {
  memory: Array<{ category: string; text: string }>;
  otherTitles: string[];
  isMuted: () => boolean;
  isCancelled: () => boolean;
  onPhase: (phase: LivePhase) => void;
  onCaption: (text: string) => void;
  onUserText: (text: string) => void;
  onAssistant: (text: string, actions: AgentAction[]) => void;
  onMemory: (updates: MemoryUpdate[]) => void;
  onError: (message: string) => void;
};

export type LiveHandle = {
  stop: () => void;
  setMuted: (muted: boolean) => void;
};

function bytesToBase64(bytes: Uint8Array) {
  let binary = "";
  const step = 0x8000;
  for (let i = 0; i < bytes.length; i += step) {
    binary += String.fromCharCode(...bytes.subarray(i, i + step));
  }
  return btoa(binary);
}

function base64ToBytes(data: string) {
  const binary = atob(data);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function downsample(input: Float32Array, inRate: number, outRate: number) {
  if (inRate === outRate) return input;
  const ratio = inRate / outRate;
  const length = Math.floor(input.length / ratio);
  const out = new Float32Array(length);
  for (let i = 0; i < length; i++) out[i] = input[Math.floor(i * ratio)] ?? 0;
  return out;
}

function floatToPcm16(input: Float32Array) {
  const pcm = new Int16Array(input.length);
  for (let i = 0; i < input.length; i++) {
    const s = Math.max(-1, Math.min(1, input[i] ?? 0));
    pcm[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  return new Uint8Array(pcm.buffer);
}

export async function startGeminiLive(opts: StartOpts): Promise<LiveHandle> {
  const opened = await openLiveSession({
    data: { memory: opts.memory, otherTitles: opts.otherTitles },
  });
  if (!opened.ok) {
    opts.onError(opened.error);
    opts.onPhase("listening");
    return { stop: () => {}, setMuted: () => {} };
  }
  if (opts.isCancelled()) return { stop: () => {}, setMuted: () => {} };

  const ai = new GoogleGenAI({ apiKey: opened.token });
  let session: Session | null = null;
  let stopped = false;
  let muted = opts.isMuted();
  const sources: AudioBufferSourceNode[] = [];
  let playCtx: AudioContext | null = null;
  let nextTime = 0;
  let micCtx: AudioContext | null = null;
  let micStream: MediaStream | null = null;
  let userBuf = "";
  let abbieBuf = "";
  const turnActions: AgentAction[] = [];

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
    for (const src of sources.splice(0, sources.length)) {
      try {
        src.stop();
      } catch {
        /* already ended */
      }
    }
    if (playCtx) nextTime = playCtx.currentTime;
  }

  function playPcm(b64: string) {
    if (stopped) return;
    if (!playCtx) playCtx = new AudioContext({ sampleRate: 24000 });
    const bytes = base64ToBytes(b64);
    const samples = new Int16Array(bytes.buffer, bytes.byteOffset, Math.floor(bytes.byteLength / 2));
    if (!samples.length) return;
    const buffer = playCtx.createBuffer(1, samples.length, 24000);
    const channel = buffer.getChannelData(0);
    for (let i = 0; i < samples.length; i++) channel[i] = (samples[i] ?? 0) / 0x8000;
    const src = playCtx.createBufferSource();
    src.buffer = buffer;
    src.connect(playCtx.destination);
    const start = Math.max(playCtx.currentTime + 0.02, nextTime);
    src.start(start);
    nextTime = start + buffer.duration;
    sources.push(src);
    src.onended = () => {
      const i = sources.indexOf(src);
      if (i >= 0) sources.splice(i, 1);
    };
    opts.onPhase("speaking");
  }

  async function onMessage(message: LiveServerMessage) {
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
          const out = await runVoiceTool({
            data: { name: call.name, args: JSON.stringify(call.args ?? {}) },
          });
          turnActions.push(...out.actions);
          if (out.memoryUpdates.length) opts.onMemory(out.memoryUpdates);
          responses.push({
            id: call.id,
            name: call.name,
            response: { result: out.result },
          });
        } catch (err) {
          responses.push({
            id: call.id,
            name: call.name,
            response: { error: err instanceof Error ? err.message : "Tool failed" },
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
      speechConfig: {
        voiceConfig: { prebuiltVoiceConfig: { voiceName: "Aoede" } },
      },
      contextWindowCompression: {
        triggerTokens: "104857",
        slidingWindow: { targetTokens: "52428" },
      },
      inputAudioTranscription: {},
      outputAudioTranscription: {},
      tools: [{ functionDeclarations: opened.tools as never }, { googleSearch: {} }],
    },
    callbacks: {
      onopen: () => opts.onPhase("listening"),
      onmessage: (message) => {
        void onMessage(message);
      },
      onerror: (e) => opts.onError(e.message || "The live call dropped."),
      onclose: () => {
        if (!stopped) opts.onPhase("listening");
      },
    },
  });

  if (opts.isCancelled()) {
    session.close();
    return { stop: () => {}, setMuted: () => {} };
  }

  try {
    micStream = await navigator.mediaDevices.getUserMedia({
      audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true },
    });
    micCtx = new AudioContext();
    const source = micCtx.createMediaStreamSource(micStream);
    const processor = micCtx.createScriptProcessor(4096, 1, 1);
    const sink = micCtx.createGain();
    sink.gain.value = 0;
    processor.onaudioprocess = (event) => {
      if (stopped || muted || !session) return;
      const input = event.inputBuffer.getChannelData(0);
      const down = downsample(input, micCtx?.sampleRate || 48000, 16000);
      const pcm = floatToPcm16(down);
      session.sendRealtimeInput({
        audio: { data: bytesToBase64(pcm), mimeType: "audio/pcm;rate=16000" },
      });
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
      void micCtx?.close();
      void playCtx?.close();
      try {
        session?.close();
      } catch {
        /* already closed */
      }
      session = null;
    },
  };
}
