import { REST, Routes } from 'discord.js';
import { getEnv } from '../lib/env.js';
import { loadCommands } from '../lib/loader.js';
import { Client } from 'discord.js';

async function registerSlashCommands() {
  const env = getEnv();
  const rest = new REST().setToken(env.DISCORD_TOKEN);
  
  // Load all commands
  const client = new Client({ intents: [] });
  await loadCommands(client);
  
  const commands = Array.from((client as any).commands.values()).map(cmd => cmd.data.toJSON());
  
  console.log(`Đang đăng ký ${commands.length} slash commands...`);
  
  try {
    // Register commands globally (có thể mất vài phút để hiển thị)
    const data = await rest.put(
      Routes.applicationCommands(env.DISCORD_CLIENT_ID),
      { body: commands }
    );
    
    console.log(`✅ Đã đăng ký ${(data as any).length} slash commands thành công!`);
    console.log('📝 Lưu ý: Commands có thể mất vài phút để hiển thị trên Discord');
    
  } catch (error) {
    console.error('❌ Lỗi khi đăng ký commands:', error);
  }
}

registerSlashCommands().catch(console.error);
