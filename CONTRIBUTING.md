# Contributing to Nexus TRPG 🎲✨

Thank you for your interest in contributing to Nexus! Whether you're fixing a bug, designing a new character sheet tab, contributing homebrew mechanics, or adding a new tabletop system, we are thrilled to have you.

This document outlines our development workflow, coding standards, and how to submit high-quality pull requests.

---

## 🧭 Code of Conduct

We are dedicated to providing a friendly, safe, and welcoming environment for everyone, regardless of background, identity, or skill level. Please treat all contributors and maintainers with respect and courtesy.

---

## 🛠️ Getting Started

1. **Fork the repository** on GitHub.
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/<your-username>/nexus.git
   cd nexus
   ```
3. **Install dependencies**:
   ```bash
   npm install
   ```
4. **Create a topic branch**:
   ```bash
   git checkout -b feature/my-cool-feature
   # or
   git checkout -b fix/spell-slot-calculation
   ```
5. **Start development mode**:
   ```bash
   npm run dev
   ```

---

## 📐 Architecture & Development Guidelines

### 1. TypeScript & Strict Typing
- Nexus is written in TypeScript. Avoid `any` where possible.
- Shared interfaces, types, and data models belong in `src/types/` or `src/types.ts`.
- Ensure all types compile cleanly with `npm run lint`.

### 2. Styling with Tailwind CSS
- Use utility classes provided by Tailwind CSS.
- Adhere to the established palette: high-contrast dark fantasy theme (`stone-950`, `stone-900`, `amber-500`, `amber-400`).
- Touch targets on interactive elements must be accessible (at least 44px on touch devices or appropriately padded on desktop).

### 3. Modularity & State Management
- **Single-Responsibility Components**: Break complex views into granular components under `src/components/`.
- **Decoupled Events**: Use the centralized `eventBus` (`src/events/eventBus.ts`) for cross-cutting triggers (such as sound effects, dice rolls, or modal alerts).
- **Persistent Campaign Audio**: Do not unmount audio players on sheet switches. Persistent audio must remain mounted at the root level (`PersistentAmbiencePlayer`).

### 4. Architecture Decision Records (ADRs)
If you propose a significant architectural shift (e.g., adding an external database, changing state persistence models, or adding major protocols), document it in `docs/adr/`. See [`docs/adr/README.md`](docs/adr/README.md) for details.

---

## 🧪 Testing & Quality Assurance

Before submitting a Pull Request, run the automated verification checks:

```bash
# 1. TypeScript check
npm run lint

# 2. Unit & Integration test suite
npm run test

# 3. Production build test
npm run build
```

All checks must pass green before a PR will be merged.

---

## 📝 Commit Conventions

We follow clean, conventional commit messages:

- `feat: add shadowrun 5e matrix initiative tracker`
- `fix: resolve spell slot decrement bug on multi-class sheets`
- `docs: update adr-0003 for persistent background audio`
- `refactor: extract dice modifier calculation to separate utility`
- `style: adjust combat hud spacing on mobile screens`

---

## 🚀 Submitting a Pull Request

1. Push your changes to your branch on GitHub:
   ```bash
   git push origin feature/my-cool-feature
   ```
2. Open a Pull Request against the `main` branch.
3. Provide a clear summary of your changes in the PR description:
   - What problem does this solve?
   - What new features or components were introduced?
   - Any manual testing steps for reviewers to verify.
4. Respond promptly to reviewer feedback.

---

## 💬 Community & Help

If you have questions, encounter ambiguities, or want to discuss a new tabletop system implementation before coding:
- Open a **GitHub Discussion** or **Issue**.
- Reference existing system implementations in `src/components/sheets/` and `src/utils/`.
