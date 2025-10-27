import 'dotenv/config';
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, Client, Collection, GatewayIntentBits, Partials, EmbedBuilder } from 'discord.js';
import { loadCommands } from './lib/loader.js';
import { getEnv } from './lib/env.js';
import { getStore } from './store/store.js';
import { existsSync, writeFileSync, unlinkSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { finishBlackjackGame, blackjackGames } from './modules/entertainment.js';

// Helper functions for Blackjack (copied from entertainment.ts)
function calculateHandValue(cards: number[]): number {
  let value = 0;
  let aces = 0;
  
  for (const card of cards) {
    if (card === 1) {
      aces++;
      value += 11;
    } else {
      value += Math.min(card, 10);
    }
  }
  
  // Adjust for aces
  while (value > 21 && aces > 0) {
    value -= 10;
    aces--;
  }
  
  return value;
}

function createBlackjackEmbed(gameId: string, showDealerCard: boolean = false): EmbedBuilder {
  const game = blackjackGames.get(gameId);
  if (!game) throw new Error('Game not found');
  
  const cardSymbols: { [key: number]: string } = {
    1: 'A', 2: '2', 3: '3', 4: '4', 5: '5', 6: '6', 7: '7', 8: '8', 9: '9', 10: '10',
    11: 'J', 12: 'Q', 13: 'K'
  };
  const suitSymbols = ['♠️', '♥️', '♦️', '♣️'];
  
  function getCardSymbol(card: number): string {
    const suit = suitSymbols[Math.floor(Math.random() * 4)];
    return `${cardSymbols[card]}${suit}`;
  }
  
  const playerCardsText = game.playerCards.map(getCardSymbol).join(' ');
  const dealerCardsText = showDealerCard 
    ? game.dealerCards.map(getCardSymbol).join(' ')
    : `${getCardSymbol(game.dealerCards[0])} ❓`;
  
  const embed = new EmbedBuilder()
    .setTitle('🃏 Blackjack')
    .setColor('#1a237e')
    .addFields(
      { name: '👤 Bạn', value: `${playerCardsText}\n**Tổng:** ${game.playerValue}`, inline: true },
      { name: '🏦 Dealer', value: `${dealerCardsText}\n**Tổng:** ${showDealerCard ? game.dealerValue : '?'}`, inline: true },
      { name: '💰 Cược', value: `${game.betAmount} V`, inline: true }
    );
  
  if (game.gameState === 'playing') {
    embed.setDescription('Chọn hành động của bạn:');
  } else if (game.gameState === 'bust') {
    embed.setDescription('💀 **BUST!** Bạn đã vượt quá 21!');
    embed.setColor('#f44336');
  } else if (game.gameState === 'stand') {
    embed.setDescription('⏳ Đang chờ dealer...');
  } else if (game.gameState === 'finished') {
    embed.setDescription('🎮 Ván chơi kết thúc!');
  }
  
  return embed;
}

function createBlackjackButtons(gameId: string, gameState: string): ActionRowBuilder<ButtonBuilder> {
  const row = new ActionRowBuilder<ButtonBuilder>();
  
  if (gameState === 'playing') {
    row.addComponents(
      new ButtonBuilder()
        .setCustomId(`bj_hit:${gameId}`)
        .setLabel('🎴 Hit')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId(`bj_stand:${gameId}`)
        .setLabel('✋ Stand')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId(`bj_double:${gameId}`)
        .setLabel('💰 Double Down')
        .setStyle(ButtonStyle.Success)
    );
  }
  
  return row;
}

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
      
      // Blackjack buttons
      if (action === 'bj_hit' || action === 'bj_stand' || action === 'bj_double') {
        const gameId = `${userId}_${interaction.customId.split('_')[1]}`;
        const game = blackjackGames.get(gameId);
        
        if (!game || game.userId !== interaction.user.id) {
          await interaction.reply({ content: 'Game không tồn tại hoặc không phải của bạn.', ephemeral: true });
          return;
        }
        
        if (game.gameState !== 'playing') {
          await interaction.reply({ content: 'Game đã kết thúc.', ephemeral: true });
          return;
        }
        
        if (action === 'bj_hit') {
          // Hit: thêm 1 lá bài
          const newCard = Math.floor(Math.random() * 13) + 1;
          game.playerCards.push(newCard);
          game.playerValue = calculateHandValue(game.playerCards);
          
          if (game.playerValue > 21) {
            game.gameState = 'bust';
            await finishBlackjackGame(gameId, interaction);
            return;
          }
          
          // Update embed
          const embed = createBlackjackEmbed(gameId);
          const buttons = createBlackjackButtons(gameId, 'playing');
          await interaction.update({ embeds: [embed], components: [buttons] });
          
        } else if (action === 'bj_stand') {
          // Stand: kết thúc turn của player
          game.gameState = 'stand';
          await finishBlackjackGame(gameId, interaction);
          return;
          
        } else if (action === 'bj_double') {
          // Double Down: tăng gấp đôi cược và chỉ được rút 1 lá
          const user = store.getUser(interaction.user.id);
          if (user.balance < game.betAmount) {
            await interaction.reply({ content: 'Không đủ V để double down.', ephemeral: true });
            return;
          }
          
          user.balance -= game.betAmount;
          game.betAmount *= 2;
          store.save();
          
          // Rút 1 lá bài cuối cùng
          const newCard = Math.floor(Math.random() * 13) + 1;
          game.playerCards.push(newCard);
          game.playerValue = calculateHandValue(game.playerCards);
          
          game.gameState = 'stand';
          await finishBlackjackGame(gameId, interaction);
          return;
        }
        return;
      }
      
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


