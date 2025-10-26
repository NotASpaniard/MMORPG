import 'dotenv/config';
import { REST, Routes } from 'discord.js';
import { loadCommands } from '../lib/loader.js';
import { getEnv } from '../lib/env.js';
import { Client } from 'discord.js';

// Timeout wrapper
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => 
      setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms)
    )
  ]);
}

// Register to guild (fast, no rate limit)
async function registerToGuild(rest: REST, commands: any[], guildId: string, clientId: string) {
  console.log(`🏠 Registering ${commands.length} commands to guild ${guildId}...`);
  console.log(`⚡ Guild registration is fast and has no rate limits!`);
  
  try {
    const result = await withTimeout(
      rest.put(
        Routes.applicationGuildCommands(clientId, guildId),
        { body: commands }
      ),
      10000 // 10 second timeout
    );
    
    console.log(`✅ Successfully registered ${commands.length} commands to guild!`);
    console.log(`📊 Result:`, result);
    return result;
    
  } catch (error) {
    console.error('❌ Guild registration failed:', error.message);
    throw error;
  }
}

// Main registration
(async () => {
  const env = getEnv();
  
  // Check if guild ID is configured
  if (!env.DISCORD_GUILD_ID) {
    console.error('❌ DISCORD_GUILD_ID is not configured!');
    console.error('💡 Please set DISCORD_GUILD_ID in your .env file');
    console.error('💡 Example: DISCORD_GUILD_ID=123456789012345678');
    process.exit(1);
  }
  
  const client = new Client({ intents: [] });
  (client as any).commands = new Map();
  (client as any).prefixCommands = new Map();
  await loadCommands(client);

  // Exclude 9 persistent commands that already exist on Discord
  const EXCLUDED_COMMANDS = [
    'add', 'remove', 'resetmoney', 
    'ping', 'reset', 'status', 'turnoff',
    'help', 'guildowner'
  ];

  const slash = Array.from((client as any).commands.values())
    .filter((c: any) => !EXCLUDED_COMMANDS.includes(c.data.name))
    .map((c: any) => c.data.toJSON());
  
  console.log(`📋 Found ${slash.length} commands to register`);
  console.log(`🚫 Excluded ${EXCLUDED_COMMANDS.length} persistent commands: ${EXCLUDED_COMMANDS.join(', ')}`);
  console.log(`🏠 Target guild: ${env.DISCORD_GUILD_ID}`);
  
  const rest = new REST({ version: '10' }).setToken(env.DISCORD_TOKEN);
  
  try {
    await registerToGuild(rest, slash, env.DISCORD_GUILD_ID, env.DISCORD_CLIENT_ID);
    
    console.log(`🎉 All ${slash.length} commands registered to guild successfully!`);
    console.log(`⚡ Guild commands update immediately - no waiting!`);
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Registration failed:', error.message);
    process.exit(1);
  }
})();
