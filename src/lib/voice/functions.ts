import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { ensureSecrets } from "@/lib/secrets.server";
import { AGENT_TOOLS, buildSystemPrompt, executeTool } from "@/lib/agent/tools";
import type { AgentAction, MemoryUpdate } from "@/lib/agent/types";

const MODEL = "models/gemini-3.8-live";

const memorySchema = z
  .array(
    z.object({
      category: z.string().max(24),
      text: z.string().max(240),
    }),
  )
  .max(48)
  .optional();

export const openLiveSession = createServerFn({ method: "POST" })
  .validator(
    z.object({
      memory: memorySchema,
      otherTitles: z.array(z.string().max(80)).max(12).optional(),
    }),
  )
  .handler(async ({ data }) => {
    ensureSecrets();
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      return {
        ok: false as const,
        error: "Voice isn’t connected. A Gemini key is missing.",
      };
    }
    const { fetchOperatorSnapshot } = await import("@/lib/meta/graph.server");
    const { GoogleGenAI } = await import("@google/genai/node");
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
    const systemInstruction = buildSystemPrompt(
      snapshot,
      true,
      (data.memory ?? []).map((m) => ({
        category: m.category as MemoryUpdate["category"],
        text: m.text,
      })),
      data.otherTitles ?? [],
    );
    const client = new GoogleGenAI({ apiKey });
    let token;
    try {
      token = await client.authTokens.create({
        config: {
          uses: 1,
          expireTime: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
          newSessionExpireTime: new Date(Date.now() + 60 * 1000).toISOString(),
        },
      });
    } catch (err) {
      const raw = err instanceof Error ? err.message : "";
      const suspended = /suspended|PERMISSION_DENIED|403/i.test(raw);
      return {
        ok: false as const,
        error: suspended
          ? "Google suspended this Gemini key, so the live call can’t start."
          : "Gemini wouldn’t open a live session.",
      };
    }
    const name = token.name;
    if (!name) {
      return { ok: false as const, error: "Gemini didn’t hand back a live session." };
    }
    return {
      ok: true as const,
      token: name,
      model: MODEL,
      systemInstruction,
      tools: AGENT_TOOLS.map((tool) => ({
        name: tool.function.name,
        description: tool.function.description,
        parameters: tool.function.parameters,
      })),
    };
  });

export const runVoiceTool = createServerFn({ method: "POST" })
  .validator(
    z.object({
      name: z.string().min(1).max(64),
      args: z.string().max(8000).optional(),
    }),
  )
  .handler(async ({ data }) => {
    const { fetchOperatorSnapshot } = await import("@/lib/meta/graph.server");
    const snapshot = await fetchOperatorSnapshot();
    const actions: AgentAction[] = [];
    const memoryUpdates: MemoryUpdate[] = [];
    const result = await executeTool(
      data.name,
      data.args || "{}",
      snapshot,
      actions,
      memoryUpdates,
    );
    return { result, actions, memoryUpdates };
  });
