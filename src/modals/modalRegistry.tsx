import React, { lazy, Suspense } from 'react';
import { ModalId, ModalPropsMap } from './modalTypes';
import { Loader2 } from 'lucide-react';

// Lazy-loaded modal components for maximum bundle optimization and fast initial load
const AuthModal = lazy(() =>
  import('../components/modals/AuthModal').then(m => ({ default: m.AuthModal }))
);
const TRPGSystemSelectorModal = lazy(() =>
  import('../components/modals/TRPGSystemSelectorModal').then(m => ({ default: m.TRPGSystemSelectorModal }))
);
const PartyManagerModal = lazy(() =>
  import('../components/modals/PartyManagerModal').then(m => ({ default: m.PartyManagerModal }))
);
const SessionLobbyModal = lazy(() =>
  import('../components/modals/SessionLobbyModal').then(m => ({ default: m.SessionLobbyModal }))
);
const AudioOptionsModal = lazy(() =>
  import('../components/modals/AudioOptionsModal').then(m => ({ default: m.AudioOptionsModal }))
);
const UniversalImporterStudioModal = lazy(() =>
  import('../components/modals/UniversalImporterStudioModal').then(m => ({ default: m.UniversalImporterStudioModal }))
);
const ExtensionManagerModal = lazy(() =>
  import('../components/modals/ExtensionManagerModal').then(m => ({ default: m.ExtensionManagerModal }))
);
const DeveloperSdkModal = lazy(() =>
  import('../components/modals/DeveloperSdkModal').then(m => ({ default: m.DeveloperSdkModal }))
);
const DiagnosticConsoleModal = lazy(() =>
  import('../components/diagnostics/DiagnosticConsoleModal').then(m => ({ default: m.DiagnosticConsoleModal }))
);
const UserManualModal = lazy(() =>
  import('../components/modals/UserManualModal').then(m => ({ default: m.UserManualModal }))
);
const CampaignGraphModal = lazy(() =>
  import('../components/modals/CampaignGraphModal').then(m => ({ default: m.CampaignGraphModal }))
);
const AiAssistantModal = lazy(() =>
  import('../components/modals/AiAssistantModal').then(m => ({ default: m.AiAssistantModal }))
);
const TabletopGeneratorsModal = lazy(() =>
  import('../components/modals/TabletopGeneratorsModal').then(m => ({ default: m.TabletopGeneratorsModal }))
);
const CampaignLoreVaultModal = lazy(() =>
  import('../components/modals/CampaignLoreVaultModal').then(m => ({ default: m.CampaignLoreVaultModal }))
);
const UpgradeModal = lazy(() =>
  import('../components/modals/UpgradeModal').then(m => ({ default: m.UpgradeModal }))
);
const NewCharacterModal = lazy(() =>
  import('../components/modals/NewCharacterModal').then(m => ({ default: m.NewCharacterModal }))
);
const LevelUpWizardModal = lazy(() =>
  import('../components/modals/LevelUpWizardModal').then(m => ({ default: m.LevelUpWizardModal }))
);
const LegalLicensingModal = lazy(() =>
  import('../components/modals/LegalLicensingModal').then(m => ({ default: m.LegalLicensingModal }))
);
const SessionOrchestratorModal = lazy(() =>
  import('../components/modals/SessionOrchestratorModal').then(m => ({ default: m.SessionOrchestratorModal }))
);

export function ModalLoadingFallback() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs">
      <div className="flex items-center gap-3 px-5 py-3.5 rounded-xl bg-zinc-900 border border-zinc-700/60 shadow-2xl text-zinc-200">
        <Loader2 className="w-5 h-5 animate-spin text-indigo-400" />
        <span className="text-xs font-semibold tracking-wide">Loading workspace module...</span>
      </div>
    </div>
  );
}

export interface ModalRendererProps<K extends ModalId = ModalId> {
  modalId: K;
  props: ModalPropsMap[K];
  onClose: () => void;
}

export function renderRegisteredModal<K extends ModalId>({
  modalId,
  props,
  onClose
}: ModalRendererProps<K>): React.ReactNode {
  switch (modalId) {
    case 'auth': {
      const p = props as ModalPropsMap['auth'];
      return (
        <Suspense fallback={<ModalLoadingFallback />}>
          <AuthModal
            isOpen={true}
            onClose={onClose}
            currentUser={p.currentUser || null}
            onUserChange={p.onUserChange || (() => {})}
          />
        </Suspense>
      );
    }
    case 'trpg-selector': {
      const p = props as ModalPropsMap['trpg-selector'];
      return (
        <Suspense fallback={<ModalLoadingFallback />}>
          <TRPGSystemSelectorModal
            isOpen={true}
            onClose={onClose}
            enabledSystems={p.enabledSystems}
            onSaveSystems={p.onSaveSystems}
            isInitialSetup={p.isInitialSetup}
          />
        </Suspense>
      );
    }
    case 'party-manager': {
      const p = props as ModalPropsMap['party-manager'];
      return (
        <Suspense fallback={<ModalLoadingFallback />}>
          <PartyManagerModal
            isOpen={true}
            onClose={onClose}
            parties={p.parties}
            allCharacters={p.allCharacters}
            activeCharacterId={p.activeCharacterId}
            onUpdateParties={p.onUpdateParties}
            onSelectCharacter={p.onSelectCharacter}
            currentUser={p.currentUser}
            presenceMap={p.presenceMap}
            onUpdateCharacter={p.onUpdateCharacter}
          />
        </Suspense>
      );
    }
    case 'session-lobby': {
      const p = props as ModalPropsMap['session-lobby'];
      return (
        <Suspense fallback={<ModalLoadingFallback />}>
          <SessionLobbyModal
            isOpen={true}
            onClose={onClose}
            currentUser={p.currentUser}
            activeSession={p.activeSession}
            activeSessionCode={p.activeSessionCode}
            activeCharacter={p.activeCharacter}
            allCharacters={p.allCharacters}
            presenceMap={p.presenceMap}
            onSessionChange={p.onSessionChange}
            onSelectCharacter={p.onSelectCharacter}
            onOpenAuthModal={p.onOpenAuthModal}
            onLoadCampaignSave={p.onLoadCampaignSave}
          />
        </Suspense>
      );
    }
    case 'audio-options': {
      const p = props as ModalPropsMap['audio-options'];
      return (
        <Suspense fallback={<ModalLoadingFallback />}>
          <AudioOptionsModal
            isOpen={true}
            onClose={onClose}
            currentUser={p.currentUser}
            activeSession={p.activeSession}
            activeCharacter={p.activeCharacter}
            onUpdateCharacter={p.onUpdateCharacter}
            onSystemChange={p.onSystemChange}
            onExportJson={p.onExportJson}
            onImportJson={p.onImportJson}
            onOpenAuthModal={p.onOpenAuthModal}
            onOpenUniversalImporterStudio={p.onOpenUniversalImporterStudio}
            onUndo={p.onUndo}
            onRedo={p.onRedo}
            canUndo={p.canUndo}
            canRedo={p.canRedo}
          />
        </Suspense>
      );
    }
    case 'universal-importer': {
      const p = props as ModalPropsMap['universal-importer'];
      return (
        <Suspense fallback={<ModalLoadingFallback />}>
          <UniversalImporterStudioModal
            isOpen={true}
            onClose={onClose}
            activeCharacter={p.activeCharacter}
            characters={p.characters}
            edition={p.edition}
            onImportCharacter={p.onImportCharacter}
            onImportMultipleCharacters={p.onImportMultipleCharacters}
          />
        </Suspense>
      );
    }
    case 'extension-manager': {
      const p = props as ModalPropsMap['extension-manager'];
      return (
        <Suspense fallback={<ModalLoadingFallback />}>
          <ExtensionManagerModal
            isOpen={true}
            onClose={onClose}
            enabledSystems={p.enabledSystems}
            onToggleSystem={p.onToggleSystem}
            onOpenDeveloperSdk={p.onOpenDeveloperSdk}
          />
        </Suspense>
      );
    }
    case 'developer-sdk': {
      return (
        <Suspense fallback={<ModalLoadingFallback />}>
          <DeveloperSdkModal
            isOpen={true}
            onClose={onClose}
          />
        </Suspense>
      );
    }
    case 'diagnostic-console': {
      return (
        <Suspense fallback={<ModalLoadingFallback />}>
          <DiagnosticConsoleModal
            isOpen={true}
            onClose={onClose}
          />
        </Suspense>
      );
    }
    case 'user-manual': {
      return (
        <Suspense fallback={<ModalLoadingFallback />}>
          <UserManualModal
            isOpen={true}
            onClose={onClose}
          />
        </Suspense>
      );
    }
    case 'campaign-graph': {
      const p = props as ModalPropsMap['campaign-graph'];
      return (
        <Suspense fallback={<ModalLoadingFallback />}>
          <CampaignGraphModal
            isOpen={true}
            onClose={onClose}
            initialEntityName={p.initialEntityName}
            onNavigateTab={p.onNavigateTab}
          />
        </Suspense>
      );
    }
    case 'ai-assistant': {
      const p = props as ModalPropsMap['ai-assistant'];
      return (
        <Suspense fallback={<ModalLoadingFallback />}>
          <AiAssistantModal
            isOpen={true}
            onClose={onClose}
            activeCharacter={p.activeCharacter}
            characters={p.characters}
            ruleEdition={p.ruleEdition}
            onAddCharacter={p.onAddCharacter}
            onAddItemToInventory={p.onAddItemToInventory}
            onAddSpellToSpellbook={p.onAddSpellToSpellbook}
            onNavigateTab={p.onNavigateTab}
            onSelectCharacter={p.onSelectCharacter}
            onLoadBattlemapLayout={p.onLoadBattlemapLayout}
          />
        </Suspense>
      );
    }
    case 'tabletop-generators': {
      const p = props as ModalPropsMap['tabletop-generators'];
      return (
        <Suspense fallback={<ModalLoadingFallback />}>
          <TabletopGeneratorsModal
            isOpen={true}
            onClose={onClose}
            initialTab={p.initialTab}
            activeCharacter={p.activeCharacter}
            ruleEdition={p.ruleEdition}
            onAddCharacter={p.onAddCharacter}
            onAddItemToInventory={p.onAddItemToInventory}
            onAddSpellToSpellbook={p.onAddSpellToSpellbook}
            onPopulateCombatEncounter={p.onPopulateCombatEncounter}
            onAppendSessionNotes={p.onAppendSessionNotes}
          />
        </Suspense>
      );
    }
    case 'campaign-lore-vault': {
      const p = props as ModalPropsMap['campaign-lore-vault'];
      return (
        <Suspense fallback={<ModalLoadingFallback />}>
          <CampaignLoreVaultModal
            isOpen={true}
            onClose={onClose}
            initialTab={p.initialTab}
            activeCharacter={p.activeCharacter}
            characters={p.characters}
            parties={p.parties}
            currentUser={p.currentUser}
            onUpdateCharacter={p.onUpdateCharacter}
            onAddItemToInventory={p.onAddItemToInventory}
            onOpenKnowledgeGraph={p.onOpenKnowledgeGraph}
            onOpenGenerators={p.onOpenGenerators}
            onLaunchEncounterAtLocation={p.onLaunchEncounterAtLocation}
          />
        </Suspense>
      );
    }
    case 'session-orchestrator': {
      const p = props as ModalPropsMap['session-orchestrator'];
      return (
        <Suspense fallback={<ModalLoadingFallback />}>
          <SessionOrchestratorModal
            isOpen={true}
            onClose={onClose}
            initialTab={p.initialTab}
            activeCharacter={p.activeCharacter || null}
            characters={p.characters || []}
            parties={p.parties || []}
            ruleEdition={p.ruleEdition || '5e'}
            onUpdateCharacter={p.onUpdateCharacter}
            onLaunchEncounterAtLocation={p.onLaunchEncounterAtLocation}
            onNavigateTab={p.onNavigateTab}
          />
        </Suspense>
      );
    }
    case 'upgrade': {
      const p = props as ModalPropsMap['upgrade'];
      return (
        <Suspense fallback={<ModalLoadingFallback />}>
          <UpgradeModal
            isOpen={true}
            onClose={onClose}
            defaultTier={p.defaultTier}
            reason={p.reason}
          />
        </Suspense>
      );
    }
    case 'new-character': {
      const p = props as ModalPropsMap['new-character'];
      return (
        <Suspense fallback={<ModalLoadingFallback />}>
          <NewCharacterModal
            onClose={onClose}
            onCreate={p.onCreate}
            initialEdition={p.initialEdition}
            initialIsMonster={p.initialIsMonster}
            initialIsVendor={p.initialIsVendor}
            enabledSystems={p.enabledSystems}
            existingCampaigns={p.existingCampaigns}
            initialCampaignName={p.initialCampaignName}
          />
        </Suspense>
      );
    }
    case 'level-up-wizard': {
      const p = props as ModalPropsMap['level-up-wizard'];
      return (
        <Suspense fallback={<ModalLoadingFallback />}>
          <LevelUpWizardModal
            isOpen={true}
            onClose={onClose}
            character={p.character}
            onUpdateCharacter={p.onUpdateCharacter}
            onRoll={p.onRoll}
          />
        </Suspense>
      );
    }
    case 'legal-licensing': {
      const p = (props || {}) as ModalPropsMap['legal-licensing'];
      return (
        <Suspense fallback={<ModalLoadingFallback />}>
          <LegalLicensingModal
            isOpen={true}
            onClose={onClose}
            defaultTab={p.defaultTab}
          />
        </Suspense>
      );
    }
    default:
      return null;
  }
}
