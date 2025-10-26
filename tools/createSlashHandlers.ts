import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

// List of modules that need slash handlers
const modules = [
  'economy.ts',
  'hunt.ts', 
  'hatch.ts',
  'dungeon.ts',
  'shop.ts',
  'entertainment.ts',
  'giveaway.ts',
  'flash.ts'
];

// Commands that need slash handlers for each module
const moduleCommands = {
  'economy.ts': ['work', 'daily', 'weekly', 'cash', 'profile', 'give', 'bet', 'inventory', 'leaderboard'],
  'hunt.ts': ['hunt'],
  'hatch.ts': ['hatch'],
  'dungeon.ts': ['dungeon'],
  'shop.ts': ['shop', 'buy', 'sell'],
  'entertainment.ts': ['blackjack', 'baucua', 'xocdia'],
  'giveaway.ts': ['giveaway'],
  'flash.ts': ['flash']
};

for (const module of modules) {
  const modulePath = path.join(process.cwd(), 'modules', module);
  let content = readFileSync(modulePath, 'utf8');
  
  // Add slash command imports if not present
  if (!content.includes('SlashCommandBuilder')) {
    content = content.replace(
      "import { EmbedBuilder } from 'discord.js';",
      "import { EmbedBuilder, SlashCommandBuilder } from 'discord.js';"
    );
    content = content.replace(
      "import type { PrefixCommand } from '../types/command.js';",
      "import type { PrefixCommand, SlashCommand } from '../types/command.js';"
    );
  }
  
  // Add slash handlers for each command
  const commands = moduleCommands[module as keyof typeof moduleCommands];
  for (const command of commands) {
    const slashHandler = `
// /${command} - Slash command handler
export const slash${command.charAt(0).toUpperCase() + command.slice(1)}: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('${command}')
    .setDescription('${command} command'),
  async execute(interaction) {
    // TODO: Implement slash command logic
    await interaction.reply({ content: 'Slash command ${command} - Coming soon!', ephemeral: true });
  }
};
`;
    
    // Add slash handler before the first prefix command
    const firstPrefixIndex = content.indexOf('export const prefix');
    if (firstPrefixIndex !== -1) {
      content = content.slice(0, firstPrefixIndex) + slashHandler + '\n' + content.slice(firstPrefixIndex);
    }
  }
  
  writeFileSync(modulePath, content);
  console.log(`✅ Added slash handlers to ${module}`);
}

console.log('🎉 All slash handlers created!');
