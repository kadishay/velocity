#!/usr/bin/env node

import { Command } from 'commander';
import { setVerbose } from './utils/logger.js';
import { initCommand } from './commands/init.js';
import { extractCommand } from './commands/extract.js';
import { metricsCommand } from './commands/metrics.js';

const program = new Command();

program
  .name('velocity')
  .description('Developer velocity metrics extraction and analysis tool')
  .version('0.1.0')
  .option('-v, --verbose', 'Enable verbose output')
  .hook('preAction', (thisCommand) => {
    const opts = thisCommand.opts();
    if (opts.verbose) {
      setVerbose(true);
    }
  });

program
  .command('init')
  .description('Initialize a new velocity configuration file')
  .option('-f, --force', 'Overwrite existing configuration')
  .action(initCommand);

program
  .command('extract')
  .description('Extract data from GitHub repositories')
  .option('-r, --repos <repos>', 'Comma-separated list of repositories (owner/repo)')
  .option('-c, --config <path>', 'Path to configuration file')
  .option('-d, --days <number>', 'Number of days to extract', '30')
  .option('-o, --output <path>', 'Output directory for data files', './data')
  .action(extractCommand);

program
  .command('metrics')
  .description('Calculate metrics from extracted data')
  .option('-i, --input <path>', 'Input directory containing data files', './data')
  .option('-o, --output <path>', 'Output file for metrics', './data/metrics.json')
  .action(metricsCommand);

program.parse();
