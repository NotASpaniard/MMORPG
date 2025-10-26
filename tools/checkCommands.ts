import 'dotenv/config';
import { REST, Routes } from 'discord.js';
import { getEnv } from '../lib/env.js';

// Check all registered commands
(async () => {
  const env = getEnv();
  const rest = new REST({ version: '10' }).setToken(env.DISCORD_TOKEN);
  
  try {
    console.log('🔍 Checking registered commands...');
    
    let commands;
    if (env.DISCORD_GUILD_ID) {
      commands = await rest.get(Routes.applicationGuildCommands(env.DISCORD_CLIENT_ID, env.DISCORD_GUILD_ID));
    } else {
      commands = await rest.get(Routes.applicationCommands(env.DISCORD_CLIENT_ID));
    }
    
    console.log(`📋 Found ${commands.length} registered commands:`);
    commands.forEach((cmd: any, index: number) => {
      console.log(`${index + 1}. /${cmd.name} - ${cmd.description}`);
    });
    
    // Check for duplicates
    const commandNames = commands.map((cmd: any) => cmd.name);
    const duplicates = commandNames.filter((name, index) => commandNames.indexOf(name) !== index);
    
    if (duplicates.length > 0) {
      console.warn('⚠️ Duplicate commands found:', [...new Set(duplicates)]);
    } else {
      console.log('✅ No duplicate commands found');
    }
    
    console.log('✅ Check complete!');
    
  } catch (error) {
    console.error('❌ Check failed:', error);
    process.exit(1);
  }
})();
