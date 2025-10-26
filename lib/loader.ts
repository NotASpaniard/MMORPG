import { Client, SlashCommandBuilder } from 'discord.js';
import { readdirSync } from 'node:fs';
import path from 'node:path';

export async function loadCommands(client: Client): Promise<void> {
  const commandsDir = path.join(process.cwd(), 'dist', 'modules');
  
  // Create completely new Map to avoid any contamination
  const slashCommands = new Map();
  
  // Clear any existing commands first
  (client as any).commands?.clear();
  
  for (const file of readdirSync(commandsDir)) {
    if (!file.endsWith('.js')) continue;
    
    const filePath = 'file://' + path.join(commandsDir, file).replace(/\\/g, '/');
    const imported = await import(filePath);
    
    // Load ONLY from slashes array
    if (Array.isArray(imported.slashes)) {
      for (const cmd of imported.slashes) {
        const data = cmd.data as SlashCommandBuilder;
        if (!slashCommands.has(data.name)) {
          slashCommands.set(data.name, cmd);
          console.log(`Loaded slash: ${data.name}`);
        }
      }
    }
    
    // Load individual slash exports (skip prefix individual exports to prevent duplicates)
    for (const [key, value] of Object.entries(imported)) {
      if (key.startsWith('slash') && 
          key !== 'slash' && 
          key !== 'slashes' &&
          typeof value === 'object' && 
          value !== null && 
          'data' in value) {
        const data = (value as any).data as SlashCommandBuilder;
        if (!slashCommands.has(data.name)) {
          slashCommands.set(data.name, value);
          console.log(`Loaded slash: ${data.name} from ${key}`);
        }
      }
    }
  }
  
  (client as any).commands = slashCommands;
  
  console.log(`Loaded ${slashCommands.size} slash commands.`);
  
  // Debug: List all loaded commands
  console.log('Slash commands:', Array.from(slashCommands.keys()));
}



