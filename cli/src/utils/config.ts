import { readFile, writeFile, access } from 'node:fs/promises';
import { join } from 'node:path';
import { VelocityConfig, VelocityConfigSchema } from '../types/index.js';
import { logger } from './logger.js';

const CONFIG_FILENAME = 'velocity.config.json';

/**
 * Check if a config file exists at the given path
 */
export async function configExists(dir: string = process.cwd()): Promise<boolean> {
  try {
    await access(join(dir, CONFIG_FILENAME));
    return true;
  } catch {
    return false;
  }
}

/**
 * Load and validate configuration from file
 */
export async function loadConfig(configPath?: string): Promise<VelocityConfig> {
  const filePath = configPath || join(process.cwd(), CONFIG_FILENAME);

  try {
    const content = await readFile(filePath, 'utf-8');
    const parsed = JSON.parse(content);
    const validated = VelocityConfigSchema.parse(parsed);
    logger.debug(`Loaded config from ${filePath}`);
    return validated;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      throw new Error(
        `Configuration file not found: ${filePath}\n` +
          'Run "velocity init" to create a configuration file.'
      );
    }
    if (error instanceof SyntaxError) {
      throw new Error(`Invalid JSON in configuration file: ${filePath}\n${error.message}`);
    }
    if (error instanceof Error && error.name === 'ZodError') {
      const zodError = error as unknown as { errors: { path: string[]; message: string }[] };
      const issues = zodError.errors
        .map((e) => `  - ${e.path.join('.')}: ${e.message}`)
        .join('\n');
      throw new Error(`Invalid configuration in ${filePath}:\n${issues}`);
    }
    throw error;
  }
}

/**
 * Create a default configuration file
 */
export async function createConfig(dir: string = process.cwd()): Promise<string> {
  const filePath = join(dir, CONFIG_FILENAME);

  const defaultConfig: VelocityConfig = {
    repositories: [],
    teams: {
      // Example team configuration (commented out in the actual file)
    },
    settings: {
      defaultDateRange: 30,
      deploymentBranch: 'main',
      excludeAuthors: ['dependabot[bot]', 'renovate[bot]', 'github-actions[bot]'],
      excludeLabels: [],
      excludeDraftPRs: true,
    },
  };

  const configWithComments = `{
  "repositories": [
    // Add your repositories here, e.g.:
    // "owner/repo-name",
    // "owner/another-repo"
  ],
  "teams": {
    // Define teams and their members, e.g.:
    // "frontend": {
    //   "displayName": "Frontend Team",
    //   "members": ["user1", "user2"],
    //   "repositories": ["owner/frontend-app"],
    //   "color": "#4A90D9"
    // }
  },
  "settings": {
    "defaultDateRange": ${defaultConfig.settings?.defaultDateRange},
    "deploymentBranch": "${defaultConfig.settings?.deploymentBranch}",
    "excludeAuthors": ${JSON.stringify(defaultConfig.settings?.excludeAuthors)},
    "excludeLabels": ${JSON.stringify(defaultConfig.settings?.excludeLabels)},
    "excludeDraftPRs": ${defaultConfig.settings?.excludeDraftPRs}
  }
}`;

  // Write the actual valid JSON (without comments) for parsing
  await writeFile(filePath, JSON.stringify(defaultConfig, null, 2) + '\n');

  return filePath;
}

/**
 * Get the default settings merged with any provided settings
 */
export function getSettings(config: VelocityConfig): Required<VelocityConfig>['settings'] {
  return {
    defaultDateRange: config.settings?.defaultDateRange ?? 30,
    deploymentBranch: config.settings?.deploymentBranch ?? 'main',
    excludeAuthors: config.settings?.excludeAuthors ?? [],
    excludeLabels: config.settings?.excludeLabels ?? [],
    excludeDraftPRs: config.settings?.excludeDraftPRs ?? true,
  };
}

/**
 * Validate repository format (owner/repo)
 */
export function validateRepoFormat(repo: string): boolean {
  const pattern = /^[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+$/;
  return pattern.test(repo);
}

/**
 * Parse repository string into owner and repo name
 */
export function parseRepo(repo: string): { owner: string; name: string } {
  const [owner, name] = repo.split('/');
  return { owner, name };
}
