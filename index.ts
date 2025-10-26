import 'dotenv/config';
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, Client, Collection, GatewayIntentBits, Partials } from 'discord.js';
import { loadCommands } from './lib/loader.js';
import { getEnv } from './lib/env.js';
import { getStore } from './store/store.js';
import { existsSync, writeFileSync, unlinkSync, readFileSync } from 'node:fs';
import path from 'node:path';

const LOCK_FILE = path.join(process.cwd(), '.bot.lock');

function checkSingleInstance() {
  if (existsSync(LOCK_FILE)) {
    try {
      const pid = readFileSync(LOCK_FILE, 'utf8');
      console.error(`Bot is already running (PID: ${pid}). Exiting...`);
      process.exit(1);
    } catch (error) {
      // Lock file exists but can't read - remove it
      unlinkSync(LOCK_FILE);
    }
  }
  
  // Create lock file with current PID
  writeFileSync(LOCK_FILE, process.pid.toString());
  
  // Clean up lock file on exit
  process.on('exit', () => {
    try {
      unlinkSync(LOCK_FILE);
    } catch (error) {
      // Ignore errors
    }
  });
  
  process.on('SIGINT', () => {
    console.log('\nShutting down bot...');
    process.exit(0);
  });
}

// Check for single instance before starting
checkSingleInstance();

async function main(): Promise<void> {
  const env = getEnv();

  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.GuildMembers,
      GatewayIntentBits.MessageContent
    ],
    partials: [Partials.Channel, Partials.Message]
  });

  // Mở rộng client bằng bộ sưu tập lệnh (đơn giản hóa thay vì mở rộng kiểu)
  (client as any).commands = new Collection();

  await loadCommands(client);

  client.once('ready', () => {
    console.log(`Logged in as ${client.user?.tag}`);
  });

  client.on('interactionCreate', async (interaction) => {
    // SLASH COMMANDS
    if (interaction.isChatInputCommand()) {
      const cmd = (client as any).commands.get(interaction.commandName);
      if (!cmd) return;
      
      try {
        await cmd.execute(interaction);
      } catch (error) {
        console.error(`Error in /${interaction.commandName}:`, error);
        // Only reply if interaction hasn't been handled
        try {
          if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({ 
              content: 'Đã xảy ra lỗi khi chạy lệnh.', 
              ephemeral: true 
            });
          } else if (interaction.deferred) {
            await interaction.editReply({ 
              content: 'Đã xảy ra lỗi khi chạy lệnh.' 
            });
          }
        } catch (replyError) {
          console.error('Failed to send error message:', replyError);
        }
      }
      return;
    }

    // Buttons
    if (interaction.isButton()) {
      const store = getStore();
      const [action, userId, amountStr] = interaction.customId.split(':');
      if (action === 'quest_refresh') {
        // Nút trung gian: hiển thị nút xác nhận
        if (interaction.user.id !== userId) {
          await interaction.reply({ content: 'Bạn không thể thao tác trên yêu cầu của người khác.', ephemeral: true });
          return;
        }
        const confirmRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder().setCustomId(`quest_refresh_confirm:${userId}`).setLabel('Xác Nhận Làm Mới (-2000 V)').setStyle(ButtonStyle.Danger)
        );
        await interaction.reply({ content: 'Xác nhận làm mới nhiệm vụ?', components: [confirmRow], ephemeral: true });
        return;
      }
      if (action === 'quest_refresh_confirm') {
        // Thực hiện trừ tiền và sinh nhiệm vụ mới
        if (interaction.user.id !== userId) {
          await interaction.reply({ content: 'Bạn không thể thao tác trên yêu cầu của người khác.', ephemeral: true });
          return;
        }
        const u = store.getUser(userId);
        if (u.balance < 2000) {
          await interaction.reply({ content: 'Không đủ 2000 V để làm mới.', ephemeral: true });
          return;
        }
        u.balance -= 2000;
        store.refreshDailyQuests(userId);
        store.save();
        await interaction.reply({ content: 'Đã làm mới nhiệm vụ.', ephemeral: true });
        return;
      }

      // Admin confirm buttons: admin_add/remove/reset
      if (action === 'admin_add' || action === 'admin_remove' || action === 'admin_reset') {
        // Quyền đã kiểm tra ở slash; tại đây chỉ thực thi
        const targetId = userId;
        const amount = Number(amountStr || '0');
        const user = store.getUser(targetId);
        if (action === 'admin_add') user.balance += amount;
        if (action === 'admin_remove') user.balance = Math.max(0, user.balance - amount);
        if (action === 'admin_reset') user.balance = 0;
        store.save();
        await interaction.reply({ content: 'Đã thực thi.', ephemeral: true });
        return;
      }
    }
  });

  // PREFIX COMMANDS REMOVED - Only slash commands are supported now

  await client.login(env.DISCORD_TOKEN);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});


