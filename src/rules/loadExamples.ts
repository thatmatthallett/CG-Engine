/**
 * Example Rule Module Loader Utility
 *
 * @teaching-point: This demonstrates how you can load game rules from
 * JSON files at runtime. In production, you might load them from a REST API
 * or directly from your project's /rules directory.
 */

import { RulesEngine } from './loader';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';

const EXAMPLES_DIR = join(
  __dirname,
  '../rules/examples'
);

/**
 * Load all example rules into the engine
 */
export function loadExampleRules(engine: RulesEngine): void {
  const files = readdirSync(EXAMPLES_DIR);

  for (const file of files) {
    if (file.endsWith('.json')) {
      console.log(`[RuleLoader] Loading example: ${file}`);
      const content = readFileSync(
        join(EXAMPLES_DIR, file),
        'utf8'
      );
      try {
        engine.load(content);
        console.log(`[RuleLoader] ✅ Loaded ${file}`);
      } catch (error) {
        console.error(
          `[RuleLoader] ❌ Failed to load ${file}:`,
          error instanceof Error ? error.message : error
        );
      }
    }
  }
}

/**
 * Load a specific rule module by name
 */
export async function loadRuleModuleByName(
  engine: RulesEngine,
  moduleName: string
): Promise<unknown> {
  const path = join(EXAMPLES_DIR, `${moduleName}.json`);

  if (!fs.existsSync(path)) {
    throw new Error(`No rule module found for: ${moduleName}`);
  }

  const content = readFileSync(path, 'utf8');
  return engine.load(content);
}
