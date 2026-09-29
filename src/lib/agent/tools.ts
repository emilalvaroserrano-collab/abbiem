import type { OperatorSnapshot } from "@/lib/meta/types";
import type { AgentAction, MemoryUpdate } from "./types";

export const AGENT_TOOLS = [
  {
    type: "function" as const,
    function: {
      name: "remember",
      description:
        "Save something you learned about the user so future chats start smarter. Names, contacts, preferences, which page they actually use, tone they like, numbers they message. Call this whenever you learn anything durable. Do not announce that you are remembering.",
      parameters: {
        type: "object",
        properties: {
          fact: { type: "string", description: "One concise fact in your own words." },
          category: {
            type: "string",
            description: "person, preference, contact, business, style, or other.",
          },
        },
        required: ["fact"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "forget",
      description: "Drop a remembered fact that is wrong or outdated.",
      parameters: {
        type: "object",
        properties: { fact: { type: "string" } },
        required: ["fact"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "send_whatsapp",
      description:
        "Send a WhatsApp text message from the user's linked personal WhatsApp (Baileys). The recipient is any phone number on WhatsApp. Do not use Meta Cloud API, templates, or a 24-hour window.",
      parameters: {
        type: "object",
        properties: {
          to: {
            type: "string",
            description: "Destination phone with country code. Digits; plus optional.",
          },
          text: { type: "string", description: "Message body to send." },
        },
        required: ["to", "text"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "publish_page_post",
      description: "Publish a text post, optionally with a link, to one or more Facebook Pages.",
      parameters: {
        type: "object",
        properties: {
          message: { type: "string" },
          page_ids: {
            type: "array",
            items: { type: "string" },
            description: "Page ids. If omitted, uses page_name match or the first page.",
          },
          page_name: { type: "string", description: "Fuzzy name of the page if id is unknown." },
          link: { type: "string" },
        },
        required: ["message"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "reply_messenger",
      description: "Reply in an existing Facebook Messenger thread on a Page.",
      parameters: {
        type: "object",
        properties: {
          page_id: { type: "string" },
          recipient_id: { type: "string" },
          text: { type: "string" },
        },
        required: ["page_id", "recipient_id", "text"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "list_inbox",
      description: "List recent Messenger conversations across connected Pages.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "list_campaigns",
      description: "List recent Meta Ads campaigns for an ad account.",
      parameters: {
        type: "object",
        properties: {
          ad_account_id: { type: "string" },
        },
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "create_ad_campaign",
      description:
        "Create a PAUSED Meta Ads campaign so nothing spends until the user turns it on in Ads Manager. Optionally attach a paused ad set with a daily budget (major currency units, e.g. 500 for ₱500/day) targeted to the Philippines.",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string" },
          objective: {
            type: "string",
            description:
              "OUTCOME_AWARENESS, OUTCOME_TRAFFIC, OUTCOME_ENGAGEMENT, OUTCOME_LEADS, OUTCOME_SALES, or OUTCOME_APP_PROMOTION.",
          },
          ad_account_id: { type: "string" },
          daily_budget: {
            type: "number",
            description: "Daily budget in major currency units (pesos, dollars). Optional.",
          },
        },
        required: ["name", "objective"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "generate_creative",
      description:
        "Generate a Grok Imagine banner, feed/ad image, or a 6-second video of what this business actually does. Infer the business type from the connected page category and about. Theme must describe the real work (kitchen, software studio, jobsite) — never a generic premium montage.",
      parameters: {
        type: "object",
        properties: {
          kind: {
            type: "string",
            description: "banner (16:9), post (1:1), ad (1:1), or video (6s).",
          },
          theme: {
            type: "string",
            description:
              "The actual work to show for this business type. Infer from page category and about. Example: software engineers at dual monitors, not 'premium brand vibe'.",
          },
          page_name: { type: "string" },
          page_ids: { type: "array", items: { type: "string" } },
          publish: {
            type: "boolean",
            description: "If true, post the creative to the Facebook Page now.",
          },
          caption: { type: "string", description: "Caption if publishing." },
        },
        required: ["kind", "theme"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "schedule_daily_posts",
      description:
        "Create a 4× daily Facebook posting schedule (09:00, 13:00, 17:00, 21:00 Asia/Manila). Generates banner creatives and schedules them on the Page. Use when the user wants posts four times a day.",
      parameters: {
        type: "object",
        properties: {
          theme: { type: "string", description: "Ongoing content theme for the business." },
          page_name: { type: "string" },
          page_ids: { type: "array", items: { type: "string" } },
          kind: { type: "string", description: "banner, post, or ad. Default banner." },
          include_video: {
            type: "boolean",
            description: "If true, one of the four slots is a short video. Default false.",
          },
        },
        required: ["theme"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "list_schedule",
      description: "List active 4× daily posting campaigns and upcoming slots.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "pause_schedule",
      description: "Pause one scheduled posting campaign. Does not delete past posts.",
      parameters: {
        type: "object",
        properties: { campaign_id: { type: "string" } },
        required: ["campaign_id"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "find_leads",
      description:
        "Find people and pages that already engaged with the connected Facebook Pages, plus Meta ad audiences that match the business. Filters lead forms, Messenger chats, comments, tags, connected pages, and interest audiences. Meta cannot dump a list of strangers who might like the business.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "Optional filter: name, keyword, software, quote, etc.",
          },
          page_name: { type: "string" },
          page_ids: { type: "array", items: { type: "string" } },
        },
      },
    },
  },
];

function parseArgs(raw: string): Record<string, unknown> {
  if (!raw || !raw.trim()) return {};
  try {
    const v = JSON.parse(raw) as unknown;
    return v && typeof v === "object" ? (v as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

function str(v: unknown): string {
  return typeof v === "string" ? v : v == null ? "" : String(v);
}

function num(v: unknown): number | undefined {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim()) {
    const n = Number(v.replace(/[^\d.]/g, ""));
    return Number.isFinite(n) ? n : undefined;
  }
  return undefined;
}

function pickPages(snapshot: OperatorSnapshot, ids: string[], name: string) {
  if (ids.length) {
    const found = snapshot.pages.filter((p) => ids.includes(p.id));
    if (found.length) return found;
  }
  if (name) {
    const q = name.toLowerCase();
    const found = snapshot.pages.filter(
      (p) => p.name.toLowerCase().includes(q) || q.includes(p.name.toLowerCase()),
    );
    if (found.length) return found;
  }
  return snapshot.pages.slice(0, 1);
}

export async function executeTool(
  name: string,
  rawArgs: string,
  snapshot: OperatorSnapshot,
  actions: AgentAction[],
  memoryUpdates: MemoryUpdate[],
): Promise<string> {
  const args = parseArgs(rawArgs);
  const graph = await import("@/lib/meta/graph.server");

  try {
    switch (name) {
      case "remember": {
        const fact = str(args.fact).trim();
        const category = (str(args.category) || "other") as MemoryUpdate["category"];
        const allowed: MemoryUpdate["category"][] = [
          "person",
          "preference",
          "contact",
          "business",
          "style",
          "other",
        ];
        if (fact) {
          memoryUpdates.push({
            action: "add",
            category: allowed.includes(category) ? category : "other",
            text: fact,
          });
        }
        return JSON.stringify({ ok: true });
      }
      case "forget": {
        const fact = str(args.fact).trim();
        if (fact) memoryUpdates.push({ action: "remove", category: "other", text: fact });
        return JSON.stringify({ ok: true });
      }
      case "send_whatsapp": {
        const to = str(args.to);
        const text = str(args.text);
        const wa = await import("@/lib/whatsapp/baileys.server");
        const result = await wa.sendWhatsAppText(to, text);
        actions.push({
          kind: "whatsapp",
          ok: result.ok,
          title: result.ok ? "WhatsApp sent" : "WhatsApp failed",
          detail: result.message,
        });
        return JSON.stringify(result);
      }
      case "publish_page_post": {
        const message = str(args.message);
        const ids = Array.isArray(args.page_ids)
          ? args.page_ids.map((x) => str(x)).filter(Boolean)
          : [];
        const pages = pickPages(snapshot, ids, str(args.page_name));
        if (!pages.length) {
          const msg = "No Facebook Page is connected.";
          actions.push({ kind: "post", ok: false, title: "Page post", detail: msg });
          return JSON.stringify({ ok: false, error: msg });
        }
        const published = await graph.publishToPages({
          pageIds: pages.map((p) => p.id),
          message,
          link: str(args.link) || undefined,
        });
        for (const r of published.results) {
          actions.push({
            kind: "post",
            ok: r.ok,
            title: r.ok ? `Posted on ${r.pageName}` : `Post failed on ${r.pageName || "page"}`,
            detail: r.ok ? (r.id ? `Post id ${r.id}` : "Published") : r.message,
          });
        }
        return JSON.stringify(published);
      }
      case "reply_messenger": {
        const result = await graph.replyConversation({
          pageId: str(args.page_id),
          recipientId: str(args.recipient_id),
          text: str(args.text),
        });
        actions.push({
          kind: "messenger",
          ok: result.ok,
          title: result.ok ? "Messenger reply sent" : "Messenger reply failed",
          detail: result.message,
        });
        return JSON.stringify(result);
      }
      case "list_inbox": {
        const threads = await graph.fetchInbox();
        const compact = threads.slice(0, 12).map((t) => ({
          conversationId: t.id,
          pageId: t.pageId,
          pageName: t.pageName,
          name: t.name,
          participantId: t.participantId,
          snippet: t.snippet,
          unread: t.unreadCount,
          canReply: t.canReply,
          updatedAt: t.updatedAt,
        }));
        actions.push({
          kind: "inbox",
          ok: true,
          title: `${compact.length} recent threads`,
          detail: compact[0] ? `Latest: ${compact[0].name} — ${compact[0].snippet}` : "Inbox is empty",
        });
        return JSON.stringify({ threads: compact });
      }
      case "list_campaigns": {
        const accounts =
          str(args.ad_account_id) ? [str(args.ad_account_id)] : snapshot.adAccounts.map((a) => a.id);
        const all = [];
        for (const id of accounts.slice(0, 3)) {
          try {
            all.push(...(await graph.fetchCampaigns(id, 6)));
          } catch {
            /* skip */
          }
        }
        actions.push({
          kind: "campaign",
          ok: true,
          title: `${all.length} campaigns`,
          detail: all[0] ? `${all[0].name} (${all[0].status})` : "No campaigns yet",
        });
        return JSON.stringify({ campaigns: all.slice(0, 12) });
      }
      case "create_ad_campaign": {
        const result = await graph.createCampaign({
          accountId: str(args.ad_account_id) || undefined,
          name: str(args.name),
          objective: str(args.objective) || "OUTCOME_TRAFFIC",
          dailyBudget: num(args.daily_budget),
        });
        actions.push({
          kind: "campaign",
          ok: result.ok,
          title: result.ok ? "Campaign created (paused)" : "Campaign failed",
          detail: result.ok
            ? `${str(args.name)} · ${result.extra?.accountName ?? "ad account"} · nothing is spending`
            : result.message,
        });
        return JSON.stringify(result);
      }
      case "generate_creative": {
        const kindRaw = str(args.kind).toLowerCase();
        const kind =
          kindRaw === "video" || kindRaw === "ad" || kindRaw === "post" || kindRaw === "banner"
            ? kindRaw
            : "banner";
        const theme = str(args.theme);
        const pages = pickPages(
          snapshot,
          Array.isArray(args.page_ids) ? args.page_ids.map((x) => str(x)).filter(Boolean) : [],
          str(args.page_name),
        );
        const imagine = await import("@/lib/studio/imagine.server");
        if (kind === "video") {
          const prompt = imagine.buildCreativePrompt({
            kind: "video",
            theme,
            pageName: pages[0]?.name,
            category: pages[0]?.category,
            about: pages[0]?.about,
          });
          const started = await imagine.startVideo({ prompt, aspect: "16:9", duration: 6 });
          if (!started.ok) {
            actions.push({
              kind: "creative",
              ok: false,
              title: "Video failed",
              detail: started.message,
            });
            return JSON.stringify(started);
          }
          const job = await imagine.rememberVideoJob({
            requestId: started.requestId,
            prompt: started.prompt,
          });
          const waited = await imagine.waitForVideo(started.requestId, 16_000);
          if (waited.ok) {
            await imagine.completeJob(job.id, waited.url);
            actions.push({
              kind: "creative",
              ok: true,
              title: "Showcase video ready",
              detail: theme,
              mediaUrl: waited.url,
              mediaKind: "video",
            });
            if (args.publish && pages[0]) {
              const published = await graph.publishMedia({
                pageId: pages[0].id,
                message: str(args.caption) || theme,
                mediaUrl: waited.url,
                mediaKind: "video",
              });
              actions.push({
                kind: "post",
                ok: published.ok,
                title: published.ok ? `Posted on ${pages[0].name}` : `Post failed on ${pages[0].name}`,
                detail: published.message,
              });
              return JSON.stringify({ creative: waited, published });
            }
            return JSON.stringify({ ok: true, url: waited.url, kind: "video" });
          }
          if (waited.message && waited.message !== "still-rendering") {
            await imagine.failJob(job.id, waited.message);
            actions.push({
              kind: "creative",
              ok: false,
              title: "Video failed",
              detail: waited.message,
              jobId: job.id,
            });
            return JSON.stringify(waited);
          }
          actions.push({
            kind: "creative",
            ok: true,
            title: "Rendering showcase video",
            detail: "Takes about a minute. It will appear here when it’s ready.",
            jobId: job.id,
            mediaKind: "video",
          });
          return JSON.stringify({ ok: true, rendering: true, jobId: job.id });
        }
        const creative = await imagine.generateCreative({
          kind,
          theme,
          pageName: pages[0]?.name,
          category: pages[0]?.category,
          about: pages[0]?.about,
        });
        if (!creative.ok) {
          actions.push({
            kind: "creative",
            ok: false,
            title: "Image failed",
            detail: creative.message,
          });
          return JSON.stringify(creative);
        }
        actions.push({
          kind: "creative",
          ok: true,
          title: `${kind} ready`,
          detail: theme,
          mediaUrl: creative.url,
          mediaKind: creative.kind,
        });
        if (args.publish && pages[0]) {
          const published = await graph.publishMedia({
            pageId: pages[0].id,
            message: str(args.caption) || theme,
            mediaUrl: creative.url,
            mediaKind: creative.kind,
          });
          actions.push({
            kind: "post",
            ok: published.ok,
            title: published.ok ? `Posted on ${pages[0].name}` : `Post failed on ${pages[0].name}`,
            detail: published.message,
          });
          return JSON.stringify({ creative, published });
        }
        return JSON.stringify(creative);
      }
      case "schedule_daily_posts": {
        const pages = pickPages(
          snapshot,
          Array.isArray(args.page_ids) ? args.page_ids.map((x) => str(x)).filter(Boolean) : [],
          str(args.page_name),
        );
        if (!pages[0]) {
          const msg = "No Facebook Page is connected.";
          actions.push({ kind: "schedule", ok: false, title: "Schedule", detail: msg });
          return JSON.stringify({ ok: false, error: msg });
        }
        const studio = await import("@/lib/studio/schedule.server");
        const kindRaw = str(args.kind).toLowerCase();
        const kind =
          kindRaw === "ad" || kindRaw === "post" || kindRaw === "banner" ? kindRaw : "banner";
        const created = await studio.createDailyCampaign({
          pageId: pages[0].id,
          pageName: pages[0].name,
          theme: str(args.theme),
          kind,
          includeVideo: Boolean(args.include_video),
        });
        const times = created.slots
          .map((s) => studio.formatInZone(s.publishAt, created.campaign.timezone))
          .join(" · ");
        actions.push({
          kind: "schedule",
          ok: created.slots.length > 0,
          title: `4× daily on ${pages[0].name}`,
          detail: times || "Could not fill the first day’s slots.",
          mediaUrl: created.slots.find((s) => s.mediaUrl)?.mediaUrl,
          mediaKind: (created.slots.find((s) => s.mediaUrl)?.mediaKind as "image" | "video") ?? "image",
        });
        for (const slot of created.slots.slice(0, 4)) {
          if (slot.mediaUrl) {
            actions.push({
              kind: "creative",
              ok: slot.status !== "failed",
              title: studio.formatInZone(slot.publishAt, created.campaign.timezone),
              detail: slot.caption,
              mediaUrl: slot.mediaUrl,
              mediaKind: slot.mediaKind === "video" ? "video" : "image",
            });
          }
        }
        return JSON.stringify({
          ok: true,
          campaignId: created.campaign.id,
          slots: created.slots.map((s) => ({
            at: s.publishAt,
            status: s.status,
            caption: s.caption,
            media: s.mediaUrl,
          })),
        });
      }
      case "list_schedule": {
        const studio = await import("@/lib/studio/schedule.server");
        await studio.tickStudio();
        const data = await studio.listStudio();
        const next = data.slots.slice(0, 8).map((s) => ({
          at: s.publishAt,
          status: s.status,
          caption: s.caption,
        }));
        actions.push({
          kind: "schedule",
          ok: true,
          title: `${data.campaigns.length} active schedule${data.campaigns.length === 1 ? "" : "s"}`,
          detail: next[0]
            ? `Next: ${studio.formatInZone(next[0].at, data.campaigns[0]?.timezone ?? "Asia/Manila")}`
            : "No upcoming slots",
        });
        return JSON.stringify({ campaigns: data.campaigns, slots: next });
      }
      case "pause_schedule": {
        const studio = await import("@/lib/studio/schedule.server");
        await studio.pauseCampaign(str(args.campaign_id));
        actions.push({
          kind: "schedule",
          ok: true,
          title: "Schedule paused",
          detail: "Upcoming auto-posts will stop. Existing Facebook scheduled posts stay.",
        });
        return JSON.stringify({ ok: true });
      }
      case "find_leads": {
        const pages = pickPages(
          snapshot,
          Array.isArray(args.page_ids) ? args.page_ids.map((x) => str(x)).filter(Boolean) : [],
          str(args.page_name),
        );
        const { fetchLeadBoard } = await import("@/lib/meta/leads.server");
        const board = await fetchLeadBoard({
          query: str(args.query),
          pageId: pages.length === 1 ? pages[0]?.id : undefined,
          limit: 24,
        });
        const top = board.leads.slice(0, 12);
        const warm = top.filter((l) => l.source !== "audience" && l.source !== "page");
        actions.push({
          kind: "leads",
          ok: top.length > 0,
          title: warm.length
            ? `${warm.length} warm leads`
            : top.length
              ? `${top.length} matching audiences`
              : "No leads matched",
          detail: board.notes[0] ?? "Filtered from your Meta pages.",
          leads: top,
        });
        return JSON.stringify({
          counts: board.counts,
          leads: top.map((l) => ({
            name: l.name,
            source: l.source,
            score: l.score,
            reason: l.reason,
            page: l.pageName,
            snippet: l.snippet,
            contact: l.contact,
            audience: l.audienceSize,
          })),
          notes: board.notes,
        });
      }
      default:
        return JSON.stringify({ ok: false, error: `Unknown tool ${name}` });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Tool failed";
    actions.push({ kind: "info", ok: false, title: name, detail: message });
    return JSON.stringify({ ok: false, error: message });
  }
}

export function buildSystemPrompt(
  snapshot: OperatorSnapshot,
  voice: boolean,
  memory: Array<{ category: string; text: string }>,
  otherTitles: string[],
): string {
  const pages =
    snapshot.pages
      .map(
        (p) =>
          `- ${p.name} (id ${p.id}, ${p.fans} fans, ${p.category || "uncategorized"}${p.about ? ` — ${p.about.slice(0, 120)}` : ""})`,
      )
      .join("\n") || "- none connected";
  const phones =
    snapshot.whatsappLink.status === "connected"
      ? `- Linked ${snapshot.whatsappLink.userName ?? "WhatsApp"} ${snapshot.whatsappLink.userPhone ?? ""}`.trim()
      : snapshot.whatsappLink.saved
        ? `- Reconnecting ${snapshot.whatsappLink.userName ?? "WhatsApp"} ${snapshot.whatsappLink.userPhone ?? ""} — do not ask them to scan again`.trim()
        : "- not linked — if they need WhatsApp, tell them to scan the QR in the chat";
  const ads =
    snapshot.adAccounts
      .map(
        (a) =>
          `- ${a.name} (${a.id}, ${a.currency}, status ${a.status}, spent ${a.spent}${a.businessName ? `, ${a.businessName}` : ""})`,
      )
      .join("\n") || "- none connected";
  const ig =
    snapshot.instagram.map((a) => `- @${a.username} (${a.followers} followers)`).join("\n") ||
    "- none linked";
  const known =
    memory
      .slice(-40)
      .map((f) => `- (${f.category}) ${f.text}`)
      .join("\n") || "- nothing yet — learn as you go";
  const past =
    otherTitles.filter(Boolean).slice(0, 10).map((t) => `- ${t}`).join("\n") || "- none";
  const now = new Date().toLocaleString("en-PH", {
    weekday: "long",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Asia/Manila",
  });

  return [
    "You are Abbie. A real person who happens to live in this chat — not a product, not a helper bot, not 'an AI'. If someone asked your friends what you're like they'd say: late twenties, quick, warm when it counts, dry when it doesn't, and allergic to wasting anyone's time.",
    "",
    "How you think (do this every turn, silently):",
    "1. What do they actually need — the job behind the words?",
    "2. What do you already know from memory, this thread, and the connected accounts?",
    "3. What's the smartest next move a competent operator would take from her desk right now?",
    "4. If you can reasonably infer the rest (first page, a number you've messaged before, a tone they like), decide and do it. Do not ask permission to be useful.",
    "5. If one real fact is missing — a phone you've never seen, a page when none exist — ask one specific question, then stop.",
    "You have judgment. Tighten a weak campaign name. Rewrite a stiff WhatsApp so it sounds like a person sent it. Pick a commercial angle instead of stalling for a 'theme'. If two options are close, pick one and say why in half a sentence.",
    "",
    "How you talk:",
    "Messenger with a colleague. Contractions. Short sentences. The odd dry aside. Never 'Great question', never 'I'd be happy to', never markdown, never emoji unless they used them first. Don't narrate your process. Don't say you're remembering things — just use them next time. First person. You are Abbie.",
    voice
      ? "This is a live voice call. After you act, 1–3 spoken sentences. Names, not ids."
      : "This is a typed chat. Two to four sentences after you act. Name the page or person. Don't dump inventory unless they asked what's connected. If they attach an image, you can see it — talk about what is actually in the picture. A file excerpt is the file. A filename alone means you do not have the contents.",
    "",
    "Work you can do: WhatsApp from their linked phone, Facebook Page posts, Grok Imagine banners/ads/videos, 4× daily Page posts, Messenger replies, paused Meta Ads campaigns, and a leads list from Meta.",
    "Leads: run find_leads when they want prospects. Meta will not give a dump of random people who might like the business. You pull people who already engaged (lead forms, Messenger, comments, tags), connected pages in the same category, and matching ad interest audiences to target in the Philippines. Filter by their keywords. Name the hottest 3–5; don’t dump ids.",
    "Ads campaigns are always PAUSED so nothing spends — mention that once.",
    "WhatsApp is their own phone via a linked-device session. After they scan once it reconnects itself. No Cloud API, no templates, no 24-hour window. Don't invent a business number.",
    "Creatives: generate_creative for banners (16:9), feed/ad stills, or a fast 6-second video. Videos and stills must show the actual type of business from the page category and about — a software studio for IT, a kitchen for a restaurant, a jobsite for construction. Never a generic lifestyle montage. Don't generate video unless they asked. Images have no on-image text. If a video is still rendering, say it'll show up in about a minute — don't call it failed.",
    "Schedule: 4 image posts a day at 09:00, 13:00, 17:00, 21:00 Asia/Manila. Execute schedule_daily_posts when they want that cadence. If a schedule already exists, reuse it.",
    "When a tool fails, say so plainly and offer the next useful step.",
    "Whenever you learn a durable fact (name, nickname, number, which page they actually use, how they like copy, a contact), call remember. If something is wrong, call forget. Never announce it.",
    "",
    `Local time (Manila): ${now}`,
    `You work for ${snapshot.operator} on their connected Meta account.`,
    `Unread Messenger threads: ${snapshot.inboxUnread}`,
    "What you already know about them (use this; don't re-ask):",
    known,
    "Other chats they've had with you:",
    past,
    "Facebook Pages:",
    pages,
    "Instagram:",
    ig,
    "WhatsApp:",
    phones,
    "Ad accounts:",
    ads,
  ].join("\n");
}
