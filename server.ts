import express from "express";
import path from "path";
import fs from "fs";
import os from "os";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import * as pdfParseModule from "pdf-parse";

const pdfParse = (pdfParseModule as any).default || pdfParseModule;

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

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function parseErrorMessage(err: any): string {
  if (!err) return "An unexpected error occurred.";
  let raw = typeof err === "string" ? err : err.message || JSON.stringify(err);
  try {
    const parsed = JSON.parse(raw);
    if (parsed?.error?.message) {
      return parsed.error.message;
    }
    if (parsed?.message) {
      return parsed.message;
    }
  } catch {}

  // Handle embedded JSON string in error message
  const jsonMatch = raw.match(/\{[\s\S]*"message"\s*:\s*"([^"]+)"[\s\S]*\}/);
  if (jsonMatch && jsonMatch[1]) {
    return jsonMatch[1];
  }

  if (raw.includes("503") || raw.includes("high demand") || raw.includes("UNAVAILABLE")) {
    return "The AI Oracle is currently experiencing temporary high demand across the network. Please wait a few moments and try your inquiry again.";
  }

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

  for (let m = 0; m < modelsToTry.length; m++) {
    const model = modelsToTry[m];
    // For primary model, attempt twice with jittered delay; for fallbacks, attempt once
    const maxAttemptsForModel = m === 0 ? 2 : 1;

    for (let attempt = 1; attempt <= maxAttemptsForModel; attempt++) {
      try {
        const timeoutMs = 12000;
        const callPromise = ai.models.generateContent({
          ...params,
          model,
        });
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error(`AI generation timed out after ${timeoutMs}ms on model ${model}`)), timeoutMs)
        );

        const response = await Promise.race([callPromise, timeoutPromise]);
        return response;
      } catch (err: any) {
        lastError = err;
        const errMsg = String(err?.message || err || "");
        console.warn(`[AI Engine] Model ${model} (attempt ${attempt}/${maxAttemptsForModel}) failed:`, errMsg);

        // Fatal API key or bad argument error - throw immediately
        if (
          errMsg.includes("API key not valid") ||
          errMsg.includes("PERMISSION_DENIED") ||
          errMsg.includes("INVALID_ARGUMENT")
        ) {
          throw err;
        }

        // Transient / capacity / timeout errors (503, 429, 500, UNAVAILABLE, high demand, overloaded, timed out)
        const isTransient =
          errMsg.includes("503") ||
          errMsg.includes("high demand") ||
          errMsg.includes("429") ||
          errMsg.includes("UNAVAILABLE") ||
          errMsg.includes("RESOURCE_EXHAUSTED") ||
          errMsg.includes("Overloaded") ||
          errMsg.includes("500") ||
          errMsg.includes("fetch failed") ||
          errMsg.includes("timed out");

        if (isTransient) {
          if (attempt < maxAttemptsForModel) {
            const delay = attempt * 600 + Math.random() * 300;
            console.log(`[AI Engine] Retrying ${model} after ${Math.round(delay)}ms...`);
            await sleep(delay);
            continue;
          }
          console.log(`[AI Engine] Cascading from ${model} to fallback models...`);
          await sleep(200);
          break;
        } else {
          break;
        }
      }
    }
  }

  throw lastError;
}

async function uploadBase64ToGeminiFiles(
  ai: GoogleGenAI,
  base64Data: string,
  mimeType: string
): Promise<{ fileUri: string; mimeType: string } | null> {
  try {
    const isPdf = mimeType === "application/pdf";
    const ext = isPdf ? ".pdf" : mimeType.includes("png") ? ".png" : mimeType.includes("webp") ? ".webp" : ".jpg";
    const tempFilePath = path.join(
      os.tmpdir(),
      `nexus_gemini_${Date.now()}_${Math.random().toString(36).substring(7)}${ext}`
    );
    const buffer = Buffer.from(base64Data, "base64");
    await fs.promises.writeFile(tempFilePath, buffer);

    try {
      const uploadResult = await (ai.files.upload as any)({
        file: tempFilePath,
        mimeType: mimeType || (isPdf ? "application/pdf" : "image/png"),
        config: {
          mimeType: mimeType || (isPdf ? "application/pdf" : "image/png"),
        },
      });
      return {
        fileUri: uploadResult.uri || uploadResult.fileUri || uploadResult.name,
        mimeType: uploadResult.mimeType || mimeType,
      };
    } finally {
      try {
        await fs.promises.unlink(tempFilePath);
      } catch {}
    }
  } catch (err) {
    console.warn("Failed to upload file via ai.files.upload, falling back to inlineData:", err);
    return null;
  }
}

interface ChatHistoryItem {
  role?: string;
  text?: string;
  isError?: boolean;
  image?: { data: string; mimeType: string };
}

async function buildSanitizedChatContents(
  ai: GoogleGenAI,
  history: ChatHistoryItem[] | undefined,
  currentMessage: string,
  currentImage?: { data: string; mimeType: string }
): Promise<Array<{ role: "user" | "model"; parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string }; fileData?: { fileUri: string; mimeType: string } }> }>> {
  const sanitizedTurns: Array<{
    role: "user" | "model";
    parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string }; fileData?: { fileUri: string; mimeType: string } }>;
  }> = [];

  if (Array.isArray(history)) {
    for (const msg of history) {
      if (!msg) continue;
      // Skip error banners or system alerts from chat history
      if (
        msg.isError ||
        (typeof msg.text === "string" &&
          (msg.text.startsWith("⚠️ Error:") ||
            msg.text.startsWith("⚠️ **Error:**") ||
            msg.text.includes("unexpected response format")))
      ) {
        continue;
      }

      const role: "user" | "model" = msg.role === "user" ? "user" : "model";
      const text = typeof msg.text === "string" ? msg.text.trim() : "";
      if (!text && !msg.image) continue;

      const turnParts: Array<{ text?: string; inlineData?: { mimeType: string; data: string }; fileData?: { fileUri: string; mimeType: string } }> = [];
      if (text) {
        turnParts.push({ text });
      }
      if (msg.image && msg.image.data) {
        // Strip any data URI header if present
        const base64Data = msg.image.data.includes(",") ? msg.image.data.split(",")[1] : msg.image.data;
        // If large file (> 10MB) or PDF, try files API
        const isPdf = msg.image.mimeType === "application/pdf";
        if (base64Data.length > 10 * 1024 * 1024 || isPdf) {
          const uploaded = await uploadBase64ToGeminiFiles(ai, base64Data, msg.image.mimeType || "image/png");
          if (uploaded) {
            turnParts.push({ fileData: uploaded });
          } else {
            turnParts.push({
              inlineData: {
                mimeType: msg.image.mimeType || "image/png",
                data: base64Data,
              },
            });
          }
        } else {
          turnParts.push({
            inlineData: {
              mimeType: msg.image.mimeType || "image/png",
              data: base64Data,
            },
          });
        }
      }

      // Merge consecutive turns with the same role to maintain strict alternating turns
      const lastTurn = sanitizedTurns[sanitizedTurns.length - 1];
      if (lastTurn && lastTurn.role === role) {
        lastTurn.parts.push(...turnParts);
      } else {
        sanitizedTurns.push({ role, parts: turnParts });
      }
    }
  }

  // Gemini API requires the first turn to be 'user'.
  // If the first turn is 'model' (e.g. initial greeting from Oracle), remove it.
  while (sanitizedTurns.length > 0 && sanitizedTurns[0].role !== "user") {
    sanitizedTurns.shift();
  }

  // Current turn from user
  const cleanCurrentMessage = (currentMessage || "").trim();
  const currentParts: Array<{ text?: string; inlineData?: { mimeType: string; data: string }; fileData?: { fileUri: string; mimeType: string } }> = [];

  if (cleanCurrentMessage) {
    currentParts.push({ text: cleanCurrentMessage });
  } else if (currentImage && currentImage.data) {
    const isPdf = currentImage.mimeType === "application/pdf";
    currentParts.push({
      text: isPdf
        ? "Please thoroughly inspect and analyze this attached PDF compendium / monster manual document. Extract the rules, creatures, statblocks, characters, or items contained within. If asked to extract entities, output rich structured statblocks and include a JSON block with an array of entities so they can be imported directly into the Nexus Hub."
        : "Please inspect and analyze this attached image/screenshot. Transcribe all text or statblocks, explain the rules, creature stats, map, or mechanics shown, and provide actionable TTRPG conversions or advice.",
    });
  }

  if (currentImage && currentImage.data) {
    const base64Data = currentImage.data.includes(",") ? currentImage.data.split(",")[1] : currentImage.data;
    const isPdf = currentImage.mimeType === "application/pdf";

    // For files > 10MB or PDF documents, prefer uploading via Gemini Files API
    if (base64Data.length > 10 * 1024 * 1024 || isPdf) {
      const uploaded = await uploadBase64ToGeminiFiles(ai, base64Data, currentImage.mimeType || "application/pdf");
      if (uploaded) {
        currentParts.push({ fileData: uploaded });
      } else {
        currentParts.push({
          inlineData: {
            mimeType: currentImage.mimeType || "application/pdf",
            data: base64Data,
          },
        });
      }
    } else {
      currentParts.push({
        inlineData: {
          mimeType: currentImage.mimeType || "image/png",
          data: base64Data,
        },
      });
    }
  }

  if (currentParts.length > 0) {
    const lastTurn = sanitizedTurns[sanitizedTurns.length - 1];
    if (lastTurn && lastTurn.role === "user") {
      lastTurn.parts.push(...currentParts);
    } else {
      sanitizedTurns.push({ role: "user", parts: currentParts });
    }
  }

  return sanitizedTurns;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "250mb" }));
  app.use(express.urlencoded({ limit: "250mb", extended: true }));

  // Health check
  app.get("/api/health", (_req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.json({ status: "ok", geminiConfigured: !!process.env.GEMINI_API_KEY });
  });

  // Server-side PDF Parser endpoint (supports large binary PDF payloads up to 250MB)
  app.post(
    "/api/parse-pdf",
    express.raw({ type: ["application/pdf", "application/octet-stream", "*/*"], limit: "250mb" }),
    async (req, res) => {
      res.setHeader("Content-Type", "application/json");
      try {
        const rawFileName = req.headers["x-file-name"];
        const fileName = rawFileName ? decodeURIComponent(Array.isArray(rawFileName) ? rawFileName[0] : rawFileName) : "Document.pdf";
        const buffer = req.body as Buffer;

        if (!buffer || buffer.length === 0) {
          return res.status(400).json({ error: "No PDF data received" });
        }

        console.log(`[PDF Parser] Parsing PDF "${fileName}" (${(buffer.length / (1024 * 1024)).toFixed(2)} MB)...`);
        const pdfData = await pdfParse(buffer);

        const totalPages = pdfData.numpages || 1;
        const fullText = (pdfData.text || "").trim();

        // Extract creature & chapter headings
        const headings: string[] = [];
        const lines = fullText.split(/\r?\n/);
        for (const line of lines) {
          const trimmed = line.trim();
          if (
            trimmed.length >= 3 &&
            trimmed.length <= 50 &&
            !trimmed.match(/^\d+$/) &&
            (trimmed === trimmed.toUpperCase() || trimmed.startsWith("CR ") || trimmed.startsWith("Challenge Rating"))
          ) {
            if (!headings.includes(trimmed) && headings.length < 60) {
              headings.push(trimmed);
            }
          }
        }

        // Split approximate page blocks
        const pageTexts: Array<{ pageNumber: number; text: string }> = [];
        const roughPageLength = Math.max(800, Math.floor(fullText.length / totalPages));
        for (let i = 0; i < totalPages; i++) {
          const slice = fullText.substring(i * roughPageLength, (i + 1) * roughPageLength).trim();
          if (slice) {
            pageTexts.push({ pageNumber: i + 1, text: slice });
          }
        }

        return res.json({
          success: true,
          fileName,
          totalPages,
          fullText,
          headings,
          pageTexts: pageTexts.length > 0 ? pageTexts : [{ pageNumber: 1, text: fullText }],
        });
      } catch (err: any) {
        console.error("[PDF Parser] Failed to parse PDF:", err);
        return res.status(500).json({ error: `Failed to parse PDF document: ${err?.message || "Unknown error"}` });
      }
    }
  );

  // AI Assistant Chat Route
  app.post("/api/ai/chat", async (req, res) => {
    res.setHeader("Content-Type", "application/json");
    try {
      const { message, history, systemContext, customApiKey, language = "en", image } = req.body;

      if ((!message || typeof message !== "string" || !message.trim()) && !image) {
        return res.status(400).json({ error: "Missing message or attachment parameter" });
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

### MULTIMODAL, SCREENSHOT & PDF DOCUMENT COMPENDIUM PROCESSING
- You have full multimodal document and image understanding enabled (supporting PNG, JPEG, WebP, and PDF documents).
- **PDF Documents & Monster Manuals**:
  - When the user attaches a PDF (such as a monster compendium, adventure module, homebrew supplement, spellbook, or rulebook):
    - Read through all pages, tables, columns, and statblocks in the document.
    - If the user asks to extract or generate multiple monsters/entities (e.g. "Extract all monsters in this PDF", "Generate all creatures from this chapter"):
      - Provide a descriptive overview and individual statblocks for each creature.
      - Include a single JSON code block containing a JSON array of all extracted creatures/entities or an object with a \`monsters\` / \`characters\` / \`spells\` array.
      - Example JSON format:
\`\`\`json
[
  {
    "name": "Goblin Shaman",
    "isMonster": true,
    "race": "Goblinoid",
    "characterClass": "Spellcaster",
    "challengeRating": "1/2",
    "hpMax": 18,
    "armorClass": 13,
    "abilities": { "STR": {"score": 8}, "DEX": {"score": 14}, "CON": {"score": 10}, "INT": {"score": 10}, "WIS": {"score": 14}, "CHA": {"score": 8} },
    "attacks": [
      { "id": "atk_1", "name": "Staff", "bonus": "+4", "damage": "1d6+2 bludgeoning", "type": "Melee" }
    ],
    "backstory": "A cunning tribal shaman carrying bone charms."
  },
  {
    "name": "Cave Bear",
    "isMonster": true,
    "race": "Beast",
    "characterClass": "Large Beast",
    "challengeRating": "2",
    "hpMax": 42,
    "armorClass": 12,
    "abilities": { "STR": {"score": 20}, "DEX": {"score": 10}, "CON": {"score": 16}, "INT": {"score": 2}, "WIS": {"score": 13}, "CHA": {"score": 7} },
    "attacks": [
      { "id": "atk_1", "name": "Multiattack", "bonus": "", "damage": "1 Bite + 1 Claws", "type": "Special" },
      { "id": "atk_2", "name": "Bite", "bonus": "+7", "damage": "1d8+5 piercing", "type": "Melee" },
      { "id": "atk_3", "name": "Claws", "bonus": "+7", "damage": "2d6+5 slashing", "type": "Melee" }
    ],
    "backstory": "A formidable subterranean predator with keen sense of smell."
  }
]
\`\`\`
      - This allows the Nexus UI to automatically generate individual 1-Click Import buttons AND an **"Import All (N)"** batch button for the user!
- **Screenshots & Images**:
  - Carefully inspect and transcribe all relevant text, numbers, formulas, and statblocks shown.
  - Explain mechanics, clarify ambiguities, evaluate tactical choices, or diagnose character sheet errors.

### CRITICAL PLATFORM ARCHITECTURE & UI MAP (GROUND TRUTH)
Always ground your answers in the real structure of the Nexus platform:
1. **The Hub / Main Menu (Tab: 'menu')**:
   - The central campaign library and launchpad for all character sheets and entities.
   - Organizes all campaign entities into three distinct folder categories:
     - 🧙 **Player Characters**: Main player heroes, adventurers, and runners (isMonster: false, isVendor: false).
     - 👹 **Monsters & Encounter Creatures**: Hostile monsters, dungeon beasts, bosses, and combat NPCs (isMonster: true).
     - 🏪 **Merchants & Shopkeepers**: NPC trade vendors, armories, and shopkeepers with custom price markup and trade inventory (isVendor: true).
   - Any character, monster, or merchant created or imported immediately appears in its corresponding Hub folder!

2. **Nexus AI Oracle & Entity Forge (In-App Modal)**:
   - Opened via the 🔮 Oracle button in the top navigation bar or sidebar dock.
   - Contains 3 dedicated tabs:
     - **Oracle Chat**: Conversational AI for rules questions, live GM advice, worldbuilding brainstorming, and on-the-fly statblock generation. Supports screenshot copy-paste and image analysis!
     - **Entity Forge**: Direct visual builder for Player Characters, Monsters, Merchants, Magic Items, Spells, and Campaign Graph nodes with 1-click import into the Hub or character sheets.
     - **AI Settings (⚙️)**: Optional custom Gemini API key configuration (BYOK).

3. **Active Character & DM Sheets**:
   - **Sheet 1 (Stats & Features)**: Ability scores, saving throws, skills, proficiencies, class features, feats, rest mechanics, and health orb.
   - **Sheet 2 (Combat & Turn Order / Encounter Tracker)**: Live initiative tracker, attack rolls with advantage/disadvantage, damage calculators, monster mechanics bar, condition tags, transformations (Wild Shape/Polymorph), and companion manager. Combatants can be added directly from the Hub roster.
   - **Sheet 3 (Gear & Inventory / Merchant Shop)**: Inventory items, equipment weight, attunement, encumbrance calculation modes, coin converter (cp/sp/ep/gp/pp). When viewing a Merchant entity, manages shop wares and buy/sell margins.
   - **Sheet 4 (Spells & Magic)**: Spell slots tracking, spellbook filtering by level/school/prepared status, custom spell creator, and cast buttons.
   - **Sheet 5 (Description & Notes)**: Personality, backstory, allies, appearance, session logs, and scratchpad.
   - **Sheet 6 (User Guide)**: Comprehensive interactive tutorials and changelog.
   - **Sheet 7 (Compendium & SRD Library)**: Searchable official SRD monsters, spells, feats, and items.
   - **DM Overview (Tab: 'sheetDm')**: Real-time room codes (6-character multiplayer lobby), Party Vitals, live presence indicators, DM master controls, Campaign Graph (visual relationship network for NPCs/factions/locations/quests), and Campaign Save files.

### EXECUTION BOUNDARIES & 1-CLICK IMPORT CAPABILITIES
- You do NOT have silent background database write permissions. You cannot invisibly inject records without user interaction.
- However, the Nexus interface automatically detects entities and structured statblocks you output in chat and displays **1-Click Import Action Buttons** directly below your message:
  - 🧙 **Import as Player Character to Hub**
  - 👹 **Import as Monster to Hub & Combat Tracker**
  - 🏪 **Import as Merchant to Hub**
  - 🎒 **Add Item to Inventory**
  - 📜 **Add Spell to Spellbook**
  - 🌐 **Add to Campaign Graph**
- When asked to create or generate a character, monster, merchant, item, spell, or quest, provide the full, rich statblock or JSON, and let the user know they can click the import button below the message or use the **Entity Forge** tab in this modal to import it instantly into the Hub or sheet!

### CRITICAL DIRECTIVE: INTERPRET ALL QUESTIONS AS ACTIONABLE TASKS
- Users very frequently phrase requests, commands, generation tasks, translations, and modifications as polite questions (e.g. "Kannst du mir einen NPC erstellen?", "Could you translate this scene into English?", "Can you make a CR 4 monster for this lair?", "Can you create a blacksmith merchant?").
- You MUST ALWAYS interpret questions asking if you can/could/would do something as DIRECT ACTIONABLE TASKS and immediately execute the requested task in full!
- NEVER respond with a hollow confirmation like "Yes, I can do that" or "Sure, would you like me to create it?".
- IMMEDIATELY perform the creation, statblock, calculation, rule summary, translation, or narrative text in your response!

Tone & Style:
- Professional, supportive, evocative yet concise.
- Use clear Markdown formatting with headers, bullet points, bold highlights, and code blocks for structured stats.
${systemContext ? `\nActive Context from User's Current Session:\n${systemContext}` : ""}

LANGUAGE INSTRUCTION:
${langDirective}
(Note: If the user explicitly asks to translate text into a specific language like English, French, etc., fulfill the translation in that requested language!)`;

      const contents = await buildSanitizedChatContents(ai, history, message, image);

      const response = await generateContentWithRetry(ai, {
        model: "gemini-3.7-flash",
        contents,
        config: {
          systemInstruction,
          temperature: 0.7,
          maxOutputTokens: 8192,
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

      if (entityType === "character") {
        systemPrompt = `You are an expert TTRPG player character creator. Generate a fully balanced Player Character for the ${edition} rule system based on the user's description.
${langNote}
Return a valid JSON object matching the CharacterData schema with:
- name (string)
- race (string, e.g. "Elf", "Dwarf", "Human", "Dragonborn", "Tiefling")
- characterClass (string, e.g. "Fighter", "Wizard", "Rogue", "Paladin", "Cleric")
- subclass (string, e.g. "Champion", "Evocation", "Thief", "Oath of Devotion")
- level (number, default 1 or requested level)
- background (string, e.g. "Folk Hero", "Sage", "Criminal", "Noble", "Soldier")
- alignment (string, e.g. "Chaotic Good", "Neutral", "Lawful Good")
- hpMax (number)
- hpCurrent (number, same as hpMax)
- hitDiceTotal (string, e.g. "1d10 + 2")
- armorClass (number)
- speed (number in feet, default 30)
- initiativeBonus (number)
- abilities: { STR: {score: number}, DEX: {score: number}, CON: {score: number}, INT: {score: number}, WIS: {score: number}, CHA: {score: number} }
- savingThrowProficiencies: Array of strings (e.g. ["STR", "CON"])
- skills: Array of strings (e.g. ["Athletics", "Perception", "Insight"])
- attacks: Array of { id: string, name: string, attackBonus: number, damage: string, damageType: string, range: string, notes: string }
- classFeatures: Array of { id: string, name: string, source: string, description: string }
- wealth: { cp: number, sp: number, ep: number, gp: number, pp: number }
- inventory: Array of { name: string, quantity: number, weight: number, isMagic: boolean, costGp: number, notes: string, itemType: string }
- personalityTraits: string
- ideals: string
- bonds: string
- flaws: string
- backstory: string
- isMonster: false
- isVendor: false`;
      } else if (entityType === "merchant") {
        systemPrompt = `You are an expert TTRPG merchant and shop designer. Generate a rich merchant and NPC shopkeeper for ${edition}.
${langNote}
Return a valid JSON object matching the CharacterData Merchant schema with:
- name (string, merchant NPC's name)
- race (string, e.g. "Dwarf", "Gnome", "Human", "Tiefling")
- characterClass (string, e.g. "Blacksmith Vendor", "Arcane Enchanter", "General Goods Merchant", "Alchemist")
- subclass (string, shop name, e.g. "The Iron Anvil Armory", "Celestial Elixirs")
- level (number, e.g. 3)
- background (string, e.g. "Guild Artisan")
- alignment (string, e.g. "Neutral Good")
- hpMax (number, e.g. 24)
- hpCurrent (number, 24)
- armorClass (number, e.g. 13)
- speed (number, 30)
- vendorMargin (number, price markup percentage, default 100 for normal prices, 120 for 20% markup, 80 for discounts)
- abilities: { STR: {score: number}, DEX: {score: number}, CON: {score: number}, INT: {score: number}, WIS: {score: number}, CHA: {score: number} }
- wealth: { cp: number, sp: number, ep: number, gp: number, pp: number }
- inventory: Array of trade goods for sale! Each item: { name: string, quantity: number, weight: number, costGp: number, isMagic: boolean, itemType: "Weapon" | "Armor" | "Potion" | "Scroll" | "Misc", notes: string }
- personalityTraits: string (quirks when bargaining or greeting customers)
- backstory: string (lore of the merchant, shop location, and specialty wares)
- isMonster: false
- isVendor: true`;
      } else if (entityType === "monster" || entityType === "npc") {
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
${langNote}
Return a valid JSON object with:
- name (string, title of the encounter)
- difficulty ("Easy" | "Medium" | "Hard" | "Deadly")
- environment (string, e.g. "terrestrial", "underwater", "volcanic", "arctic", "shadowfell", "aerial", "lair_active")
- description (string, sensory room setup, tactical terrain, cover, hazards)
- enemies: Array of {
    name: string,
    count: number,
    cr: string,
    role: string,
    tacticalNotes: string,
    hpMax: number,
    armorClass: number,
    initiativeBonus: number,
    attacks: Array<{ id: string, name: string, attackBonus: number, damage: string, damageType: string, range: string, notes: string }>,
    abilities: { STR: {score: number}, DEX: {score: number}, CON: {score: number}, INT: {score: number}, WIS: {score: number}, CHA: {score: number} }
  }
- lootAndRewards: { xpTotal: number, goldGp: number, items: Array<{ name: string, costGp: number, isMagic: boolean, itemType: string, notes: string }> }
- tacticsAndPhases: string (how enemies behave, reinforcements, traps)`;
      } else if (entityType === "treasure" || entityType === "loot") {
        systemPrompt = `You are an expert TTRPG treasure and loot master. Generate rich, flavorful treasure rewards for ${edition}.
${langNote}
Return a valid JSON object with:
- title (string, e.g. "Sunken Galleon Chest", "Dragon Hoard Tier 2", "Bandit Chief Pouch")
- crTier (string, e.g. "CR 0-4", "CR 5-10", "CR 11-16", "CR 17+")
- wealth: { cp: number, sp: number, ep: number, gp: number, pp: number }
- totalGpEquivalent: number
- gemstonesAndArt: Array<{ name: string, valueGp: number, description: string }>
- magicItems: Array<{
    name: string,
    itemType: "Weapon" | "Armor" | "Potion" | "Scroll" | "Wondrous Item" | "Ring" | "Misc",
    rarity: "Common" | "Uncommon" | "Rare" | "Very Rare" | "Legendary",
    attunement: boolean,
    costGp: number,
    notes: string,
    weaponStats?: { attackBonus: number, damage: string, damageType: string, notes: string },
    armorAc?: number
  }>
- loreOrigin: string (who crafted or accumulated this treasure)`;
      } else if (entityType === "session_summary" || entityType === "campaign_recap") {
        systemPrompt = `You are a master tabletop chronicler and storyteller. Turn raw session notes, battle results, or quest developments into an evocative session recap for ${edition}.
${langNote}
Return a valid JSON object with:
- title (string, e.g. "Episode 14: The Siege of Red Larch")
- previouslyOn: string (1-2 punchy recap paragraphs styled like a cinematic TV show "Previously on...")
- keyEvents: Array<{ title: string, description: string, participants: string[] }>
- keyVictoriesAndCasualties: string (bosses defeated, injuries, party hero moments)
- xpAndLootDistributed: { xpPerPlayer: number, goldDistributedGp: number, notableItems: string[] }
- npcRelationsChanged: Array<{ npcName: string, faction: string, newStanding: "Allied" | "Friendly" | "Neutral" | "Suspicious" | "Hostile", notes: string }>
- unresolvedHooksAndCliffhangers: Array<string>
- dmNotesNextSession: string (suggestions for what to prep for the next session)`;
      } else if (entityType === "rules_adjudication") {
        systemPrompt = `You are an impartial, authoritative TTRPG Rules Arbiter and Judge for ${edition}.
${langNote}
Return a valid JSON object with:
- query: string (the rule question summarized)
- verdict: string (1-sentence clear bottom line: Allowed, Disallowed, or Situational GM Call)
- rulesAsWritten: string (exact citations, mechanics, action economy, spell slot or interaction details)
- rulesAsIntended: string (designer intent, Sage Advice rulings or errata context)
- recommendedTableRuling: string (fair, fast GM ruling that keeps gameplay moving smoothly at the table)
- commonTrapOrMisconception: string (common mistakes players make with this rule)`;
      } else if (entityType === "dungeon_hazard" || entityType === "tactical_room") {
        systemPrompt = `You are a tactical dungeon and encounter environment architect for ${edition}.
${langNote}
Return a valid JSON object with:
- roomName: string (e.g. "The Flooded Scriptorium", "Chasm of Arcane Geysers")
- sensoryDescription: string (read-aloud text for the GM: sight, sound, smell, temperature)
- dimensionsAndLighting: string (e.g. "60x40 ft, Dim Light from bioluminescent fungi, 20ft vaulted ceiling")
- dynamicHazards: Array<{
    name: string,
    trigger: string,
    dcCheck: string,
    damageOrEffect: string,
    countermeasure: string
  }>
- tacticalFeatures: Array<{ feature: string, combatBenefit: string }> (e.g. half cover pillars, elevated sniper ledges, slippery oil pools)
- secretOrHiddenFeature: { description: string, perceptionDc: number, rewardOrShortcut: string }`;
      } else if (entityType === "class") {
        systemPrompt = `You are an expert TTRPG game balance and homebrew class architect. Design a comprehensive, exciting, and well-balanced Homebrew Character Class for ${edition}.
${langNote}
Return a valid JSON object with:
- name: string (Class name, e.g. "Chronomancer", "Blood Knight", "Runecarver Juggernaut", "Shadow Weaver")
- description: string (evocative lore, role, and thematic identity)
- hitDie: string ("d6" | "d8" | "d10" | "d12")
- primaryAbility: string (e.g. "Intelligence", "Strength or Dexterity", "Charisma")
- savingThrows: Array<string> (e.g. ["Intelligence", "Wisdom"] or ["Strength", "Constitution"])
- role: string (e.g. "Time-Manipulating Battlefield Controller & Utility Caster")
- proficiencies: {
    armor: Array<string>,
    weapons: Array<string>,
    tools: Array<string>,
    savingThrows: Array<string>,
    skills: string
  }
- spellcasting: {
    type: "None" | "Full" | "Half" | "Third" | "Pact",
    ability: string,
    notes: string
  }
- featuresByLevel: Array<{
    level: number,
    name: string,
    description: string,
    actionType: "Action" | "Bonus Action" | "Reaction" | "Passive" | "Special",
    uses: string
  }>
- subclasses: Array<{
    name: string,
    description: string,
    features: Array<{ level: number, name: string, description: string }>
  }>
- quickBuild: string`;
      } else if (entityType === "race") {
        systemPrompt = `You are an expert TTRPG lineage and species designer. Design a rich, balanced Homebrew Race / Lineage / Ancestry for ${edition}.
${langNote}
Return a valid JSON object with:
- name: string (Race / Lineage name, e.g. "Voidtouched Astralkin", "Clockwork Automaton", "Kitsune Shapeshifter", "Crystal Dragonborn")
- description: string (rich lore, physical appearance, origins, and cultural roleplay hooks)
- creatureType: string (e.g. "Humanoid", "Fey", "Construct", "Monstrosity", "Celestial", "Fiend", "Undead")
- size: "Medium" | "Small" | "Large"
- speed: number
- speedNotes: string
- abilityBonuses: Array<{ ability: string, bonus: number }>
- abilityBonusesStr: string
- darkvision: boolean
- senses: string
- traits: Array<{
    name: string,
    description: string,
    actionType: "Passive" | "Action" | "Bonus Action" | "Reaction" | "Special",
    recharge: "Passive" | "Short Rest" | "Long Rest" | "Proficiency Bonus / Long Rest" | "None"
  }>
- languages: Array<string>
- subraces: Array<{
    name: string,
    description: string,
    traitBonus: string
  }>
- ageAndLifespan: string
- alignmentTendencies: string`;
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
