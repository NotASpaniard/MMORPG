import { REST, Routes } from 'discord.js';
import { getEnv } from '../lib/env.js';
import { readdirSync } from 'fs';
import path from 'path';

async function register() {
  const env = getEnv();
  const rest = new REST().setToken(env.DISCORD_TOKEN);
  const commands: any[] = [];
  
  const modulesDir = path.join(process.cwd(), 'dist', 'modules');
  for (const file of readdirSync(modulesDir)) {
    if (!file.endsWith('.js')) continue;
    const imported = await import(path.join(modulesDir, file));
    
    if (imported.slash?.data) {
      commands.push(imported.slash.data.toJSON());
    }
    if (Array.isArray(imported.slashes)) {
      for (const cmd of imported.slashes) {
        commands.push(cmd.data.toJSON());
      }
    }
  }
  
  await rest.put(
    Routes.applicationCommands(env.DISCORD_CLIENT_ID),
    { body: commands }
  );
  
  console.log(`Registered ${commands.length} commands`);
}

register().catch(console.error);
