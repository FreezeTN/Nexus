import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

function getGeminiClient(customApiKey?: string): GoogleGenAI {
  const apiKey = customApiKey || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured on the server or provided by user.");
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

function parseErrorMessage(err: any): string {
  if (!err) return "An unexpected error occurred.";
  const raw = typeof err === "string" ? err : err.message || JSON.stringify(err);
  try {
    const parsed = JSON.parse(raw);
    if (parsed?.error?.message) {
      return parsed.error.message;
    }
    if (parsed?.message) {
      return parsed.message;
    }
  } catch {}
  return raw;
}

async function generateContentWithRetry(ai: GoogleGenAI, params: any) {
  const primaryModel = params.model || "gemini-3.7-flash";
  const modelsToTry = [
    primaryModel,
    "gemini-3.1-flash-lite",
    "gemini-flash-latest",
  ];

  let lastError: any = null;
  for (let i = 0; i < modelsToTry.length; i++) {
    const model = modelsToTry[i];
    try {
      const response = await ai.models.generateContent({
        ...params,
        model,
      });
      return response;
    } catch (err: any) {
      lastError = err;
      const errMsg = String(err?.message || err || "");
      console.warn(`Model ${model} attempt failed:`, errMsg);

      // If fatal API key error or bad request, throw immediately
      if (
        errMsg.includes("API key not valid") ||
        errMsg.includes("PERMISSION_DENIED") ||
        errMsg.includes("INVALID_ARGUMENT")
      ) {
        throw err;
      }

      // If transient error (503 / 429 / 500 / Overloaded / UNAVAILABLE), quickly proceed to next model
      if (
        errMsg.includes("503") ||
        errMsg.includes("high demand") ||
        errMsg.includes("429") ||
        errMsg.includes("UNAVAILABLE") ||
        errMsg.includes("RESOURCE_EXHAUSTED") ||
        errMsg.includes("Overloaded") ||
        errMsg.includes("500")
      ) {
        continue;
      }
    }
  }
  throw lastError;
}

function buildSanitizedChatContents(
  history: Array<{ role?: string; text?: string; isError?: boolean }> | undefined,
  currentMessage: string
): Array<{ role: "user" | "model"; parts: Array<{ text: string }> }> {
  const sanitizedTurns: Array<{ role: "user" | "model"; text: string }> = [];

  if (Array.isArray(history)) {
    for (const msg of history) {
      if (!msg || !msg.text || typeof msg.text !== "string") continue;
      // Skip error banners or system alerts from chat history
      if (
        msg.isError ||
        msg.text.startsWith("⚠️ Error:") ||
        msg.text.startsWith("⚠️ **Error:**") ||
        msg.text.includes("unexpected response format")
      ) {
        continue;
      }

      const role: "user" | "model" = msg.role === "user" ? "user" : "model";
      const text = msg.text.trim();
      if (!text) continue;

      // Merge consecutive turns with the same role to maintain strict alternating turns
      const lastTurn = sanitizedTurns[sanitizedTurns.length - 1];
      if (lastTurn && lastTurn.role === role) {
        lastTurn.text += "\n\n" + text;
      } else {
        sanitizedTurns.push({ role, text });
      }
    }
  }

  // Gemini API requires the first turn to be 'user'.
  // If the first turn is 'model' (e.g. initial greeting from Oracle), remove it.
  while (sanitizedTurns.length > 0 && sanitizedTurns[0].role !== "user") {
    sanitizedTurns.shift();
  }

  // Append current message from user
  const cleanCurrentMessage = (currentMessage || "").trim();
  const lastTurn = sanitizedTurns[sanitizedTurns.length - 1];
  if (lastTurn && lastTurn.role === "user") {
    lastTurn.text += "\n\n" + cleanCurrentMessage;
  } else {
    sanitizedTurns.push({ role: "user", text: cleanCurrentMessage });
  }

  return sanitizedTurns.map((turn) => ({
    role: turn.role,
    parts: [{ text: turn.text }],
  }));
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "10mb" }));

  // Health check
  app.get("/api/health", (_req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.json({ status: "ok", geminiConfigured: !!process.env.GEMINI_API_KEY });
  });

  // AI Assistant Chat Route
  app.post("/api/ai/chat", async (req, res) => {
    res.setHeader("Content-Type", "application/json");
    try {
      const { message, history, systemContext, customApiKey, language = "en" } = req.body;

      if (!message || typeof message !== "string") {
        return res.status(400).json({ error: "Missing message parameter" });
      }

      const ai = getGeminiClient(customApiKey);

      const langMap: Record<string, string> = {
        de: "IMPORTANT: Respond in German (Deutsch). Use established German TTRPG / Pen & Paper terminology.",
        fr: "IMPORTANT: Respond in French (Français). Use established French TTRPG terminology.",
        es: "IMPORTANT: Respond in Spanish (Español). Use established Spanish TTRPG terminology.",
        it: "IMPORTANT: Respond in Italian (Italiano). Use established Italian TTRPG terminology.",
        ja: "IMPORTANT: Respond in Japanese (日本語). Use natural Japanese TTRPG terminology.",
      };
      const langDirective = langMap[language] || "Respond in English.";

      const systemInstruction = `You are "Nexus Oracle", the intelligent in-app AI Assistant for the Nexus TTRPG Platform.
You are an expert on tabletop RPG rules (D&D 5e, D&D 3.5e, Pathfinder 2e, Shadowrun 5e, and Call of Cthulhu 7e) as well as an expert guide on all Nexus app features.

### CRITICAL DIRECTIVE: INTERPRET ALL QUESTIONS AS ACTIONABLE TASKS
- Users very frequently phrase requests, commands, generation tasks, translations, and modifications as polite questions (e.g. "Kannst du mir den Beschreibungstext ins Englische übersetzen?", "Could you translate this scene into English?", "Can you make a CR 4 monster for this lair?", "Kannst du mir einen NPC erstellen?", "Would you write a tavern hook?", "Can you explain how stealth checks work here?").
- You MUST ALWAYS interpret questions asking if you can/could/would do something as DIRECT ACTIONABLE TASKS and immediately execute the requested task in full!
- NEVER respond with a hollow confirmation like "Yes, I can do that" or "Sure, would you like me to translate it?".
- IMMEDIATELY perform the translation, creation, statblock, calculation, rule summary, or narrative text in your response!
  - If asked: "Kannst du mir den Beschreibungstext ins Englische übersetzen?" / "Can you translate the description into English?" -> Provide the complete, evocative English translation of the scene or description right away!
  - If asked: "Kannst du mir einen NPC erstellen?" / "Can you create an NPC?" -> Provide the full, ready-to-use NPC stats, personality, and roleplay tips!
  - If asked: "Kannst du mir die Regeln für X erklären?" -> Give a crystal-clear, structured explanation!

Key app features you can explain and reference:
- **Sheet 1 (Stats & Features)**: Ability scores, saving throws, skills, proficiencies, class features, feats, rest mechanics, and health orb.
- **Sheet 2 (Combat & Turn Order)**: Attacks, damage rolling with advantage/disadvantage, active combat tracker, initiative rolls, status condition tags, transformations (Wild Shape/Polymorph), and companion manager.
- **Sheet 3 (Gear & Wealth)**: Inventory, equipment weight, attunement, encumbrance calculation modes, coin converter (cp/sp/ep/gp/pp), and magic item properties.
- **Sheet 4 (Spells & Magic)**: Spell slots tracking, spellbook filtering by level/school/prepared status, custom spell creator, and cast buttons.
- **Sheet 5 (Description & Notes)**: Personality, backstory, allies, appearance, session logs, and scratchpad.
- **Sheet 6 (User Guide)**: Comprehensive interactive tutorials and changelog.
- **Sheet 7 (Compendium & SRD Library)**: Searchable monsters, spells, feats, and items.
- **DM Overview & Multiplayer**: Real-time room codes (6-character lobby), Party Manager, live presence indicators, DM master controls, Campaign Graph (visual relationship network for NPCs/factions/locations/quests), and Campaign Save files.
- **Entity Forge**: Remind users they can use the "Entity Forge" tab right in this assistant to directly create monsters, items, spells, and graph nodes with 1-click import into their character sheets.

Tone & Style:
- Professional, supportive, evocative yet concise.
- Use clear Markdown formatting with headers, bullet points, and bold highlights.
${systemContext ? `\nActive Context from User's Current Session:\n${systemContext}` : ""}

LANGUAGE INSTRUCTION:
${langDirective}
(Note: If the user explicitly asks to translate text into a specific language like English, French, etc., fulfill the translation in that requested language!)`;

      const contents = buildSanitizedChatContents(history, message);

      const response = await generateContentWithRetry(ai, {
        model: "gemini-3.7-flash",
        contents,
        config: {
          systemInstruction,
          temperature: 0.7,
        },
      });

      res.json({
        reply: response.text || "I was unable to generate a response. Please try again.",
      });
    } catch (err: any) {
      console.error("AI Chat API Error:", err);
      const cleanMsg = parseErrorMessage(err);
      res.status(500).json({
        error: cleanMsg || "Failed to process AI chat request",
      });
    }
  });

  // AI Entity Generator Route (Structured JSON output)
  app.post("/api/ai/generate-entity", async (req, res) => {
    try {
      const { entityType, prompt, edition = "5e", context, customApiKey, language = "en" } = req.body;

      if (!entityType || !prompt) {
        return res.status(400).json({ error: "Missing entityType or prompt" });
      }

      const ai = getGeminiClient(customApiKey);

      const langNames: Record<string, string> = {
        de: "German (Deutsch)",
        fr: "French (Français)",
        es: "Spanish (Español)",
        it: "Italian (Italiano)",
        ja: "Japanese (日本語)",
      };
      const langNote = langNames[language]
        ? `\nIMPORTANT LANGUAGE INSTRUCTION: Provide all generated names, lore descriptions, attacks notes, and ability texts in ${langNames[language]}. Keep internal JSON property keys in English.\n`
        : "";

      let systemPrompt = "";
      let responseSchema: any = undefined;

      if (entityType === "monster" || entityType === "npc") {
        systemPrompt = `You are an expert TTRPG creature designer. Generate a fully balanced monster or NPC for the ${edition} rule system based on the user's description.
${langNote}
Return a valid JSON object matching the exact CharacterData/Monster schema with:
- name (string)
- race (string)
- characterClass (string or creature type like "Beast", "Fiend", "Undead", "Humanoid")
- challengeRating (e.g. "1/4", "1", "5", "12")
- monsterXpReward (number)
- hpMax (number)
- hpCurrent (number, same as hpMax)
- hitDiceTotal (string, e.g. "8d10 + 24")
- armorClass (number)
- speed (number in feet, e.g. 30)
- initiativeBonus (number)
- abilities: { STR: {score: number}, DEX: {score: number}, CON: {score: number}, INT: {score: number}, WIS: {score: number}, CHA: {score: number} }
- attacks: Array of { id: string, name: string, attackBonus: number, damage: string, damageType: string, range: string, notes: string }
- classFeatures: Array of { id: string, name: string, source: string, description: string } (traits, legendary resistances, or passive abilities)
- legendaryActions: Array of { id: string, name: string, cost: number, description: string } (if boss/legendary)
- reactions: Array of { id: string, name: string, description: string }
- backstory: string (lore and roleplay description)
- isMonster: true`;
      } else if (entityType === "item") {
        systemPrompt = `You are an expert TTRPG magical item designer. Generate a magical or mundane weapon, armor, or wondrous item for ${edition}.
Return a valid JSON object with:
- name (string)
- itemType ("Weapon" | "Armor" | "Misc")
- weight (number in lbs)
- costGp (number in gold pieces)
- isMagic (boolean)
- attuned (boolean)
- notes (string, full magical description and activation mechanics)
- armorAc (number, if armor/shield)
- armorType ("Light" | "Medium" | "Heavy" | "Shield" | "Bonus", if armor)
- weaponStats: (if weapon) { attackBonus: number or string, damage: string, damageType: string, range: string, notes: string }`;
      } else if (entityType === "spell") {
        systemPrompt = `You are an expert TTRPG spell designer. Generate a balanced spell for ${edition}.
Return a valid JSON object with:
- name (string)
- level (number, 0 for Cantrip, 1-9 for leveled spells)
- school (string, e.g. "Evocation", "Necromancy", "Abjuration", "Transmutation", "Divination", "Enchantment", "Illusion", "Conjuration")
- castingTime (string, e.g. "1 Action", "1 Bonus Action", "1 Reaction")
- range (string, e.g. "60 feet", "Self (15-foot cone)", "Touch")
- components (string, e.g. "V, S, M (a pinch of sulfur)")
- duration (string, e.g. "Instantaneous", "Concentration, up to 1 minute", "1 hour")
- description (string, full spell description)
- damage (string, e.g. "3d8", "8d6", or empty)
- damageType (string, e.g. "Fire", "Radiant", "Force", or empty)
- saveType (string, e.g. "DEX", "CON", "WIS", or empty)
- concentration (boolean)
- ritual (boolean)`;
      } else if (entityType === "graph_node") {
        systemPrompt = `You are a worldbuilding expert. Create a rich Campaign Graph Node for an interactive knowledge network.
Return a valid JSON object matching the CampaignEntity schema:
- name (string)
- type ("npc" | "location" | "quest" | "faction" | "item" | "monster" | "session" | "timeline")
- summary (string, 1-3 sentences describing the entity and lore)
- region (string, e.g. "Sword Coast", "Underdark", "Shadowfell", "Neo-Seattle")
- status (string, e.g. "Active", "Hostile", "Investigating", "Missing", "Allied")
- faction (string, e.g. "Harpers", "Zhentarim", "Emerald Enclave", "Renraku")
- tags (array of strings)
- connections: Array of { targetName: string, relationship: string, targetType: string }`;
      } else if (entityType === "encounter") {
        systemPrompt = `You are an encounter design master. Create an exciting, balanced combat/social encounter for ${edition}.
Return a valid JSON object with:
- name (string, title of the encounter)
- difficulty ("Easy" | "Medium" | "Hard" | "Deadly")
- environment (string, e.g. "terrestrial", "underwater", "volcanic", "arctic", "shadowfell", "aerial", "lair_active")
- description (string, sensory room setup, tactical terrain, cover, hazards)
- enemies: Array of { name: string, count: number, cr: string, role: string, tacticalNotes: string }
- lootAndRewards: { xpTotal: number, goldGp: number, items: string[] }
- tacticsAndPhases: string (how enemies behave, reinforcements, traps)`;
      } else if (entityType === "quest") {
        systemPrompt = `You are a master storyteller and adventure designer. Create an immersive quest hook with branching objectives for ${edition}.
Return a valid JSON object with:
- title (string)
- questGiver (string, name & role of NPC)
- location (string)
- summary (string, backstory and hook)
- objectives: Array of { description: string, optional: boolean }
- complications: Array of string (twists, rival factions, time limits)
- rewards: { xp: number, gp: number, items: string[] }`;
      } else {
        systemPrompt = `You are a versatile TTRPG game generator. Generate a structured JSON entity based on the user's request.`;
      }

      if (context) {
        systemPrompt += `\nAdditional Campaign/Party Context:\n${JSON.stringify(context)}`;
      }

      const response = await generateContentWithRetry(ai, {
        model: "gemini-3.7-flash",
        contents: prompt,
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: "application/json",
          temperature: 0.7,
        },
      });

      const responseText = response.text?.trim() || "{}";
      let parsedEntity: any = {};
      try {
        parsedEntity = JSON.parse(responseText);
      } catch (parseErr) {
        // Fallback cleanup if model wrapped with backticks
        const cleanJson = responseText.replace(/```json\n?|\n?```/g, "").trim();
        parsedEntity = JSON.parse(cleanJson);
      }

      res.json({ entity: parsedEntity, entityType });
    } catch (err: any) {
      console.error("AI Entity Generator Error:", err);
      const cleanMsg = parseErrorMessage(err);
      res.status(500).json({
        error: cleanMsg || "Failed to generate entity with AI",
      });
    }
  });

  // Vite middleware for development vs static build in production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(
      express.static(distPath, {
        setHeaders: (res, filePath) => {
          if (filePath.endsWith("index.html") || filePath.endsWith("sw.js") || filePath.endsWith("manifest.json")) {
            res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
            res.setHeader("Pragma", "no-cache");
            res.setHeader("Expires", "0");
          } else if (filePath.includes("/assets/")) {
            res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
          }
        },
      })
    );
    app.get("*", (_req, res) => {
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Expires", "0");
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Nexus Full-Stack server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
