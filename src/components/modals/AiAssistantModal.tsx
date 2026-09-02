import React, { useState, useRef, useEffect } from 'react';
import Markdown from 'react-markdown';
import {
  Bot,
  Sparkles,
  Send,
  Trash2,
  Key,
  X,
  Swords,
  Skull,
  Shield,
  Scroll,
  Network,
  Compass,
  Check,
  Copy,
  Plus,
  Loader2,
  User,
  Store,
  CheckCircle2,
  HelpCircle,
  BookOpen,
  Dice5,
  ChevronRight,
  ExternalLink,
  RotateCcw,
  Image as ImageIcon,
  Paperclip,
  Maximize2,
  UploadCloud,
  FileText,
  Layers,
  FolderPlus,
  RefreshCw,
  Award,
  Users
} from 'lucide-react';
import { CharacterData, GearItem, Spell, RuleEdition } from '../../types';
import { CampaignEntity } from '../../utils/searchIndexer';
import { useLanguage } from '../../i18n/LanguageContext';
import { extractTextFromPdf, ExtractedPdfData } from '../../utils/pdfExtractor';
import { saveCustomCompendiumEntry } from '../../data/compendiumData';
import {
  ChatMessage,
  ChatMessageAttachment,
  EntityType,
  askAssistant,
  generateEntity,
  getStoredUserApiKey,
  setStoredUserApiKey,
  hydrateGeneratedCharacter,
  hydrateGeneratedMerchant,
  hydrateGeneratedMonster,
  hydrateGeneratedItem,
  hydrateGeneratedSpell,
  hydrateGeneratedGraphNode,
  hydrateGeneratedClass,
  hydrateGeneratedRace,
  extractEntitiesFromChatMessage,
  DetectedChatEntity
} from '../../services/geminiService';

interface AiAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeCharacter?: CharacterData | null;
  characters?: CharacterData[];
  ruleEdition?: RuleEdition;
  onAddCharacter?: (newChar: CharacterData) => void;
  onAddItemToInventory?: (item: GearItem, targetCharacterId?: string) => void;
  onAddSpellToSpellbook?: (spell: Spell, targetCharacterId?: string) => void;
  onNavigateTab?: (tab: string) => void;
  onSelectCharacter?: (id: string) => void;
}

function formatHumanError(err: any): string {
  if (!err) return 'Unable to connect to AI assistant. Please try again.';
  let msg = typeof err === 'string' ? err : err.message || '';
  try {
    const parsed = JSON.parse(msg);
    if (parsed?.error?.message) {
      msg = parsed.error.message;
    } else if (parsed?.message) {
      msg = parsed.message;
    }
  } catch {}

  const lower = msg.toLowerCase();
  if (
    lower.includes('503') ||
    lower.includes('high demand') ||
    lower.includes('unavailable') ||
    lower.includes('overloaded') ||
    lower.includes('resource_exhausted') ||
    lower.includes('quota') ||
    lower.includes('429')
  ) {
    return 'The AI Oracle is currently experiencing temporary high demand across the network. Please wait a few moments and try your inquiry again.';
  }

  if (
    lower.includes('json.parse') ||
    lower.includes('unexpected character') ||
    lower.includes('is not valid json') ||
    lower.includes('syntaxerror') ||
    lower.includes('502') ||
    lower.includes('504') ||
    lower.includes('gateway')
  ) {
    return 'The AI Oracle connection experienced a temporary network timeout. Please retry your inquiry in a moment.';
  }

  if (lower.includes('api key') || lower.includes('permission_denied') || lower.includes('unauthenticated')) {
    return 'API authentication was not recognized. Please check your API key in the AI Settings (⚙️) tab.';
  }

  return msg;
}

const FORGE_INSPIRATIONS: Record<string, string[]> = {
  character: [
    'Level 3 Human Fighter with dual scimitars and battle master tactics',
    'Level 5 Elf Wizard specializing in divination and battlefield control',
    'Level 1 Tiefling Rogue with expertise in stealth and underworld contacts'
  ],
  class: [
    'Chronomancer manipulation specialist with time surge and paradox spellcasting',
    'Blood Knight frontline fighter with life siphon strikes and vampiric resilience',
    'Rune Juggernaut armored defender that carves elemental runes into shields'
  ],
  race: [
    'Voidtouched Astralkin with short-range astral warp and radiant resistance',
    'Clockwork Automaton construct with built-in tool modules and armor plating',
    'Kitsune shapeshifter with foxfire illusions and innate charm magic'
  ],
  monster: [
    'CR 6 Glacial Drake with frost breath, ice burrowing, and tail sweep',
    'CR 1/2 Clockwork Scout with optical disruption and laser sting',
    'CR 12 Abyssal Archon boss with phase shifts and fear aura'
  ],
  merchant: [
    'Dwarven Master Blacksmith running The Iron Anvil with fine weapons and shields',
    'Elven Alchemist selling glowing restorative draughts and rare reagents',
    'Goblin Curio Trader offering peculiar magic trinkets with unpredictable side-effects'
  ],
  npc: [
    'A dwarven spy master running a tavern front in Waterdeep',
    'An elven alchemist seeking rare glowing cavern moss'
  ],
  item: [
    'Legendary warhammer forged in celestial flame with radiant strike',
    'Cloak of shadows granting stealth advantage in dim light'
  ],
  spell: [
    '3rd-level transmutation spell that slows enemy reflexes',
    'Cantrip creating a dancing orb of cold light'
  ],
  graph_node: [
    'The Gilded Shadows thieves guild operating in the sewers',
    'Sunken citadel in the weeping marshlands'
  ],
  quest: [
    'Investigate the missing shipments in the mountain pass',
    'A cursed heirloom causing nightmares across the village'
  ],
  encounter: [
    'Ambush on a rope bridge over a chasm in heavy fog',
    'Ritual disruption inside a crumbling mausoleum'
  ]
};

export function AiAssistantModal({
  isOpen,
  onClose,
  activeCharacter,
  characters = [],
  ruleEdition = '5e',
  onAddCharacter,
  onAddItemToInventory,
  onAddSpellToSpellbook,
  onNavigateTab,
  onSelectCharacter
}: AiAssistantModalProps) {
  const { language, currentLanguageObj } = useLanguage();
  const [activeTab, setActiveTab] = useState<'chat' | 'generator' | 'settings'>('chat');
  const [targetCharId, setTargetCharId] = useState<string>(activeCharacter?.id || (characters[0]?.id || ''));

  useEffect(() => {
    if (activeCharacter?.id) {
      setTargetCharId(activeCharacter.id);
    } else if (characters.length > 0 && !targetCharId) {
      setTargetCharId(characters[0].id);
    }
  }, [activeCharacter?.id, characters]);

  const resolveTargetCharacter = (explicitId?: string, textPrompt?: string): CharacterData | undefined => {
    if (explicitId) {
      const match = characters?.find(c => c.id === explicitId);
      if (match) return match;
    }
    if (textPrompt && characters && characters.length > 0) {
      const lower = textPrompt.toLowerCase();
      const found = characters.find(c => c.name && lower.includes(c.name.trim().toLowerCase()));
      if (found) return found;
    }
    if (targetCharId) {
      const match = characters?.find(c => c.id === targetCharId);
      if (match) return match;
    }
    return activeCharacter || characters?.[0];
  };
  
  // Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem('nexus_ai_chat_history');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      {
        id: 'welcome_1',
        role: 'assistant',
        text: `Greetings, adventurer! I am **Nexus Oracle**, your in-app tabletop assistant.

You can ask me anything about TTRPG rules (**5e, 3.5e, Pathfinder 2e, Shadowrun, Cthulhu**), ask for tactical guidance, or tell me to generate characters, monsters, merchants, or magic items.

💡 **1-Click Imports Active**: Whenever I generate a statblock, creature, merchant, or item in chat, an interactive **1-Click Import Button** will appear right below the message to add it instantly to your **Campaign Hub** or active inventory!`,
        timestamp: new Date().toISOString()
      }
    ];
  });
  const [inputMessage, setInputMessage] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [importedChatIds, setImportedChatIds] = useState<Record<string, string>>({});
  const [attachedAttachment, setAttachedAttachment] = useState<ChatMessageAttachment | null>(null);
  const [attachedFile, setAttachedFile] = useState<File | Blob | null>(null);
  const [extractedPdf, setExtractedPdf] = useState<ExtractedPdfData | null>(null);
  const [isPdfExtracting, setIsPdfExtracting] = useState(false);
  const [pdfExtractStatus, setPdfExtractStatus] = useState('');
  const [pdfScope, setPdfScope] = useState<'all' | 'range' | 'filter'>('all');
  const [pdfPageRange, setPdfPageRange] = useState('');
  const [pdfKeyword, setPdfKeyword] = useState('');
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [previewModalImage, setPreviewModalImage] = useState<string | null>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Generator state
  const [entityType, setEntityType] = useState<EntityType>('monster');
  const [genPrompt, setGenPrompt] = useState('');
  const [isGenLoading, setIsGenLoading] = useState(false);
  const [generatedResult, setGeneratedResult] = useState<any | null>(null);
  const [importedSuccess, setImportedSuccess] = useState<string | null>(null);
  const [copiedSuccess, setCopiedSuccess] = useState(false);

  // API Key Settings
  const [userApiKey, setUserApiKey] = useState(getStoredUserApiKey());
  const [keySavedMessage, setKeySavedMessage] = useState(false);

  // Save chat messages to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('nexus_ai_chat_history', JSON.stringify(chatMessages.slice(-30)));
    } catch {}
  }, [chatMessages]);

  // Scroll to bottom of chat
  useEffect(() => {
    if (activeTab === 'chat') {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, isChatLoading, activeTab, attachedAttachment]);

  if (!isOpen) return null;

  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const processAttachedFile = async (file: File | Blob, nameHint?: string) => {
    const isPdf = file.type === 'application/pdf' || (file as File).name?.toLowerCase().endsWith('.pdf');
    const isImage = file.type.startsWith('image/');

    if (!isPdf && !isImage) {
      alert('Please attach a PDF document (.pdf) or image screenshot (.png, .jpg, .webp).');
      return;
    }

    const fileName = nameHint || (file as File).name || (isPdf ? 'Compendium.pdf' : 'Screenshot.png');
    const fileSize = (file as File).size;
    setAttachedFile(file);

    if (isPdf) {
      setIsPdfExtracting(true);
      setPdfExtractStatus(`Indexing ${fileName} (${formatFileSize(fileSize)})...`);
      try {
        const extracted = await extractTextFromPdf(file, fileName);
        setExtractedPdf(extracted);
        setPdfScope('all');
        setPdfPageRange('');
        setPdfKeyword('');
        setAttachedAttachment({
          data: '',
          mimeType: 'application/pdf',
          name: fileName,
          fileSize,
        });
      } catch (pdfErr) {
        console.error('Failed to parse PDF on client, attempting server parse:', pdfErr);
        try {
          const arrayBuffer = await file.arrayBuffer();
          const res = await fetch('/api/parse-pdf', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/pdf',
              'X-File-Name': encodeURIComponent(fileName),
            },
            body: arrayBuffer,
          });
          const serverData = await res.json();
          if (serverData && serverData.fullText) {
            setExtractedPdf({
              fileName,
              fileSize,
              totalPages: serverData.totalPages || 1,
              fullText: serverData.fullText,
              pageTexts: serverData.pageTexts || [{ pageNumber: 1, text: serverData.fullText }],
              isScanned: (serverData.fullText.length < (serverData.totalPages || 1) * 30),
              samplePreview: serverData.fullText.substring(0, 1200),
              headings: serverData.headings || [],
            });
          }
        } catch (serverErr) {
          console.error('Server PDF parse fallback error:', serverErr);
        }

        setAttachedAttachment({
          data: '',
          mimeType: 'application/pdf',
          name: fileName,
          fileSize,
        });
      } finally {
        setIsPdfExtracting(false);
      }
      return;
    }

    // Process image file
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      if (!dataUrl) return;

      const img = new window.Image();
      img.onload = () => {
        const maxDimension = 1600;
        let width = img.width;
        let height = img.height;
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const mimeType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
          const optimizedDataUrl = canvas.toDataURL(mimeType, 0.88);
          const base64Data = optimizedDataUrl.split(',')[1];
          setExtractedPdf(null);
          setAttachedAttachment({
            data: base64Data,
            mimeType,
            previewUrl: optimizedDataUrl,
            name: fileName,
            fileSize,
          });
        } else {
          const base64Data = dataUrl.split(',')[1];
          setExtractedPdf(null);
          setAttachedAttachment({
            data: base64Data,
            mimeType: file.type || 'image/png',
            previewUrl: dataUrl,
            name: fileName,
            fileSize,
          });
        }
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.indexOf('image') !== -1) {
        const file = item.getAsFile();
        if (file) {
          e.preventDefault();
          const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }).replace(/:/g, '-');
          processAttachedFile(file, `Screenshot_${timestamp}.png`);
          break;
        }
      } else if (item.type === 'application/pdf') {
        const file = item.getAsFile();
        if (file) {
          e.preventDefault();
          processAttachedFile(file);
          break;
        }
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.type.startsWith('image/') || file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
          processAttachedFile(file);
          break;
        }
      }
    }
  };

  const parsePageRange = (rangeStr: string, maxPages: number): number[] => {
    const pages = new Set<number>();
    const parts = rangeStr.split(',').map(s => s.trim());
    for (const part of parts) {
      if (part.includes('-')) {
        const [startStr, endStr] = part.split('-');
        const start = parseInt(startStr, 10);
        const end = parseInt(endStr, 10);
        if (!isNaN(start) && !isNaN(end)) {
          const from = Math.max(1, Math.min(start, end));
          const to = Math.min(maxPages, Math.max(start, end));
          for (let p = from; p <= to; p++) pages.add(p);
        }
      } else {
        const p = parseInt(part, 10);
        if (!isNaN(p) && p >= 1 && p <= maxPages) pages.add(p);
      }
    }
    return Array.from(pages).sort((a, b) => a - b);
  };

  const handleSendMessage = async (customText?: string) => {
    const textToSend = (customText || inputMessage).trim();
    if ((!textToSend && !attachedAttachment && !extractedPdf) || isChatLoading || isPdfExtracting) return;

    const currentAttachmentToSend = attachedAttachment;
    const currentPdf = extractedPdf;

    // Build the user message to display in chat history
    let displayAttachment = currentAttachmentToSend;
    if (currentPdf && !displayAttachment) {
      displayAttachment = {
        data: '',
        mimeType: 'application/pdf',
        name: currentPdf.fileName,
        fileSize: currentPdf.fileSize,
      };
    }

    const userMsg: ChatMessage = {
      id: `usr_${Date.now()}`,
      role: 'user',
      text:
        textToSend ||
        (currentPdf || currentAttachmentToSend?.mimeType === 'application/pdf'
          ? `📄 [Attached PDF Compendium: ${currentPdf?.fileName || currentAttachmentToSend?.name || 'Manual.pdf'}]`
          : '📸 [Attached Screenshot for Oracle Analysis]'),
      timestamp: new Date().toISOString(),
      attachment: displayAttachment || undefined,
      image: displayAttachment || undefined,
    };

    // If prompt explicitly names a character in the campaign roster, auto-target them
    if (textToSend) {
      const lowerText = textToSend.toLowerCase();
      const matchedChar = characters?.find(c => c.name && lowerText.includes(c.name.trim().toLowerCase()));
      if (matchedChar) {
        setTargetCharId(matchedChar.id);
        if (onSelectCharacter) onSelectCharacter(matchedChar.id);
      }
    }

    setChatMessages(prev => [...prev, userMsg]);
    if (!customText) setInputMessage('');
    setAttachedAttachment(null);
    setExtractedPdf(null);
    setIsChatLoading(true);

    try {
      const historyPayload = chatMessages.slice(-10).map((m) => {
        const att = m.attachment || m.image;
        return {
          role: m.role,
          text: m.text,
          isError: m.isError,
          image: att && att.mimeType !== 'application/pdf' && att.data ? { data: att.data, mimeType: att.mimeType } : undefined,
        };
      });

      let contextSummary = `Rule System: ${ruleEdition}`;
      if (activeCharacter) {
        contextSummary = `Current Active Character: ${activeCharacter.name} (${activeCharacter.race} ${activeCharacter.characterClass} Lv.${activeCharacter.level}), Rule System: ${ruleEdition}`;
        if (activeCharacter.backstory) {
          contextSummary += `\nCharacter Backstory & Description: ${activeCharacter.backstory.substring(0, 600)}`;
        }
        if (activeCharacter.additionalNotes) {
          contextSummary += `\nQuest Log / Notes: ${activeCharacter.additionalNotes.substring(0, 400)}`;
        }
        if (activeCharacter.personalityTraits || activeCharacter.ideals || activeCharacter.bonds || activeCharacter.flaws) {
          contextSummary += `\nRoleplaying Traits: Traits: ${activeCharacter.personalityTraits || 'None'}, Ideals: ${activeCharacter.ideals || 'None'}, Bonds: ${activeCharacter.bonds || 'None'}, Flaws: ${activeCharacter.flaws || 'None'}`;
        }
      }

      // If we have an attached or extracted PDF, construct an ultra-high quality prompt containing the extracted compendium text
      let queryMessage = textToSend;
      let directImagePayload: { data: string; mimeType: string } | undefined = undefined;

      let resolvedPdf = currentPdf;
      if ((!resolvedPdf || !resolvedPdf.fullText) && attachedFile && (attachedFile.type === 'application/pdf' || (attachedFile as File).name?.toLowerCase().endsWith('.pdf'))) {
        try {
          resolvedPdf = await extractTextFromPdf(attachedFile, (attachedFile as File).name || 'Document.pdf');
        } catch (e) {
          console.warn('Failed on-the-fly extraction in handleSendMessage:', e);
        }
      }

      if (resolvedPdf && resolvedPdf.fullText) {
        let compendiumSectionText = '';

        if (pdfScope === 'range' && pdfPageRange.trim()) {
          const targetPages = parsePageRange(pdfPageRange, resolvedPdf.totalPages);
          const pageSet = new Set(targetPages);
          const filtered = resolvedPdf.pageTexts.filter(pt => pageSet.has(pt.pageNumber));
          compendiumSectionText = filtered.map(pt => `--- [PAGE ${pt.pageNumber}] ---\n${pt.text}`).join('\n\n');
        } else if (pdfScope === 'filter' && pdfKeyword.trim()) {
          const kw = pdfKeyword.toLowerCase().trim();
          const matchedPages = resolvedPdf.pageTexts.filter(pt => pt.text.toLowerCase().includes(kw));
          compendiumSectionText = matchedPages.map(pt => `--- [PAGE ${pt.pageNumber}] ---\n${pt.text}`).join('\n\n');
          if (!compendiumSectionText) {
            compendiumSectionText = resolvedPdf.fullText.substring(0, 250000);
          }
        } else {
          // All pages: Gemini 3.7 Flash supports huge contexts; cap at 350,000 chars for lightning speed
          compendiumSectionText = resolvedPdf.fullText.length > 350000
            ? resolvedPdf.fullText.substring(0, 350000) + `\n\n... [Compendium continues for ${resolvedPdf.totalPages} total pages]`
            : resolvedPdf.fullText;
        }

        const userInstruction = textToSend || 'Extract all monsters, statblocks, characters, spells, and items from this PDF compendium with full structured stats.';

        queryMessage = `[ATTACHED COMPENDIUM: "${resolvedPdf.fileName}" | ${resolvedPdf.totalPages} Pages | Rule System: ${ruleEdition}]

=== COMPENDIUM EXTRACTED TEXT BEGIN ===
${compendiumSectionText}
=== COMPENDIUM EXTRACTED TEXT END ===

USER REQUEST:
${userInstruction}

INSTRUCTIONS FOR THE ORACLE:
1. Extract and present all relevant monsters, creatures, statblocks, items, or spells found in the compendium text above.
2. For every extracted entity, provide complete game stats (HP, AC, Ability Scores, CR, Actions, Special Abilities, Spells) following ${ruleEdition.toUpperCase()} rules.
3. Crucially, format all extracted creatures, items, and spells with code blocks or JSON so the Nexus importer can provide 1-click import cards for each entity!`;
      } else if (resolvedPdf && (!resolvedPdf.fullText || resolvedPdf.isScanned)) {
        // Fallback for scanned PDF without embedded text
        const userInstruction = textToSend || 'Extract all monsters, statblocks, characters, spells, and items from this PDF compendium with full structured stats.';
        queryMessage = `[ATTACHED COMPENDIUM: "${resolvedPdf.fileName}" | ${resolvedPdf.totalPages} Pages | Scanned PDF]\n\n${userInstruction}\n\nPlease generate and extract the monsters, creatures, and statblocks corresponding to this compendium title for ${ruleEdition.toUpperCase()}. Provide complete game statistics and JSON code blocks for 1-click import.`;
      } else if (currentAttachmentToSend && currentAttachmentToSend.data && currentAttachmentToSend.mimeType.startsWith('image/')) {
        directImagePayload = {
          data: currentAttachmentToSend.data,
          mimeType: currentAttachmentToSend.mimeType,
        };
      }

      setAttachedFile(null);

      const reply = await askAssistant(
        queryMessage,
        historyPayload,
        contextSummary,
        language,
        directImagePayload
      );

      const assistantMsg: ChatMessage = {
        id: `ast_${Date.now()}`,
        role: 'assistant',
        text: reply,
        timestamp: new Date().toISOString()
      };
      setChatMessages(prev => [...prev, assistantMsg]);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `err_${Date.now()}`,
        role: 'assistant',
        text: `⚠️ **Error:** ${formatHumanError(err)}`,
        timestamp: new Date().toISOString(),
        isError: true
      };
      setChatMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleGenerateEntity = async () => {
    if (!genPrompt.trim() || isGenLoading) return;

    // Check if prompt names a character
    const lowerPrompt = genPrompt.toLowerCase();
    const matchedChar = characters?.find(c => c.name && lowerPrompt.includes(c.name.trim().toLowerCase()));
    if (matchedChar) {
      setTargetCharId(matchedChar.id);
      if (onSelectCharacter) onSelectCharacter(matchedChar.id);
    }

    setIsGenLoading(true);
    setGeneratedResult(null);
    setImportedSuccess(null);

    try {
      const activeChar = matchedChar || characters.find(c => c.id === targetCharId) || activeCharacter;
      const context = {
        ruleEdition,
        activeCharacterName: activeChar?.name,
        activeCharacterLevel: activeChar?.level
      };

      const res = await generateEntity(entityType, genPrompt, ruleEdition, context, language);
      setGeneratedResult(res.entity);
      setImportedSuccess(null);
    } catch (err: any) {
      alert(`Generation failed: ${err.message || 'Unknown error'}`);
    } finally {
      setIsGenLoading(false);
    }
  };

  const handleImportEntity = (overrideType?: EntityType, overrideData?: any) => {
    const targetType = overrideType || entityType;
    const targetData = overrideData || generatedResult;
    if (!targetData) return;

    try {
      if (targetType === 'character') {
        const pc = hydrateGeneratedCharacter(targetData, ruleEdition);
        if (onAddCharacter) {
          onAddCharacter(pc);
          if (onSelectCharacter && pc.id) onSelectCharacter(pc.id);
          setImportedSuccess(`Added "${pc.name}" (Level ${pc.level} ${pc.characterClass}) to Hub under Player Characters!`);
        }
      } else if (targetType === 'merchant') {
        const merchant = hydrateGeneratedMerchant(targetData, ruleEdition);
        if (onAddCharacter) {
          onAddCharacter(merchant);
          if (onSelectCharacter && merchant.id) onSelectCharacter(merchant.id);
          setImportedSuccess(`Added "${merchant.name}" to Hub under Merchants & Shops!`);
        }
      } else if (targetType === 'class') {
        const customClass = hydrateGeneratedClass(targetData, ruleEdition);
        saveCustomCompendiumEntry(customClass);
        setImportedSuccess(`Added "${customClass.name}" directly to your Compendium Classes!`);
      } else if (targetType === 'race') {
        const customRace = hydrateGeneratedRace(targetData, ruleEdition);
        saveCustomCompendiumEntry(customRace);
        setImportedSuccess(`Added "${customRace.name}" directly to your Compendium Races & Lineages!`);
      } else if (targetType === 'monster' || targetType === 'npc') {
        const monster = hydrateGeneratedMonster(targetData, ruleEdition);
        if (onAddCharacter) {
          onAddCharacter(monster);
          if (onSelectCharacter && monster.id) onSelectCharacter(monster.id);
          setImportedSuccess(`Added "${monster.name}" (CR ${monster.challengeRating}) to Hub under Monsters & Creatures!`);
        }
      } else if (targetType === 'item') {
        const item = hydrateGeneratedItem(targetData);
        const resolvedTarget = resolveTargetCharacter(targetCharId, genPrompt);
        if (onAddItemToInventory && resolvedTarget) {
          onAddItemToInventory(item, resolvedTarget.id);
          if (onSelectCharacter) onSelectCharacter(resolvedTarget.id);
          setImportedSuccess(`Added "${item.name}" directly to ${resolvedTarget.name}'s inventory (Sheet 3)!`);
        }
      } else if (targetType === 'spell') {
        const spell = hydrateGeneratedSpell(targetData, ruleEdition);
        const resolvedTarget = resolveTargetCharacter(targetCharId, genPrompt);
        if (onAddSpellToSpellbook && resolvedTarget) {
          onAddSpellToSpellbook(spell, resolvedTarget.id);
          if (onSelectCharacter) onSelectCharacter(resolvedTarget.id);
          setImportedSuccess(`Added "${spell.name}" (Level ${spell.level}) to ${resolvedTarget.name}'s spellbook (Sheet 4)!`);
        }
      } else if (targetType === 'graph_node') {
        const node = hydrateGeneratedGraphNode(targetData);
        const existingRaw = localStorage.getItem('penpaper_campaign_graph_nodes');
        const existingNodes = existingRaw ? JSON.parse(existingRaw) : [];
        const updated = [node, ...existingNodes];
        localStorage.setItem('penpaper_campaign_graph_nodes', JSON.stringify(updated));
        setImportedSuccess(`Added "${node.name}" (${node.type.toUpperCase()}) to your Campaign Graph network!`);
      } else {
        navigator.clipboard.writeText(JSON.stringify(targetData, null, 2));
        setImportedSuccess('Entity details copied to clipboard!');
      }
    } catch (err: any) {
      alert(`Import failed: ${err.message}`);
    }
  };

  const handleChatEntityImport = (entity: DetectedChatEntity) => {
    try {
      if (entity.type === 'character') {
        const pc = hydrateGeneratedCharacter(entity.rawJson, ruleEdition);
        if (onAddCharacter) {
          onAddCharacter(pc);
          if (onSelectCharacter && pc.id) onSelectCharacter(pc.id);
          setImportedChatIds(prev => ({
            ...prev,
            [entity.id]: `Added "${pc.name}" to Hub as Player Character!`
          }));
        }
      } else if (entity.type === 'class') {
        const customClass = hydrateGeneratedClass(entity.rawJson, ruleEdition);
        saveCustomCompendiumEntry(customClass);
        setImportedChatIds(prev => ({
          ...prev,
          [entity.id]: `Added "${customClass.name}" to Compendium Classes!`
        }));
      } else if (entity.type === 'race') {
        const customRace = hydrateGeneratedRace(entity.rawJson, ruleEdition);
        saveCustomCompendiumEntry(customRace);
        setImportedChatIds(prev => ({
          ...prev,
          [entity.id]: `Added "${customRace.name}" to Compendium Races!`
        }));
      } else if (entity.type === 'merchant') {
        const merchant = hydrateGeneratedMerchant(entity.rawJson, ruleEdition);
        if (onAddCharacter) {
          onAddCharacter(merchant);
          if (onSelectCharacter && merchant.id) onSelectCharacter(merchant.id);
          setImportedChatIds(prev => ({
            ...prev,
            [entity.id]: `Added "${merchant.name}" to Hub as Merchant Shopkeeper!`
          }));
        }
      } else if (entity.type === 'monster') {
        const monster = hydrateGeneratedMonster(entity.rawJson, ruleEdition);
        if (onAddCharacter) {
          onAddCharacter(monster);
          if (onSelectCharacter && monster.id) onSelectCharacter(monster.id);
          setImportedChatIds(prev => ({
            ...prev,
            [entity.id]: `Added "${monster.name}" (CR ${monster.challengeRating}) to Hub as Monster & Combatant!`
          }));
        }
      } else if (entity.type === 'item') {
        const item = hydrateGeneratedItem(entity.rawJson);
        const resolvedTarget = resolveTargetCharacter(targetCharId, (entity.name || '') + ' ' + (entity.summary || ''));
        if (onAddItemToInventory && resolvedTarget) {
          onAddItemToInventory(item, resolvedTarget.id);
          if (onSelectCharacter) onSelectCharacter(resolvedTarget.id);
          setImportedChatIds(prev => ({
            ...prev,
            [entity.id]: `Added "${item.name}" to ${resolvedTarget.name}'s inventory!`
          }));
        }
      } else if (entity.type === 'spell') {
        const spell = hydrateGeneratedSpell(entity.rawJson, ruleEdition);
        const resolvedTarget = resolveTargetCharacter(targetCharId, (entity.name || '') + ' ' + (entity.summary || ''));
        if (onAddSpellToSpellbook && resolvedTarget) {
          onAddSpellToSpellbook(spell, resolvedTarget.id);
          if (onSelectCharacter) onSelectCharacter(resolvedTarget.id);
          setImportedChatIds(prev => ({
            ...prev,
            [entity.id]: `Added "${spell.name}" to ${resolvedTarget.name}'s spellbook!`
          }));
        }
      } else if (entity.type === 'graph_node') {
        const node = hydrateGeneratedGraphNode(entity.rawJson);
        const existingRaw = localStorage.getItem('penpaper_campaign_graph_nodes');
        const existingNodes = existingRaw ? JSON.parse(existingRaw) : [];
        const updated = [node, ...existingNodes];
        localStorage.setItem('penpaper_campaign_graph_nodes', JSON.stringify(updated));
        setImportedChatIds(prev => ({
          ...prev,
          [entity.id]: `Added "${node.name}" (${node.type.toUpperCase()}) to Campaign Graph!`
        }));
      }
    } catch (err: any) {
      alert(`Import failed: ${err.message || 'Unknown error'}`);
    }
  };

  const handleBatchImport = (entities: DetectedChatEntity[]) => {
    let successCount = 0;
    const newImportedRecord: Record<string, string> = { ...importedChatIds };

    for (const entity of entities) {
      if (newImportedRecord[entity.id]) continue;
      try {
        if (entity.type === 'character') {
          const pc = hydrateGeneratedCharacter(entity.rawJson, ruleEdition);
          if (onAddCharacter) onAddCharacter(pc);
          if (onSelectCharacter && pc.id) onSelectCharacter(pc.id);
          newImportedRecord[entity.id] = `Added "${pc.name}" (Player Character)`;
          successCount++;
        } else if (entity.type === 'class') {
          const customClass = hydrateGeneratedClass(entity.rawJson, ruleEdition);
          saveCustomCompendiumEntry(customClass);
          newImportedRecord[entity.id] = `Added "${customClass.name}" (Class)`;
          successCount++;
        } else if (entity.type === 'race') {
          const customRace = hydrateGeneratedRace(entity.rawJson, ruleEdition);
          saveCustomCompendiumEntry(customRace);
          newImportedRecord[entity.id] = `Added "${customRace.name}" (Race)`;
          successCount++;
        } else if (entity.type === 'merchant') {
          const merchant = hydrateGeneratedMerchant(entity.rawJson, ruleEdition);
          if (onAddCharacter) onAddCharacter(merchant);
          if (onSelectCharacter && merchant.id) onSelectCharacter(merchant.id);
          newImportedRecord[entity.id] = `Added "${merchant.name}" (Merchant)`;
          successCount++;
        } else if (entity.type === 'monster') {
          const monster = hydrateGeneratedMonster(entity.rawJson, ruleEdition);
          if (onAddCharacter) onAddCharacter(monster);
          if (onSelectCharacter && monster.id) onSelectCharacter(monster.id);
          newImportedRecord[entity.id] = `Added "${monster.name}" (CR ${monster.challengeRating || '?'})`;
          successCount++;
        } else if (entity.type === 'item') {
          const item = hydrateGeneratedItem(entity.rawJson);
          const resolvedTarget = resolveTargetCharacter(targetCharId, (entity.name || '') + ' ' + (entity.summary || ''));
          if (onAddItemToInventory && resolvedTarget) onAddItemToInventory(item, resolvedTarget.id);
          if (onSelectCharacter && resolvedTarget?.id) onSelectCharacter(resolvedTarget.id);
          newImportedRecord[entity.id] = `Added "${item.name}" (${resolvedTarget?.name || 'Inventory'})`;
          successCount++;
        } else if (entity.type === 'spell') {
          const spell = hydrateGeneratedSpell(entity.rawJson, ruleEdition);
          const resolvedTarget = resolveTargetCharacter(targetCharId, (entity.name || '') + ' ' + (entity.summary || ''));
          if (onAddSpellToSpellbook && resolvedTarget) onAddSpellToSpellbook(spell, resolvedTarget.id);
          if (onSelectCharacter && resolvedTarget?.id) onSelectCharacter(resolvedTarget.id);
          newImportedRecord[entity.id] = `Added "${spell.name}" (${resolvedTarget?.name || 'Spellbook'})`;
          successCount++;
        } else if (entity.type === 'graph_node') {
          const node = hydrateGeneratedGraphNode(entity.rawJson);
          const existingRaw = localStorage.getItem('penpaper_campaign_graph_nodes');
          const existingNodes = existingRaw ? JSON.parse(existingRaw) : [];
          existingNodes.push(node);
          localStorage.setItem('penpaper_campaign_graph_nodes', JSON.stringify(existingNodes));
          newImportedRecord[entity.id] = `Added "${node.name}" (Graph)`;
          successCount++;
        }
      } catch (err) {
        console.error('Failed to import entity:', entity.name, err);
      }
    }

    setImportedChatIds(newImportedRecord);
  };

  const handleCopyResult = () => {
    if (!generatedResult) return;
    navigator.clipboard.writeText(JSON.stringify(generatedResult, null, 2));
    setCopiedSuccess(true);
    setTimeout(() => setCopiedSuccess(false), 2000);
  };

  const handleSaveApiKey = () => {
    setStoredUserApiKey(userApiKey);
    setKeySavedMessage(true);
    setTimeout(() => setKeySavedMessage(false), 2500);
  };

  const handleClearHistory = () => {
    if (confirm('Clear all conversation history?')) {
      setChatMessages([
        {
          id: 'welcome_cleared',
          role: 'assistant',
          text: 'Conversation history cleared. How may I assist your quest today?',
          timestamp: new Date().toISOString()
        }
      ]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div 
        id="nexus_ai_assistant_modal"
        className="w-full max-w-4xl h-[92vh] max-h-[850px] bg-stone-900 border border-amber-600/40 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-stone-200"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-stone-950/90 border-b border-stone-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-900/40 border border-purple-400/30">
              <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-serif font-bold text-amber-200">
                  Nexus AI Oracle & Forge
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 font-mono">
                  Oracle AI
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-950/80 text-amber-300 border border-amber-700/50 font-mono flex items-center gap-1">
                  <span>{currentLanguageObj.flag}</span>
                  <span>{currentLanguageObj.nativeName}</span>
                </span>
              </div>
              <p className="text-xs text-stone-400">
                Rules Assistant & Entity Generator • {ruleEdition.toUpperCase()} System Active
              </p>
            </div>
          </div>

          {/* Navigation Mode Tabs, Destination Selector & Close */}
          <div className="flex items-center gap-2">
            {/* Target Character Selector for Destination */}
            {characters && characters.length > 0 && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-stone-900 border border-stone-800 rounded-xl text-xs shadow-inner">
                <User className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="text-stone-400 text-[11px] hidden sm:inline">Target:</span>
                <select
                  id="ai_target_character_select"
                  value={targetCharId}
                  onChange={(e) => {
                    setTargetCharId(e.target.value);
                    if (onSelectCharacter) onSelectCharacter(e.target.value);
                  }}
                  className="bg-transparent text-amber-300 font-bold text-xs focus:outline-none cursor-pointer"
                  title="Select target character for AI-generated items and spells"
                >
                  {characters.map(c => (
                    <option key={c.id} value={c.id} className="bg-stone-900 text-stone-200">
                      {c.name} {c.id === activeCharacter?.id ? '★' : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex p-1 bg-stone-900 rounded-xl border border-stone-800">
              <button
                id="ai_tab_chat_btn"
                onClick={() => setActiveTab('chat')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'chat'
                    ? 'bg-amber-600 text-stone-950 shadow-md'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                <Bot className="w-3.5 h-3.5" />
                <span>Oracle Chat</span>
              </button>

              <button
                id="ai_tab_generator_btn"
                onClick={() => setActiveTab('generator')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'generator'
                    ? 'bg-amber-600 text-stone-950 shadow-md'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                <Swords className="w-3.5 h-3.5" />
                <span>Entity Forge</span>
              </button>

              <button
                id="ai_tab_settings_btn"
                onClick={() => setActiveTab('settings')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                  activeTab === 'settings'
                    ? 'bg-amber-600 text-stone-950 shadow-md'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
                title="API Key Settings (Optional BYOK)"
              >
                <Key className="w-3.5 h-3.5" />
              </button>

              {activeTab === 'chat' && chatMessages.length > 1 && (
                <button
                  id="ai_clear_history_btn"
                  onClick={handleClearHistory}
                  title="Clear Chat History"
                  className="p-1.5 text-stone-400 hover:text-red-400 hover:bg-stone-800 rounded-lg transition cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <button
              id="ai_assistant_close_btn"
              onClick={onClose}
              className="p-2 rounded-xl text-stone-400 hover:text-stone-100 hover:bg-stone-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab 1: Oracle Chat */}
        {activeTab === 'chat' && (
          <div
            className="flex-1 flex flex-col min-h-0 bg-stone-900/50 relative"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onPaste={handlePaste}
          >
            {/* Drag & Drop Visual Overlay */}
            {isDraggingOver && (
              <div className="absolute inset-0 z-30 bg-stone-950/90 border-2 border-dashed border-amber-500 rounded-b-2xl flex flex-col items-center justify-center gap-3 backdrop-blur-sm pointer-events-none animate-in fade-in duration-150">
                <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/50 flex items-center justify-center text-amber-400 shadow-lg">
                  <UploadCloud className="w-8 h-8 animate-bounce" />
                </div>
                <div className="text-center">
                  <h4 className="text-base font-bold text-amber-200">Drop PDF Compendium or Screenshot Here</h4>
                  <p className="text-xs text-stone-400 mt-0.5">Nexus Oracle will extract monsters, characters, spells, items, or statblocks</p>
                </div>
              </div>
            )}

            {/* Chat Messages Container */}
            <div className="flex-1 p-4 overflow-y-auto space-y-4">
              {chatMessages.map(msg => {
                const detectedEntities = msg.role === 'assistant' && !msg.isError ? extractEntitiesFromChatMessage(msg.text) : [];
                const attachment = msg.attachment || msg.image;
                const isPdf = attachment?.mimeType === 'application/pdf';

                return (
                  <div
                    key={msg.id}
                    className={`flex gap-3 max-w-[92%] ${
                      msg.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'
                    }`}
                  >
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                        msg.role === 'user'
                          ? 'bg-amber-600 text-stone-950 shadow-md'
                          : msg.isError
                          ? 'bg-red-900/80 text-red-200 border border-red-500'
                          : 'bg-purple-950 border border-purple-500/40 text-purple-200'
                      }`}
                    >
                      {msg.role === 'user' ? 'You' : <Bot className="w-4 h-4" />}
                    </div>

                    <div
                      className={`p-3.5 rounded-2xl text-sm leading-relaxed space-y-2.5 ${
                        msg.role === 'user'
                          ? 'bg-amber-600/20 border border-amber-500/30 text-amber-50 rounded-tr-none'
                          : msg.isError
                          ? 'bg-red-950/40 border border-red-800/60 text-red-200 rounded-tl-none'
                          : 'bg-stone-950/80 border border-stone-800 text-stone-200 rounded-tl-none shadow-sm'
                      }`}
                    >
                      {/* Attached PDF or Screenshot Card */}
                      {attachment && (
                        <div className="mb-2">
                          {isPdf ? (
                            <div className="p-3 rounded-xl bg-stone-900 border border-red-500/30 max-w-sm flex items-center justify-between gap-3 shadow-md">
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className="w-9 h-9 rounded-lg bg-red-950/80 border border-red-500/50 flex items-center justify-center text-red-400 flex-shrink-0">
                                  <FileText className="w-5 h-5" />
                                </div>
                                <div className="min-w-0">
                                  <div className="text-xs font-bold text-stone-100 truncate">{attachment.name || 'Compendium.pdf'}</div>
                                  <div className="text-[10px] text-stone-400 font-mono flex items-center gap-1.5">
                                    <span className="text-red-400 font-bold uppercase tracking-wider">PDF Compendium</span>
                                    {attachment.fileSize && <span>• {formatFileSize(attachment.fileSize)}</span>}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div
                              onClick={() =>
                                setPreviewModalImage(
                                  attachment.previewUrl ||
                                    (attachment.data ? `data:${attachment.mimeType || 'image/png'};base64,${attachment.data}` : null)
                                )
                              }
                              className="relative group rounded-xl overflow-hidden border border-amber-500/40 bg-stone-950/90 max-w-sm cursor-pointer shadow-md hover:border-amber-400 transition"
                              title="Click to view full image"
                            >
                              <img
                                src={
                                  attachment.previewUrl ||
                                  (attachment.data ? `data:${attachment.mimeType || 'image/png'};base64,${attachment.data}` : '')
                                }
                                alt={attachment.name || 'Screenshot'}
                                className="w-full max-h-56 object-cover group-hover:scale-105 transition duration-300"
                                referrerPolicy="no-referrer"
                              />
                              <div className="absolute inset-0 bg-stone-950/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-1.5 text-xs text-amber-200 font-bold backdrop-blur-[1px]">
                                <Maximize2 className="w-4 h-4" />
                                <span>View Full Size</span>
                              </div>
                              <div className="px-2.5 py-1 bg-stone-950/90 text-[10px] text-stone-300 font-mono truncate border-t border-stone-800 flex items-center justify-between gap-1">
                                <span className="flex items-center gap-1 truncate">
                                  <ImageIcon className="w-3 h-3 text-amber-400 flex-shrink-0" />
                                  <span className="truncate">{attachment.name || 'Pasted Screenshot'}</span>
                                </span>
                                <span className="text-amber-400 font-bold text-[9px] uppercase tracking-wider flex-shrink-0">Vision</span>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="markdown-body prose prose-invert max-w-none text-sm space-y-2">
                        <Markdown>{msg.text}</Markdown>
                      </div>

                      {/* Retry Button on Error */}
                      {msg.isError && (
                        <div className="mt-2.5 pt-2 border-t border-red-900/40 flex items-center justify-between gap-2">
                          <span className="text-[11px] text-red-300/80">Spike in capacity is temporary.</span>
                          <button
                            type="button"
                            onClick={() => {
                              // Find previous user message
                              const msgIndex = chatMessages.findIndex(m => m.id === msg.id);
                              let lastUserText = '';
                              for (let i = msgIndex - 1; i >= 0; i--) {
                                if (chatMessages[i].role === 'user' && chatMessages[i].text) {
                                  lastUserText = chatMessages[i].text;
                                  break;
                                }
                              }
                              // Remove current error message and re-send
                              setChatMessages(prev => prev.filter(m => m.id !== msg.id));
                              handleSendMessage(lastUserText);
                            }}
                            disabled={isChatLoading}
                            className="px-3 py-1 bg-red-900/60 hover:bg-red-800 text-red-200 text-xs font-semibold rounded-lg border border-red-700/50 flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
                          >
                            <RefreshCw className={`w-3.5 h-3.5 ${isChatLoading ? 'animate-spin' : ''}`} />
                            <span>Retry Inquiry</span>
                          </button>
                        </div>
                      )}

                      {/* In-Chat 1-Click Import Cards for Generated Entities */}
                      {detectedEntities.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-stone-800/80 space-y-2.5">
                          {/* Batch Import Header when Multiple Entities Found */}
                          {detectedEntities.length > 1 ? (
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 p-2.5 bg-amber-950/40 border border-amber-500/40 rounded-xl shadow-inner">
                              <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
                                <Layers className="w-4 h-4 text-amber-400 flex-shrink-0" />
                                <span>{detectedEntities.length} Entities Extracted from Compendium</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleBatchImport(detectedEntities)}
                                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5 shadow-md cursor-pointer w-full sm:w-auto flex-shrink-0"
                              >
                                <FolderPlus className="w-3.5 h-3.5" />
                                <span>Import All ({detectedEntities.length})</span>
                              </button>
                            </div>
                          ) : (
                            <div className="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                              <span>Detected Entity & 1-Click Import:</span>
                            </div>
                          )}

                          <div className="space-y-2">
                            {detectedEntities.map(entity => {
                              const isAlreadyImported = importedChatIds[entity.id];
                              const destinationChar = resolveTargetCharacter(targetCharId, (entity.name || '') + ' ' + (entity.summary || ''));
                              const destinationName = destinationChar?.name || 'Active Character';

                              return (
                                <div
                                  key={entity.id}
                                  className="p-3 bg-stone-900 border border-amber-500/30 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md"
                                >
                                  <div className="flex items-center gap-2.5">
                                    <div className="w-8 h-8 rounded-lg bg-stone-950 border border-amber-600/40 flex items-center justify-center flex-shrink-0 text-amber-400">
                                      {entity.type === 'character' && <User className="w-4 h-4 text-sky-400" />}
                                      {entity.type === 'class' && <Award className="w-4 h-4 text-amber-400" />}
                                      {entity.type === 'race' && <Users className="w-4 h-4 text-emerald-400" />}
                                      {entity.type === 'monster' && <Skull className="w-4 h-4 text-red-400" />}
                                      {entity.type === 'merchant' && <Store className="w-4 h-4 text-amber-400" />}
                                      {entity.type === 'item' && <Shield className="w-4 h-4 text-emerald-400" />}
                                      {entity.type === 'spell' && <Scroll className="w-4 h-4 text-purple-400" />}
                                      {entity.type === 'graph_node' && <Network className="w-4 h-4 text-cyan-400" />}
                                    </div>
                                    <div>
                                      <div className="font-bold text-stone-100 text-xs flex items-center gap-1.5">
                                        <span>{entity.name}</span>
                                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-stone-800 text-stone-300 font-mono">
                                          {entity.type === 'character'
                                            ? 'Player Hero'
                                            : entity.type === 'class'
                                            ? 'Custom Class'
                                            : entity.type === 'race'
                                            ? 'Custom Race'
                                            : entity.type === 'monster'
                                            ? 'Monster'
                                            : entity.type === 'merchant'
                                            ? 'Merchant Shop'
                                            : entity.type.toUpperCase()}
                                        </span>
                                      </div>
                                      {entity.subtitle && (
                                        <div className="text-[11px] text-stone-400">{entity.subtitle}</div>
                                      )}
                                    </div>
                                  </div>

                                  <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                                    {isAlreadyImported ? (
                                      <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                                        <div className="px-3 py-1.5 bg-emerald-950/80 border border-emerald-500/50 rounded-lg text-[11px] text-emerald-300 font-medium flex items-center gap-1.5 shadow-sm">
                                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                          <span>{isAlreadyImported}</span>
                                        </div>
                                        {entity.type === 'item' && onNavigateTab && (
                                          <button
                                            type="button"
                                            onClick={() => {
                                              if (destinationChar && onSelectCharacter) onSelectCharacter(destinationChar.id);
                                              onNavigateTab('sheet3');
                                              onClose();
                                            }}
                                            className="px-2.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold rounded-lg text-xs cursor-pointer transition shadow flex items-center gap-1"
                                            title={`Open ${destinationName}'s Inventory on Sheet 3`}
                                          >
                                            <Shield className="w-3 h-3" />
                                            <span>Open Sheet 3</span>
                                          </button>
                                        )}
                                        {entity.type === 'spell' && onNavigateTab && (
                                          <button
                                            type="button"
                                            onClick={() => {
                                              if (destinationChar && onSelectCharacter) onSelectCharacter(destinationChar.id);
                                              onNavigateTab('sheet4');
                                              onClose();
                                            }}
                                            className="px-2.5 py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg text-xs cursor-pointer transition shadow flex items-center gap-1"
                                            title={`Open ${destinationName}'s Spellbook on Sheet 4`}
                                          >
                                            <Scroll className="w-3 h-3" />
                                            <span>Open Sheet 4</span>
                                          </button>
                                        )}
                                      </div>
                                    ) : (
                                      <button
                                        onClick={() => handleChatEntityImport(entity)}
                                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-stone-950 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5 shadow-md cursor-pointer w-full sm:w-auto flex-shrink-0"
                                      >
                                        <Plus className="w-3.5 h-3.5" />
                                        <span>
                                          {entity.type === 'character'
                                            ? 'Import to Hub (Character)'
                                            : entity.type === 'class'
                                            ? 'Save to Compendium'
                                            : entity.type === 'race'
                                            ? 'Save to Compendium'
                                            : entity.type === 'monster'
                                            ? 'Import to Hub (Monster)'
                                            : entity.type === 'merchant'
                                            ? 'Import to Hub (Merchant)'
                                            : entity.type === 'item'
                                            ? `+ Add to ${destinationName}'s Inventory`
                                            : entity.type === 'spell'
                                            ? `+ Add to ${destinationName}'s Spellbook`
                                            : 'Add to Graph'}
                                        </span>
                                      </button>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      <div className="mt-1 text-[10px] opacity-40 text-right font-mono">
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                );
              })}

              {isChatLoading && (
                <div className="flex gap-3 max-w-[85%] mr-auto items-center">
                  <div className="w-7 h-7 rounded-lg bg-purple-950 border border-purple-500/40 text-purple-200 flex items-center justify-center flex-shrink-0">
                    <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
                  </div>
                  <div className="px-4 py-2.5 rounded-2xl bg-stone-950/80 border border-stone-800 text-xs text-stone-400 flex items-center gap-2">
                    <span className="inline-block w-2 h-2 rounded-full bg-purple-400 animate-ping" />
                    <span>Nexus Oracle is analyzing your document & arcane archives...</span>
                  </div>
                </div>
              )}
              <div ref={chatBottomRef} />
            </div>

            {/* Quick Inspiration Chips */}
            <div className="px-4 py-2 bg-stone-950/90 border-t border-stone-800/80 flex items-center gap-2 overflow-x-auto text-[11px] text-stone-400">
              <span className="font-bold text-amber-500/80 flex-shrink-0 flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Quick Prompts:
              </span>
              {(attachedAttachment?.mimeType === 'application/pdf'
                ? [
                    { label: '📖 Extract Monsters & Statblocks', prompt: 'Extract and generate monsters from this PDF manual with full structured statblocks ready for import.' },
                    { label: '🐉 Extract Bosses & Dragons', prompt: 'Extract all high-tier boss monsters, dragons, or unique villains in this PDF with full statblocks.' },
                    { label: '🗡️ Extract Magic Items', prompt: 'Extract all magic items, weapons, and equipment from this PDF compendium with full stats.' },
                    { label: '📜 Extract Spells & Feats', prompt: 'Extract all spells, powers, and feats found in this PDF document.' },
                    { label: '🗺️ Summarize Manual & Lore', prompt: 'Provide a complete summary of the chapters, rules, lore, and encounter tables in this PDF.' }
                  ]
                : [
                    { label: '🧙 Create Level 3 Hero', prompt: 'Create a fully detailed Level 3 Hero character for 5e with stats, spells or weapons, and backstory.' },
                    { label: '👹 Forge CR 5 Boss', prompt: 'Generate a balanced CR 5 Boss monster for 5e with unique multiattack actions and legendary traits.' },
                    { label: '🏪 Master Merchant Shop', prompt: 'Create a rich Merchant and shopkeeper with custom trade wares, price markup, and shop lore.' },
                    { label: '🗡️ Celestial Weapon', prompt: 'Design a legendary celestial magic weapon with special radiant damage and activation abilities.' },
                    { label: '📜 3rd-Level Spell', prompt: 'Design a 3rd-level transmutation or evocation spell for 5e with damage, saving throws, and components.' }
                  ]
              ).map((chip, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(chip.prompt)}
                  disabled={isChatLoading}
                  className="px-2.5 py-1 bg-stone-900 hover:bg-stone-800 hover:text-amber-200 border border-stone-800 hover:border-amber-500/40 rounded-lg whitespace-nowrap transition cursor-pointer disabled:opacity-50"
                >
                  {chip.label}
                </button>
              ))}
            </div>

            {/* PDF Indexing Progress Banner */}
            {isPdfExtracting && (
              <div className="px-4 py-2.5 bg-purple-950/60 border-t border-purple-800/60 flex items-center justify-between gap-3 text-xs text-purple-200 animate-pulse">
                <div className="flex items-center gap-2.5">
                  <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
                  <span>{pdfExtractStatus || 'Parsing PDF compendium structure and indexing pages...'}</span>
                </div>
                <span className="text-[11px] text-purple-400 font-mono">Bypassing proxy limits</span>
              </div>
            )}

            {/* Attached Image / Document Preview Bar before Sending */}
            {(attachedAttachment || extractedPdf) && !isPdfExtracting && (
              <div className="px-4 py-2.5 bg-stone-950 border-t border-stone-800 flex flex-col gap-2 animate-in fade-in duration-200">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    {extractedPdf || attachedAttachment?.mimeType === 'application/pdf' ? (
                      <div className="w-11 h-11 rounded-lg bg-red-950/90 border border-red-500/60 flex items-center justify-center text-red-400 flex-shrink-0 shadow">
                        <FileText className="w-6 h-6" />
                      </div>
                    ) : (
                      <div
                        onClick={() =>
                          setPreviewModalImage(
                            attachedAttachment?.previewUrl || (attachedAttachment?.data ? `data:${attachedAttachment.mimeType};base64,${attachedAttachment.data}` : null)
                          )
                        }
                        className="w-11 h-11 rounded-lg overflow-hidden border border-amber-500/60 flex-shrink-0 cursor-pointer relative group bg-stone-900 shadow"
                        title="Click to view full screenshot"
                      >
                        <img
                          src={attachedAttachment?.previewUrl || `data:${attachedAttachment?.mimeType};base64,${attachedAttachment?.data}`}
                          alt="Attached screenshot"
                          className="w-full h-full object-cover group-hover:scale-110 transition"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-stone-950/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                          <Maximize2 className="w-3.5 h-3.5 text-amber-300" />
                        </div>
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-amber-300 flex items-center gap-1.5 truncate">
                        {extractedPdf || attachedAttachment?.mimeType === 'application/pdf' ? (
                          <FileText className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
                        ) : (
                          <ImageIcon className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                        )}
                        <span className="truncate">{extractedPdf?.fileName || attachedAttachment?.name || 'Document Attached'}</span>
                      </div>
                      <div className="text-[11px] text-stone-400 flex items-center gap-1.5 flex-wrap">
                        {extractedPdf ? (
                          <>
                            <span className="text-stone-300 font-semibold">{formatFileSize(extractedPdf.fileSize)}</span>
                            <span>•</span>
                            <span className="px-1.5 py-0.2 rounded bg-stone-800 text-stone-300 font-mono text-[10px]">{extractedPdf.totalPages} Pages</span>
                            <span>•</span>
                            <span className="text-emerald-400 flex items-center gap-1">
                              <Check className="w-3 h-3" />
                              {extractedPdf.fullText ? `${Math.round(extractedPdf.fullText.split(/\s+/).length / 1000)}k words indexed` : 'Document ready'}
                            </span>
                          </>
                        ) : attachedAttachment?.mimeType === 'application/pdf' ? (
                          <span>PDF Document • {formatFileSize(attachedAttachment.fileSize)} • Ready for Oracle parsing</span>
                        ) : (
                          <span>Screenshot ready for vision analysis. Type inquiry or hit Send.</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setAttachedAttachment(null);
                      setExtractedPdf(null);
                    }}
                    className="p-1.5 rounded-lg bg-stone-900 hover:bg-red-950 text-stone-400 hover:text-red-300 border border-stone-800 hover:border-red-600/40 transition cursor-pointer flex-shrink-0"
                    title="Remove attachment"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* PDF Compendium Scope Controls (All / Page Range / Filter) */}
                {extractedPdf && extractedPdf.totalPages > 1 && (
                  <div className="pt-1.5 border-t border-stone-800/80 flex items-center gap-2 flex-wrap text-[11px]">
                    <span className="text-stone-400 font-medium">Extract Scope:</span>
                    <button
                      type="button"
                      onClick={() => setPdfScope('all')}
                      className={`px-2 py-0.5 rounded cursor-pointer transition border ${
                        pdfScope === 'all'
                          ? 'bg-amber-500/20 border-amber-500/60 text-amber-300 font-semibold'
                          : 'bg-stone-900 border-stone-800 text-stone-400 hover:text-stone-200'
                      }`}
                    >
                      Entire Manual ({extractedPdf.totalPages} pgs)
                    </button>
                    <button
                      type="button"
                      onClick={() => setPdfScope('range')}
                      className={`px-2 py-0.5 rounded cursor-pointer transition border ${
                        pdfScope === 'range'
                          ? 'bg-amber-500/20 border-amber-500/60 text-amber-300 font-semibold'
                          : 'bg-stone-900 border-stone-800 text-stone-400 hover:text-stone-200'
                      }`}
                    >
                      Select Page Range
                    </button>
                    <button
                      type="button"
                      onClick={() => setPdfScope('filter')}
                      className={`px-2 py-0.5 rounded cursor-pointer transition border ${
                        pdfScope === 'filter'
                          ? 'bg-amber-500/20 border-amber-500/60 text-amber-300 font-semibold'
                          : 'bg-stone-900 border-stone-800 text-stone-400 hover:text-stone-200'
                      }`}
                    >
                      Filter by Monster / Keyword
                    </button>

                    {pdfScope === 'range' && (
                      <input
                        type="text"
                        value={pdfPageRange}
                        onChange={e => setPdfPageRange(e.target.value)}
                        placeholder={`e.g. 1-20 or 15,18,22 (Max: ${extractedPdf.totalPages})`}
                        className="px-2 py-0.5 bg-stone-900 border border-amber-500/40 rounded text-stone-200 text-[11px] w-48 focus:outline-none focus:border-amber-400"
                      />
                    )}

                    {pdfScope === 'filter' && (
                      <input
                        type="text"
                        value={pdfKeyword}
                        onChange={e => setPdfKeyword(e.target.value)}
                        placeholder="e.g. Dragon, Goblin, Lich, Beholder..."
                        className="px-2 py-0.5 bg-stone-900 border border-amber-500/40 rounded text-stone-200 text-[11px] w-48 focus:outline-none focus:border-amber-400"
                      />
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Input Bar */}
            <div className="p-3 bg-stone-950 border-t border-stone-800">
              <form
                onSubmit={e => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="flex items-center gap-2"
              >
                {/* Hidden File Input for PDF / Image Upload */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,application/pdf,.pdf"
                  className="hidden"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) {
                      processAttachedFile(file);
                    }
                    e.target.value = '';
                  }}
                />

                {/* Attach File / Image Button */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isChatLoading}
                  className="p-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-400 hover:text-amber-300 border border-stone-700 hover:border-amber-500/50 transition cursor-pointer flex-shrink-0"
                  title="Attach PDF compendium or screenshot (or press Ctrl+V / Paste anywhere)"
                >
                  <Paperclip className="w-4 h-4" />
                </button>

                <input
                  id="ai_chat_input"
                  type="text"
                  value={inputMessage}
                  onChange={e => setInputMessage(e.target.value)}
                  onPaste={handlePaste}
                  placeholder={
                    attachedAttachment
                      ? attachedAttachment.mimeType === 'application/pdf'
                        ? "e.g. 'Extract all monsters and statblocks from this PDF manual'..."
                        : "Describe what to extract or analyze from this screenshot (or click Inquire)..."
                      : `Ask rules, attach PDF compendiums, paste screenshots (Ctrl+V)... (${ruleEdition.toUpperCase()})`
                  }
                  className="flex-1 px-4 py-2.5 bg-stone-900 border border-stone-700 rounded-xl text-stone-100 placeholder-stone-500 text-sm focus:outline-none focus:border-amber-500 transition"
                  disabled={isChatLoading}
                />
                <button
                  id="ai_chat_send_btn"
                  type="submit"
                  disabled={(!inputMessage.trim() && !attachedAttachment) || isChatLoading}
                  className="px-4 py-2.5 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-stone-950 font-bold text-sm rounded-xl transition flex items-center gap-1.5 shadow-md cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span className="hidden sm:inline">Inquire</span>
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Tab 2: Entity Forge */}
        {activeTab === 'generator' && (
          <div className="flex-1 flex flex-col md:flex-row min-h-0 divide-y md:divide-y-0 md:divide-x divide-stone-800 overflow-y-auto">
            {/* Left Configuration Pane */}
            <div className="w-full md:w-5/12 p-4 space-y-4 flex flex-col justify-between bg-stone-950/40">
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-amber-400 uppercase tracking-wider block mb-1.5 flex items-center gap-1.5">
                    <Swords className="w-3.5 h-3.5" /> 1. Select Entity Type
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                    {[
                      { type: 'character' as EntityType, label: 'Player Character', icon: User },
                      { type: 'class' as EntityType, label: 'Custom Class', icon: Award },
                      { type: 'race' as EntityType, label: 'Custom Race', icon: Users },
                      { type: 'monster' as EntityType, label: 'Monster / Boss', icon: Skull },
                      { type: 'merchant' as EntityType, label: 'Merchant / Shop', icon: Store },
                      { type: 'npc' as EntityType, label: 'NPC Character', icon: Bot },
                      { type: 'item' as EntityType, label: 'Magic Item', icon: Shield },
                      { type: 'spell' as EntityType, label: 'Arcane Spell', icon: Scroll },
                      { type: 'graph_node' as EntityType, label: 'Lore Node', icon: Network },
                      { type: 'quest' as EntityType, label: 'Quest Hook', icon: Compass }
                    ].map(item => {
                      const Icon = item.icon;
                      const isSelected = entityType === item.type;
                      return (
                        <button
                          key={item.type}
                          onClick={() => setEntityType(item.type)}
                          className={`p-2.5 rounded-xl border text-left transition flex items-center gap-2 cursor-pointer ${
                            isSelected
                              ? 'bg-amber-600/20 border-amber-500 text-amber-200 font-bold shadow-sm'
                              : 'bg-stone-900 border-stone-800 text-stone-300 hover:bg-stone-800'
                          }`}
                        >
                          <Icon className={`w-4 h-4 ${isSelected ? 'text-amber-400' : 'text-stone-400'}`} />
                          <span className="text-xs">{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Prompt Description */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" /> 2. Description & Directives
                    </label>
                    <span className="text-[10px] text-stone-400 font-mono">System: {ruleEdition.toUpperCase()}</span>
                  </div>
                  <textarea
                    id="ai_forge_prompt"
                    value={genPrompt}
                    onChange={e => setGenPrompt(e.target.value)}
                    placeholder={
                      entityType === 'character'
                        ? 'e.g. Level 3 Human Battle Master Fighter with dual scimitars and gladiator background...'
                        : entityType === 'class'
                        ? 'e.g. A Chronomancer subclassing into Paradox Weaver or Time Bender with d8 hit die...'
                        : entityType === 'race'
                        ? 'e.g. Astralkin celestial void-dwellers with astral step teleport and radiant resistance...'
                        : entityType === 'merchant'
                        ? 'e.g. Dwarven blacksmith running The Iron Anvil with rare plate armors and runic weapons...'
                        : entityType === 'monster'
                        ? 'e.g. A CR 6 Glacial Drake with frost breath, ice armor, and burrowing...'
                        : entityType === 'item'
                        ? 'e.g. A legendary warhammer forged in celestial flame with radiant strike and return throw...'
                        : entityType === 'spell'
                        ? 'e.g. A 3rd-level transmutation spell that petrifies blood or slows enemy reflexes...'
                        : 'e.g. Describe the theme, level, rarity, or story hook...'
                    }
                    rows={4}
                    className="w-full px-3 py-2 bg-stone-900 border border-stone-700 rounded-xl text-stone-100 placeholder-stone-500 text-sm focus:outline-none focus:border-amber-500 transition resize-none"
                  />
                </div>

                {/* Preset Prompt Chips */}
                <div>
                  <label className="text-[11px] font-bold text-stone-400 block mb-1">Preset Inspirations:</label>
                  <div className="flex flex-wrap gap-1.5">
                    {(FORGE_INSPIRATIONS[entityType] || []).map((promptText, idx) => (
                      <button
                        key={idx}
                        onClick={() => setGenPrompt(promptText)}
                        className="px-2 py-1 bg-stone-900 hover:bg-stone-800 border border-stone-800 hover:border-amber-500/30 text-stone-300 text-[11px] rounded-lg transition cursor-pointer text-left"
                      >
                        {promptText}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Generate Button */}
              <button
                id="ai_forge_generate_btn"
                onClick={handleGenerateEntity}
                disabled={!genPrompt.trim() || isGenLoading}
                className="w-full py-3 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 disabled:opacity-50 text-stone-950 font-bold text-sm rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-amber-950/50 cursor-pointer"
              >
                {isGenLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Forging Entity with AI...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Forge {entityType === 'character' ? 'Player Character' : entityType === 'merchant' ? 'Merchant Shop' : entityType.toUpperCase()}</span>
                  </>
                )}
              </button>
            </div>

            {/* Right Results & Preview Pane */}
            <div className="w-full md:w-7/12 p-4 flex flex-col justify-between overflow-y-auto bg-stone-900/30">
              {generatedResult ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-stone-800 pb-2">
                    <div>
                      <h3 className="text-base font-serif font-bold text-amber-200 flex items-center gap-2">
                        <span>{generatedResult.name || generatedResult.title || 'Forged Entity'}</span>
                        {generatedResult.challengeRating && (
                          <span className="text-xs px-2 py-0.5 rounded-md bg-red-950 text-red-300 border border-red-700 font-mono">
                            CR {generatedResult.challengeRating}
                          </span>
                        )}
                        {generatedResult.level !== undefined && (
                          <span className="text-xs px-2 py-0.5 rounded-md bg-purple-950 text-purple-300 border border-purple-700 font-mono">
                            Level {generatedResult.level}
                          </span>
                        )}
                        {generatedResult.isVendor && (
                          <span className="text-xs px-2 py-0.5 rounded-md bg-amber-950 text-amber-300 border border-amber-700 font-mono">
                            Merchant Shop
                          </span>
                        )}
                      </h3>
                      <p className="text-xs text-stone-400">
                        {generatedResult.characterClass || generatedResult.race || generatedResult.school || generatedResult.itemType || generatedResult.type}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={handleCopyResult}
                        className="px-2.5 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                        title="Copy Raw JSON"
                      >
                        {copiedSuccess ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedSuccess ? 'Copied' : 'JSON'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Summary Card / Preview */}
                  <div className="p-3.5 bg-stone-950 border border-stone-800 rounded-xl text-xs space-y-3 text-stone-300">
                    {/* HP / AC / Speed Stats */}
                    {generatedResult.hpMax !== undefined && (
                      <div className="grid grid-cols-3 gap-2 bg-stone-900/80 p-2 rounded-lg text-center font-mono">
                        <div>
                          <span className="text-stone-500 block text-[10px]">HP Max</span>
                          <span className="text-emerald-400 font-bold">{generatedResult.hpMax} ({generatedResult.hitDiceTotal || 'Hit Dice'})</span>
                        </div>
                        <div>
                          <span className="text-stone-500 block text-[10px]">Armor Class</span>
                          <span className="text-blue-400 font-bold">{generatedResult.armorClass}</span>
                        </div>
                        <div>
                          <span className="text-stone-500 block text-[10px]">Speed</span>
                          <span className="text-amber-400 font-bold">{generatedResult.speed || 30} ft</span>
                        </div>
                      </div>
                    )}

                    {/* Merchant Inventory Preview */}
                    {Array.isArray(generatedResult.inventory) && generatedResult.inventory.length > 0 && (
                      <div>
                        <span className="font-bold text-amber-400 uppercase tracking-wider block mb-1 text-[11px]">
                          {entityType === 'merchant' ? 'Shop Wares for Sale:' : 'Starting Inventory:'}
                        </span>
                        <div className="space-y-1 max-h-32 overflow-y-auto">
                          {generatedResult.inventory.map((item: any, idx: number) => (
                            <div key={idx} className="p-1.5 bg-stone-900 rounded border border-stone-800 flex justify-between text-[11px]">
                              <span className="text-stone-200">{item.name} {item.quantity > 1 ? `(x${item.quantity})` : ''}</span>
                              <span className="text-amber-400 font-mono">{item.costGp ? `${item.costGp} GP` : item.itemType || 'Gear'}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Attacks */}
                    {Array.isArray(generatedResult.attacks) && generatedResult.attacks.length > 0 && (
                      <div>
                        <span className="font-bold text-amber-400 uppercase tracking-wider block mb-1 text-[11px]">Attacks & Actions:</span>
                        <div className="space-y-1.5">
                          {generatedResult.attacks.map((atk: any, idx: number) => (
                            <div key={idx} className="p-2 bg-stone-900 rounded-lg border border-stone-800 flex justify-between">
                              <div>
                                <span className="font-bold text-stone-200">{atk.name}</span>: <span className="text-stone-400">{atk.damage} {atk.damageType}</span>
                              </div>
                              <span className="font-mono text-amber-300 font-bold">+{atk.attackBonus}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Spell / Item Description */}
                    {(generatedResult.description || generatedResult.notes || generatedResult.summary || generatedResult.backstory) && (
                      <div>
                        <span className="font-bold text-amber-400 uppercase tracking-wider block mb-1 text-[11px]">Details & Lore:</span>
                        <p className="text-stone-300 leading-relaxed italic bg-stone-900/60 p-2.5 rounded-lg border border-stone-800">
                          {generatedResult.description || generatedResult.notes || generatedResult.summary || generatedResult.backstory}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Import confirmation badge */}
                  {importedSuccess && (
                    <div className="p-3 bg-emerald-950/90 border border-emerald-500/60 rounded-xl text-emerald-200 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 shadow-lg shadow-emerald-950/40">
                      <div className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                        <span className="font-medium">{importedSuccess}</span>
                      </div>
                      {entityType === 'item' && onNavigateTab && (
                        <button
                          onClick={() => {
                            if (onSelectCharacter && targetCharId) onSelectCharacter(targetCharId);
                            onNavigateTab('sheet3');
                            onClose();
                          }}
                          className="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-bold rounded-lg text-xs transition cursor-pointer flex items-center gap-1 shrink-0 shadow"
                        >
                          <span>Open Sheet 3</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {entityType === 'spell' && onNavigateTab && (
                        <button
                          onClick={() => {
                            if (onSelectCharacter && targetCharId) onSelectCharacter(targetCharId);
                            onNavigateTab('sheet4');
                            onClose();
                          }}
                          className="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-bold rounded-lg text-xs transition cursor-pointer flex items-center gap-1 shrink-0 shadow"
                        >
                          <span>Open Sheet 4</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  )}

                  {/* Target Character selector for items and spells */}
                  {(entityType === 'item' || entityType === 'spell') && characters && characters.length > 0 && (
                    <div className="flex items-center justify-between gap-2 p-2.5 bg-stone-900/90 border border-stone-800 rounded-xl">
                      <span className="text-xs font-bold text-stone-300 flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-amber-400" /> Destination Character:
                      </span>
                      <select
                        value={targetCharId}
                        onChange={(e) => setTargetCharId(e.target.value)}
                        className="bg-stone-950 border border-stone-700 text-amber-200 font-semibold text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-amber-500 cursor-pointer"
                      >
                        {characters.map(c => (
                          <option key={c.id} value={c.id}>
                            {c.name} {c.id === activeCharacter?.id ? '★ (Active)' : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Actions to Insert / Import */}
                  <div className="pt-2">
                    {importedSuccess && (entityType === 'item' || entityType === 'spell') ? (
                      <div className="flex gap-2">
                        <button
                          id="ai_forge_open_sheet_btn"
                          onClick={() => {
                            if (onSelectCharacter && targetCharId) onSelectCharacter(targetCharId);
                            if (onNavigateTab) onNavigateTab(entityType === 'item' ? 'sheet3' : 'sheet4');
                            onClose();
                          }}
                          className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-sm rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-amber-950/40 cursor-pointer"
                        >
                          <ChevronRight className="w-4 h-4" />
                          <span>
                            {entityType === 'item'
                              ? `Open ${(characters?.find(c => c.id === targetCharId) || activeCharacter)?.name || 'Character'}'s Inventory (Sheet 3)`
                              : `Open ${(characters?.find(c => c.id === targetCharId) || activeCharacter)?.name || 'Character'}'s Spellbook (Sheet 4)`}
                          </span>
                        </button>
                        <button
                          onClick={() => handleImportEntity()}
                          className="px-3.5 py-2.5 bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold text-xs rounded-xl transition cursor-pointer flex items-center gap-1"
                          title="Add another copy"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add Copy</span>
                        </button>
                      </div>
                    ) : (
                      <button
                        id="ai_forge_import_btn"
                        onClick={() => handleImportEntity()}
                        className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-stone-950 font-bold text-sm rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/40 cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                        <span>
                          {entityType === 'character'
                            ? 'Import to Hub as Player Character'
                            : entityType === 'class'
                            ? 'Save to Compendium Classes'
                            : entityType === 'race'
                            ? 'Save to Compendium Races'
                            : entityType === 'merchant'
                            ? 'Import to Hub as Merchant Shop'
                            : entityType === 'monster' || entityType === 'npc'
                            ? 'Import to Hub as Monster & Combatant'
                            : entityType === 'item'
                            ? `Add to ${(characters?.find(c => c.id === targetCharId) || activeCharacter)?.name || 'Character'}'s Inventory (Sheet 3)`
                            : entityType === 'spell'
                            ? `Add to ${(characters?.find(c => c.id === targetCharId) || activeCharacter)?.name || 'Character'}'s Spellbook (Sheet 4)`
                            : entityType === 'graph_node'
                            ? 'Add to Campaign Graph'
                            : 'Copy Entity Data'}
                        </span>
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-stone-500">
                  <Swords className="w-12 h-12 mb-3 text-stone-700" />
                  <p className="text-sm font-bold text-stone-400 mb-1">Entity Preview Empty</p>
                  <p className="text-xs max-w-sm">
                    Configure your desired creature, character, merchant, item, spell, or lore node on the left, then click <strong>"Forge Entity"</strong> to generate and inspect it here.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 3: Optional Personal API Key Settings */}
        {activeTab === 'settings' && (
          <div className="flex-1 p-6 overflow-y-auto space-y-6 max-w-2xl mx-auto">
            <div className="space-y-2">
              <h3 className="text-lg font-serif font-bold text-amber-200 flex items-center gap-2">
                <Key className="w-5 h-5 text-amber-400" />
                <span>AI Configuration & Personal Key (BYOK)</span>
              </h3>
              <p className="text-xs text-stone-400 leading-relaxed">
                The application connects to the AI assistant via the secure server backend. By default, queries use the shared application quota. If you wish to use your own personal API key to avoid any rate limits, you can enter it below.
              </p>
            </div>

            <div className="p-4 bg-stone-950 border border-stone-800 rounded-xl space-y-3">
              <label className="text-xs font-bold text-amber-400 block">
                Personal API Key:
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="password"
                  value={userApiKey}
                  onChange={e => setUserApiKey(e.target.value)}
                  placeholder="AIzaSy... (Leave empty to use app default)"
                  className="flex-1 px-3 py-2 bg-stone-900 border border-stone-700 rounded-lg text-sm text-stone-100 placeholder-stone-600 focus:outline-none focus:border-amber-500 font-mono"
                />
                <button
                  onClick={handleSaveApiKey}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold text-xs rounded-lg transition cursor-pointer"
                >
                  Save Key
                </button>
              </div>
              {keySavedMessage && (
                <p className="text-xs text-emerald-400 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> API Key setting saved locally!
                </p>
              )}
              <p className="text-[11px] text-stone-500">
                You can get a free personal API key at{' '}
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-amber-400 underline hover:text-amber-300 inline-flex items-center gap-0.5"
                >
                  aistudio.google.com <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Full Size Image Preview Modal */}
      {previewModalImage && (
        <div
          className="fixed inset-0 z-60 bg-stone-950/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setPreviewModalImage(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] bg-stone-900 border border-stone-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            <div className="px-4 py-2.5 bg-stone-950 border-b border-stone-800 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
                <ImageIcon className="w-4 h-4 text-amber-400" />
                <span>Screenshot / Image Preview</span>
              </div>
              <button
                onClick={() => setPreviewModalImage(null)}
                className="p-1.5 rounded-lg text-stone-400 hover:text-stone-100 hover:bg-stone-800 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-2 overflow-auto flex items-center justify-center bg-stone-950/60">
              <img
                src={previewModalImage}
                alt="Full preview"
                className="max-w-full max-h-[80vh] object-contain rounded-lg"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AiAssistantModal;
