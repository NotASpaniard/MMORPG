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

// Register to multiple guilds
async function registerToMultipleGuilds(rest: REST, commands: any[], guildIds: string[], clientId: string) {
  console.log(`🏠 Registering ${commands.length} commands to ${guildIds.length} guilds...`);
  
  for (let i = 0; i < guildIds.length; i++) {
    const guildId = guildIds[i];
    console.log(`\n📋 [${i + 1}/${guildIds.length}] Registering to guild: ${guildId}`);
    
    try {
      const result = await withTimeout(
        rest.put(
          Routes.applicationGuildCommands(clientId, guildId),
          { body: commands }
        ),
        10000 // 10 second timeout
      );
      
      console.log(`✅ Successfully registered to guild ${guildId}`);
      
      // Small delay between registrations to be safe
      if (i < guildIds.length - 1) {
        console.log(`⏳ Waiting 1 second before next guild...`);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
    } catch (error) {
      console.error(`❌ Failed to register to guild ${guildId}:`, error.message);
      // Continue with next guild instead of stopping
    }
  }
}

// Main registration
(async () => {
  const env = getEnv();
  
  // List of guild IDs to register to
  const GUILD_IDS = [
    '1033563255144185946', // Server 1
    '1406714175555899512', // Server 2
    // Add more guild IDs here
  ];
  
  // Check if any guild IDs are configured
  if (GUILD_IDS.length === 0 || GUILD_IDS.every(id => id === '1234567890123456789')) {
    console.error('❌ No valid guild IDs configured!');
    console.error('💡 Please update GUILD_IDS array in this script');
    console.error('💡 Example: const GUILD_IDS = ["guild1", "guild2", "guild3"];');
    process.exit(1);
  }
  
  const client = new Client({ intents: [] });
  (client as any).commands = new Map();
  (client as any).prefixCommands = new Map();
  await loadCommands(client);

  // Exclude 6 persistent commands that already exist on Discord (keep admin commands)
  const EXCLUDED_COMMANDS = [
    'ping', 'reset', 'status', 'turnoff',
    'help', 'guildowner'
  ];

  const slash = Array.from((client as any).commands.values())
    .filter((c: any) => !EXCLUDED_COMMANDS.includes(c.data.name))
    .map((c: any) => c.data.toJSON());
  
  console.log(`📋 Found ${slash.length} commands to register`);
  console.log(`🚫 Excluded ${EXCLUDED_COMMANDS.length} persistent commands: ${EXCLUDED_COMMANDS.join(', ')}`);
  console.log(`🏠 Target guilds: ${GUILD_IDS.join(', ')}`);
  
  const rest = new REST({ version: '10' }).setToken(env.DISCORD_TOKEN);
  
  try {
    await registerToMultipleGuilds(rest, slash, GUILD_IDS, env.DISCORD_CLIENT_ID);
    
    console.log(`\n🎉 All ${slash.length} commands registered to ${GUILD_IDS.length} guilds successfully!`);
    console.log(`⚡ Guild commands update immediately - no waiting!`);
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Registration failed:', error.message);
    process.exit(1);
  }
})();
