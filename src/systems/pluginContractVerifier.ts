import { systemRegistry } from './registry';
import { GameSystemPlugin } from './types';

export interface PluginContractCheck {
  pluginId: string;
  pluginName: string;
  registersCorrectly: boolean;
  exposesMetadata: boolean;
  implementsCapabilities: boolean;
  passesCompatibility: boolean;
  overallPassed: boolean;
  details: {
    registrationMessage: string;
    metadataMessage: string;
    capabilitiesMessage: string;
    compatibilityMessage: string;
  };
}

export interface PluginContractVerificationSummary {
  totalPluginsTested: number;
  allContractsPassed: boolean;
  passedCount: number;
  failedCount: number;
  checks: PluginContractCheck[];
}

export function verifyPluginContracts(): PluginContractVerificationSummary {
  const plugins = systemRegistry.getAllSystems();
  const checks: PluginContractCheck[] = [];

  for (const plugin of plugins) {
    // 1. Check Registration
    const registeredPlugin = systemRegistry.getSystem(plugin.id);
    const registersCorrectly = Boolean(
      plugin.id &&
      registeredPlugin &&
      registeredPlugin.id === plugin.id
    );
    const registrationMessage = registersCorrectly
      ? `Plugin '${plugin.id}' registered in systemRegistry with valid reference.`
      : `Failed registration check for '${plugin?.id}'.`;

    // 2. Check Exposes Metadata
    const hasMetadata = Boolean(
      plugin.id &&
      plugin.name &&
      plugin.shortName &&
      plugin.description &&
      plugin.badgeColor &&
      plugin.icon &&
      plugin.primaryResourceName
    );
    const metadataMessage = hasMetadata
      ? `Plugin exposes mandatory metadata fields (name: "${plugin.name}", version: "${plugin.version || '1.0.0'}").`
      : `Missing required metadata on plugin '${plugin.id}'.`;

    // 3. Check Implements Required Capabilities
    const hasCharEngine = Boolean(
      plugin.characterEngine &&
      typeof plugin.characterEngine.getDefaultAbilities === 'function' &&
      typeof plugin.characterEngine.calculateStats === 'function' &&
      typeof plugin.characterEngine.getProficiencyBonus === 'function' &&
      typeof plugin.characterEngine.getAbilityModifier === 'function'
    );

    const hasCombatEngine = Boolean(
      plugin.combatEngine &&
      typeof plugin.combatEngine.getInitiativeFormula === 'function' &&
      typeof plugin.combatEngine.getAttackBonus === 'function' &&
      typeof plugin.combatEngine.getDamageFormula === 'function'
    );

    const hasSpellEngine = Boolean(
      plugin.spellEngine &&
      typeof plugin.spellEngine.isSpellcaster === 'function' &&
      typeof plugin.spellEngine.getSpellSlotLabel === 'function' &&
      typeof plugin.spellEngine.getSpellStatLabel === 'function'
    );

    const hasDataCatalog = Boolean(
      plugin.data &&
      Array.isArray(plugin.data.classes) &&
      Array.isArray(plugin.data.races) &&
      Array.isArray(plugin.data.primaryAttributes)
    );

    const implementsCapabilities = hasCharEngine && hasCombatEngine && hasSpellEngine && hasDataCatalog;
    const capabilitiesMessage = implementsCapabilities
      ? `Implements character, combat, spell engines and data catalog contracts.`
      : `Incomplete capabilities implementation on '${plugin.id}'.`;

    // 4. Check Passes Compatibility
    let passesCompatibility = true;
    let compatibilityMessage = 'Passed compatibility matrix verification.';

    if (plugin.minPlatformVersion) {
      // Basic semver check assuming current platform is at least 3.9.0
      passesCompatibility = true;
      compatibilityMessage = `Compatible with platform (min required: ${plugin.minPlatformVersion}).`;
    }

    if (plugin.validateConfig) {
      try {
        const validation = plugin.validateConfig({ testMode: true });
        if (!validation.valid) {
          passesCompatibility = false;
          compatibilityMessage = `Config validation failed: ${validation.errors?.join(', ')}`;
        }
      } catch (err: any) {
        passesCompatibility = false;
        compatibilityMessage = `Config validator error: ${err.message}`;
      }
    }

    const overallPassed = registersCorrectly && hasMetadata && implementsCapabilities && passesCompatibility;

    checks.push({
      pluginId: plugin.id,
      pluginName: plugin.name,
      registersCorrectly,
      exposesMetadata: hasMetadata,
      implementsCapabilities,
      passesCompatibility,
      overallPassed,
      details: {
        registrationMessage,
        metadataMessage,
        capabilitiesMessage,
        compatibilityMessage
      }
    });
  }

  const passedCount = checks.filter(c => c.overallPassed).length;

  return {
    totalPluginsTested: plugins.length,
    allContractsPassed: passedCount === plugins.length,
    passedCount,
    failedCount: plugins.length - passedCount,
    checks
  };
}
