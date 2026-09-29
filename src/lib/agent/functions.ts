import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { ensureSecrets } from "@/lib/secrets.server";
import { AGENT_TOOLS, buildSystemPrompt, executeTool } from "./tools";
import type { AgentAction, AgentTurnResult, ChatTurn, MemoryUpdate } from "./types";

type OAIMessage = {
  role: string;
  content?: string | null;
  tool_calls?: Array<{
    id: string;
    type: "function";
    function: { name: string; arguments: string };
  }>;
  images?: string[];
  tool_call_id?: string;
  tool_name?: string;
  name?: string;
};

const turnInput = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().max(12000),
        images: z.array(z.string().max(400_000)).max(4).optional(),
      }),
    )
    .max(24),
  voice: z.boolean().optional(),
  memory: z
    .array(
      z.object({
        category: z.string().max(24),
        text: z.string().max(240),
      }),
    )
    .max(48)
    .optional(),
  otherTitles: z.array(z.string().max(80)).max(12).optional(),
});

const OLLAMA_MODEL = () => process.env.OLLAMA_MODEL || "gemma4:31b";

function toolArgs(value: unknown) {
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value ?? {});
  } catch {
    return "{}";
  }
}

async function completeTurn(
  messages: ChatTurn[],
  voice: boolean,
  memory: Array<{ category: string; text: string }>,
  otherTitles: string[],
): Promise<AgentTurnResult> {
  ensureSecrets();
  const apiKey = process.env.OLLAMA_CLOUD_API_KEY || process.env.OLLAMA_API_KEY;
  if (!apiKey) {
    return { ok: false, error: "Chat isn’t connected. OLLAMA_CLOUD_API_KEY is missing." };
  }

  const { fetchOperatorSnapshot } = await import("@/lib/meta/graph.server");
  const snapshot = await fetchOperatorSnapshot().catch(() => ({
    operator: "Connected operator",
    pages: [] as { id: string; name: string; fans: number; category: string; about: string }[],
    instagram: [] as { id: string; username: string; followers: number }[],
    adAccounts: [],
    inboxUnread: 0,
    whatsappLink: {
      status: "idle" as const,
      userName: null,
      userPhone: null,
      error: null,
      saved: false,
    },
  }));

  const convo: OAIMessage[] = [
    { role: "system", content: buildSystemPrompt(snapshot, voice, memory, otherTitles) },
    ...messages.map((m) => ({
      role: m.role,
      content: m.content,
      ...(m.images?.length
        ? {
            images: m.images.map((image) => image.replace(/^data:image\/[a-zA-Z0-9.+-]+;base64,/, "")),
          }
        : {}),
    })),
  ];

  const actions: AgentAction[] = [];
  const memoryUpdates: MemoryUpdate[] = [];
  let guard = 0;
  while (guard++ < 5) {
    const res = await fetch("https://ollama.com/api/chat", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: OLLAMA_MODEL(),
        messages: convo,
        tools: AGENT_TOOLS,
        stream: false,
        options: {
          temperature: voice ? 0.55 : 0.62,
          num_predict: voice ? 360 : 720,
        },
      }),
    });
    if (!res.ok) {
      const rate = res.status === 429;
      return {
        ok: false,
        error: rate
          ? "Give me a second — I’m catching my breath."
          : res.status === 401
            ? "Ollama rejected the cloud key."
            : `Something’s off on my side (${res.status}). Try that again.`,
      };
    }
    const json = (await res.json()) as {
      message?: {
        content?: string | null;
        tool_calls?: Array<{
          function: { name: string; arguments: unknown };
        }>;
      };
    };
    const msg = json.message;
    if (!msg) {
      return { ok: false, error: "I blanked for a second. Say that again?" };
    }
    const calls = (msg.tool_calls ?? [])
      .filter((call) => call.function?.name)
      .map((call) => ({
        function: {
          name: call.function.name,
          arguments: toolArgs(call.function.arguments),
        },
      }));
    if (calls.length) {
      convo.push({
        role: "assistant",
        content: typeof msg.content === "string" ? msg.content : "",
        tool_calls: msg.tool_calls as OAIMessage["tool_calls"],
      });
      for (const call of calls) {
        const result = await executeTool(
          call.function.name,
          call.function.arguments,
          snapshot,
          actions,
          memoryUpdates,
        );
        convo.push({
          role: "tool",
          name: call.function.name,
          tool_name: call.function.name,
          content: result,
        });
      }
      continue;
    }
    const text = (typeof msg.content === "string" ? msg.content : "").trim();
    return {
      ok: true,
      text: text || (actions.length ? "Done." : "I’m here."),
      actions,
      audio: null,
      memoryUpdates,
    };
  }
  return { ok: false, error: "I got tangled running that. Try a simpler ask." };
}

export const runAgentTurn = createServerFn({ method: "POST" })
  .validator(turnInput)
  .handler(async ({ data }): Promise<AgentTurnResult> => {
    const trimmed = data.messages
      .map((m) => ({
        role: m.role,
        content: m.content.slice(0, 8000),
        images: m.images?.slice(0, 4),
      }))
      .filter((m) => m.content.trim() || (m.images && m.images.length > 0))
      .slice(-18);
    if (!trimmed.length || trimmed[trimmed.length - 1]?.role !== "user") {
      return { ok: false, error: "Say something first." };
    }
    try {
      return await completeTurn(
        trimmed,
        Boolean(data.voice),
        (data.memory ?? []).map((m) => ({ category: m.category, text: m.text })),
        data.otherTitles ?? [],
      );
    } catch (e) {
      return {
        ok: false,
        error: e instanceof Error ? e.message : "That didn’t land. Try again.",
      };
    }
  });

export const getSnapshot = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const { fetchOperatorSnapshot } = await import("@/lib/meta/graph.server");
    return { data: await fetchOperatorSnapshot(), error: null as string | null };
  } catch (e) {
    return {
      data: null,
      error: e instanceof Error ? e.message : "Could not load Meta accounts.",
    };
  }
});
