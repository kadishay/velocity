import { describe, it, expect } from 'vitest';
import { validateRepoFormat, parseRepo, getSettings } from './config.js';
import type { VelocityConfig } from '../types/index.js';

describe('config utilities', () => {
  describe('validateRepoFormat', () => {
    it('should accept valid repo format', () => {
      expect(validateRepoFormat('owner/repo')).toBe(true);
      expect(validateRepoFormat('my-org/my-repo')).toBe(true);
      expect(validateRepoFormat('org123/repo_name')).toBe(true);
      expect(validateRepoFormat('Org.Name/Repo.Name')).toBe(true);
    });

    it('should reject invalid repo format', () => {
      expect(validateRepoFormat('repo')).toBe(false);
      expect(validateRepoFormat('owner/repo/extra')).toBe(false);
      expect(validateRepoFormat('')).toBe(false);
      expect(validateRepoFormat('owner/')).toBe(false);
      expect(validateRepoFormat('/repo')).toBe(false);
    });
  });

  describe('parseRepo', () => {
    it('should parse repo into owner and name', () => {
      const result = parseRepo('my-org/my-repo');
      expect(result.owner).toBe('my-org');
      expect(result.name).toBe('my-repo');
    });
  });

  describe('getSettings', () => {
    it('should return default settings when none provided', () => {
      const config: VelocityConfig = { repositories: [] };
      const settings = getSettings(config);

      expect(settings.defaultDateRange).toBe(30);
      expect(settings.deploymentBranch).toBe('main');
      expect(settings.excludeAuthors).toEqual([]);
      expect(settings.excludeLabels).toEqual([]);
      expect(settings.excludeDraftPRs).toBe(true);
    });

    it('should merge provided settings with defaults', () => {
      const config: VelocityConfig = {
        repositories: [],
        settings: {
          defaultDateRange: 60,
          deploymentBranch: 'main',
          excludeAuthors: ['bot'],
          excludeLabels: [],
          excludeDraftPRs: false,
        },
      };
      const settings = getSettings(config);

      expect(settings.defaultDateRange).toBe(60);
      expect(settings.excludeAuthors).toEqual(['bot']);
      expect(settings.excludeDraftPRs).toBe(false);
    });
  });
});
