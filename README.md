# Nexus TRPG Platform 🎲✨

> **Next-Generation Tabletop RPG Character Manager, Virtual Tabletop Companion & Live Multiplayer Hub**

Nexus is a modular, high-performance web platform designed for Tabletop Roleplaying Games. It features multi-system support (D&D 5e, D&D 3.5e, Pathfinder 2e, Shadowrun 5e, Call of Cthulhu 7e), real-time party synchronization, persistent campaign ambience streaming (YouTube & Spotify), dynamic combat matrix management, and rich rulebook compendiums.

---

## 🌟 Key Features

- **🛡️ Multi-System Character Sheets**: 7 dedicated views for character management (Stats, Combat, Gear & Wealth, Spells & Powers, Notes & Lore, Rules & Compendium, and DM Overview).
- **⚔️ Real-Time Combat Matrix & Initiative Tracker**: Live HP tracking, AC calculations, death saves, conditions, turn management, and synchronized party statuses.
- **🎙️ Campaign Ambience & Party Audio Studio**: Dungeon Masters can broadcast YouTube and Spotify tracks or playlists live to all connected players. Background audio runs non-stop across sheet navigation and tab swaps.
- **🎲 Polyhedral 3D/Audio Synthesizer Dice**: Full mathematical dice roller supporting advantage, disadvantage, modifiers, custom roll formulas, and synthesized audio clatter.
- **🌐 Real-Time Multiplayer Rooms**: Session lobbies with live party presence, character binding, chat, and WebRTC-based party voice rooms.
- **⚡ Offline-First Architecture**: Dual persistence with instant IndexedDB/localStorage reactivity coupled with seamless cloud synchronization via Firebase Firestore.
- **🪟 Detachable Multi-Monitor Windows**: Pop out any sheet (including the DM Overview or Combat Matrix) into a separate window for secondary monitor and GM screen setups.
- **🧩 Extensible Plugin & Custom System API**: Developer-friendly event bus and extensible rule hooks to add homebrew mechanics, classes, and new game systems.

---

## 🚀 Quick Start & Development

### Prerequisites

- **Node.js**: `v20.0.0` or higher
- **npm** or **bun** / **yarn**

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/nexus.git
cd nexus

# Install dependencies
npm install

# Start development server
npm run dev
```

The application dev server runs on `http://localhost:3000`.

---

## 🛠️ Available Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts the Express + Vite development server with hot reload |
| `npm run build` | Compiles the client app with Vite and bundles the Node server with esbuild |
| `npm run start` | Boots the production CommonJS bundled server |
| `npm run test` | Runs the test suite using Vitest |
| `npm run lint` | Runs TypeScript compilation checks across the codebase |
| `npm run analyze-bundle`| Runs the bundle size analyzer script |
| `npm run audit:all` | Executes build, bundle analysis, lighthouse audit, and regression tests |

---

## 📂 Project Architecture

```
nexus/
├── src/
│   ├── components/          # Modular React UI components
│   │   ├── audio/           # Persistent background audio players
│   │   ├── combat/          # Initiative trackers & combat HUD
│   │   ├── common/          # Shared inputs, modals & UI primitives
│   │   ├── modals/          # Options, dice, leveling & upgrade modals
│   │   ├── sheets/          # System-specific & tabbed character sheets
│   │   └── voice/           # WebRTC party voice communications
│   ├── context/             # Global React Contexts (Auth, Hotkeys, Sound, Subscriptions)
│   ├── data/                # Static rulebooks, compendiums & changelogs
│   ├── events/              # Centralized decoupled EventBus architecture
│   ├── i18n/                # Internationalization dictionaries
│   ├── lib/                 # Firebase, Firestore rules & subscription services
│   ├── types/               # TypeScript interfaces, schemas & type definitions
│   └── utils/               # Audio synthesizers, dice math & D&D rule engines
├── docs/                    # Architecture guides, plugin guides & API specs
│   └── adr/                 # Architecture Decision Records (ADRs)
├── server.ts                # Full-stack Express backend & API proxy
└── package.json             # Project dependencies & scripts
```

---

## 📖 Documentation & ADRs

- **Architecture Overview**: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)
- **Plugin System Guide**: [`docs/PLUGIN_GUIDE.md`](docs/PLUGIN_GUIDE.md)
- **Architecture Decision Records (ADRs)**: [`docs/adr/`](docs/adr/README.md)
- **Contributing Guidelines**: [`CONTRIBUTING.md`](CONTRIBUTING.md)

---

## 🤝 Contributing

We welcome community contributions! Please read our [Contribution Guide](CONTRIBUTING.md) to learn about code standards, branching workflows, and pull request guidelines.

---

## ⚖️ Fair-Play & Licensing

Nexus is committed to fair-play gaming: no core rulebook mechanics, dice math, leveling, spells, or combat features are locked behind paywalls. Supporter subscriptions (Hero and Guild Master) support server costs, multiplayer WebRTC relay infrastructure, and provide vanity cosmetics.
