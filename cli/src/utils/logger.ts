import chalk from 'chalk';

let verboseMode = false;

export function setVerbose(enabled: boolean): void {
  verboseMode = enabled;
}

export function isVerbose(): boolean {
  return verboseMode;
}

export const logger = {
  info(message: string): void {
    console.log(chalk.blue('ℹ'), message);
  },

  success(message: string): void {
    console.log(chalk.green('✓'), message);
  },

  warn(message: string): void {
    console.log(chalk.yellow('⚠'), message);
  },

  error(message: string): void {
    console.error(chalk.red('✗'), message);
  },

  debug(message: string): void {
    if (verboseMode) {
      console.log(chalk.gray('⋯'), chalk.gray(message));
    }
  },

  verbose(message: string): void {
    if (verboseMode) {
      console.log(chalk.dim(message));
    }
  },

  // Print without any prefix
  print(message: string): void {
    console.log(message);
  },

  // Print a blank line
  newline(): void {
    console.log();
  },

  // Print a section header
  section(title: string): void {
    console.log();
    console.log(chalk.bold.underline(title));
    console.log();
  },

  // Print a key-value pair
  kv(key: string, value: string | number): void {
    console.log(`  ${chalk.gray(key + ':')} ${value}`);
  },

  // Print a table row
  row(columns: string[], widths: number[]): void {
    const formatted = columns.map((col, i) => col.padEnd(widths[i] || 20)).join('  ');
    console.log(`  ${formatted}`);
  },
};
