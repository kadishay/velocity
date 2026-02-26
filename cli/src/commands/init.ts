import ora from 'ora';
import { configExists, createConfig } from '../utils/config.js';
import { logger } from '../utils/logger.js';

interface InitCommandOptions {
  force?: boolean;
}

export async function initCommand(options: InitCommandOptions): Promise<void> {
  const spinner = ora();

  try {
    // Check if config already exists
    if (await configExists()) {
      if (!options.force) {
        logger.warn('Configuration file already exists: velocity.config.json');
        logger.info('Use --force to overwrite the existing configuration.');
        return;
      }
      logger.warn('Overwriting existing configuration file...');
    }

    // Create configuration file
    spinner.start('Creating configuration file...');
    const configPath = await createConfig();
    spinner.succeed(`Created configuration file: ${configPath}`);

    // Print next steps
    logger.newline();
    logger.section('Next Steps');
    logger.print('1. Edit velocity.config.json to add your repositories:');
    logger.print('');
    logger.print('   {');
    logger.print('     "repositories": [');
    logger.print('       "owner/repo-name",');
    logger.print('       "owner/another-repo"');
    logger.print('     ]');
    logger.print('   }');
    logger.print('');
    logger.print('2. Run data extraction:');
    logger.print('');
    logger.print('   velocity extract');
    logger.print('');
    logger.print('3. Calculate metrics:');
    logger.print('');
    logger.print('   velocity metrics');
    logger.print('');
  } catch (error) {
    spinner.fail();
    if (error instanceof Error) {
      logger.error(error.message);
    } else {
      logger.error(String(error));
    }
    process.exit(1);
  }
}
