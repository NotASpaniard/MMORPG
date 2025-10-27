import { EmbedBuilder, SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import type { PrefixCommand, SlashCommand } from '../types/command.js';
import { getStore } from '../store/store.js';

// Blackjack game state management
const blackjackGames = new Map<string, {
  userId: string;
  playerCards: number[];
  dealerCards: number[];
  playerValue: number;
  dealerValue: number;
  gameState: 'playing' | 'stand' | 'bust' | 'finished';
  betAmount: number;
  startTime: number;
}>();

// Card symbols mapping
const cardSymbols: { [key: number]: string } = {
  1: 'A', 2: '2', 3: '3', 4: '4', 5: '5', 6: '6', 7: '7', 8: '8', 9: '9', 10: '10',
  11: 'J', 12: 'Q', 13: 'K'
};

const suitSymbols = ['♠️', '♥️', '♦️', '♣️'];

// Helper functions
function getCardSymbol(card: number): string {
  const value = card > 10 ? 10 : card === 1 ? 11 : card;
  const suit = suitSymbols[Math.floor(Math.random() * 4)];
  return `${cardSymbols[card]}${suit}`;
}

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

// ====== BLACKJACK GAME ======

// /blackjack - Slash command handler
export const slashBlackjack: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('blackjack')
    .setDescription('Chơi Blackjack tương tác: Hit/Stand/Double Down')
    .addIntegerOption(option =>
      option.setName('amount')
        .setDescription('Số V muốn cược')
        .setRequired(true)
        .setMinValue(1)),
  async execute(interaction) {
    try {
      const amount = interaction.options.getInteger('amount', true);
      const store = getStore();
      const user = store.getUser(interaction.user.id);
      
      if (user.balance < amount) {
        await interaction.reply({ content: 'Không đủ V để chơi.', ephemeral: true });
        return;
      }
      
      // Trừ tiền cược trước
      user.balance -= amount;
      store.save();
      
      // Tạo game ID unique
      const gameId = `${interaction.user.id}_${Date.now()}`;
      
      // Deal initial cards
      const playerCards = [Math.floor(Math.random() * 13) + 1, Math.floor(Math.random() * 13) + 1];
      const dealerCards = [Math.floor(Math.random() * 13) + 1, Math.floor(Math.random() * 13) + 1];
      
      const playerValue = calculateHandValue(playerCards);
      const dealerValue = calculateHandValue(dealerCards);
      
      // Lưu game state
      blackjackGames.set(gameId, {
        userId: interaction.user.id,
        playerCards,
        dealerCards,
        playerValue,
        dealerValue,
        gameState: 'playing',
        betAmount: amount,
        startTime: Date.now()
      });
      
      // Tạo embed và buttons
      const embed = createBlackjackEmbed(gameId);
      const buttons = createBlackjackButtons(gameId, 'playing');
      
      await interaction.reply({ embeds: [embed], components: [buttons] });
      
      // Set timeout để auto-stand sau 30 giây
      setTimeout(() => {
        const game = blackjackGames.get(gameId);
        if (game && game.gameState === 'playing') {
          // Auto stand
          finishBlackjackGame(gameId, interaction);
        }
      }, 30000);
      
    } catch (error) {
      console.error('Error in slashBlackjack:', error);
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({ content: 'Có lỗi xảy ra khi chơi Blackjack.', ephemeral: true });
      }
    }
  }
};

// Helper function để kết thúc game
async function finishBlackjackGame(gameId: string, interaction: any) {
  const game = blackjackGames.get(gameId);
  if (!game) return;
  
  // Dealer plays
  while (game.dealerValue < 17) {
    const newCard = Math.floor(Math.random() * 13) + 1;
    game.dealerCards.push(newCard);
    game.dealerValue = calculateHandValue(game.dealerCards);
  }
  
  // Determine winner
  let result = '';
  let multiplier = 0;
  
  if (game.playerValue > 21) {
    result = '💀 BUST!';
    multiplier = 0;
  } else if (game.dealerValue > 21) {
    result = '🎉 Dealer Bust!';
    multiplier = 2;
  } else if (game.playerValue === 21 && game.playerCards.length === 2) {
    result = '🃏 BLACKJACK!';
    multiplier = 2.5;
  } else if (game.playerValue > game.dealerValue) {
    result = '🎉 Thắng!';
    multiplier = 2;
  } else if (game.playerValue < game.dealerValue) {
    result = '💀 Thua!';
    multiplier = 0;
  } else {
    result = '🤝 Hòa!';
    multiplier = 1;
  }
  
  const winnings = Math.floor(game.betAmount * multiplier);
  const profit = winnings - game.betAmount;
  
  // Cập nhật balance
  const store = getStore();
  const user = store.getUser(game.userId);
  user.balance += winnings;
  store.save();
  
  // Update game state
  game.gameState = 'finished';
  
  // Tạo final embed
  const embed = createBlackjackEmbed(gameId, true);
  embed.setDescription(`**${result}**\n💰 Thắng: ${winnings} V | Lãi/Lỗ: ${profit >= 0 ? '+' : ''}${profit} V`);
  embed.setColor(profit > 0 ? '#4fc3f7' : profit < 0 ? '#f44336' : '#FFA500');
  
  // Update message
  try {
    await interaction.editReply({ embeds: [embed], components: [] });
  } catch (error) {
    console.error('Error updating blackjack game:', error);
  }
  
  // Clean up
  blackjackGames.delete(gameId);
}

// Export functions for button handlers
export { finishBlackjackGame, blackjackGames };


// /baucua - Slash command handler
export const slashBaucua: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('baucua')
    .setDescription('Chơi Bầu Cua')
    .addStringOption(option =>
      option.setName('choice')
        .setDescription('Lựa chọn')
        .setRequired(true)
        .addChoices(
          { name: 'Bầu', value: 'bầu' },
          { name: 'Cua', value: 'cua' },
          { name: 'Tôm', value: 'tôm' },
          { name: 'Cá', value: 'cá' },
          { name: 'Gà', value: 'gà' },
          { name: 'Nai', value: 'nai' }
        ))
    .addIntegerOption(option =>
      option.setName('amount')
        .setDescription('Số V muốn cược')
        .setRequired(true)
        .setMinValue(1)),
  async execute(interaction) {
    try {
      const choice = interaction.options.getString('choice', true);
      const amount = interaction.options.getInteger('amount', true);
      const store = getStore();
      const user = store.getUser(interaction.user.id);
      
      if (user.balance < amount) {
        await interaction.reply({ content: 'Không đủ V để chơi.', ephemeral: true });
        return;
      }
      
      // Roll dice
      const dice = ['bầu', 'cua', 'tôm', 'cá', 'gà', 'nai'];
      const results = [
        dice[Math.floor(Math.random() * 6)],
        dice[Math.floor(Math.random() * 6)],
        dice[Math.floor(Math.random() * 6)]
      ];
      
      const wins = results.filter(result => result === choice).length;
      const multiplier = wins;
      const winnings = amount * multiplier;
      const profit = winnings - amount;
      
      user.balance += profit;
      store.save();
      
      const embed = new EmbedBuilder()
        .setTitle('🎲 Bầu Cua')
        .setColor(profit > 0 ? '#4fc3f7' : '#f44336')
        .addFields(
          { name: 'Kết quả', value: results.join(' | '), inline: true },
          { name: 'Lựa chọn', value: choice, inline: true },
          { name: 'Thắng', value: `${wins} lần`, inline: true },
          { name: 'Cược', value: `${amount} V`, inline: true },
          { name: 'Thắng', value: `${winnings} V`, inline: true },
          { name: 'Lãi/Lỗ', value: `${profit >= 0 ? '+' : ''}${profit} V`, inline: true },
          { name: 'Số dư', value: `${user.balance} V`, inline: false }
        )
        .setTimestamp();
      
      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Error in slashBaucua:', error);
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({ content: 'Có lỗi xảy ra khi chơi Bầu Cua.', ephemeral: true });
      }
    }
  }
};


// /xocdia - Slash command handler
export const slashXocdia: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('xocdia')
    .setDescription('Chơi Xóc Đĩa (x1.95)')
    .addStringOption(option =>
      option.setName('choice')
        .setDescription('Lựa chọn')
        .setRequired(true)
        .addChoices(
          { name: 'Chẵn', value: 'chẵn' },
          { name: 'Lẻ', value: 'lẻ' }
        ))
    .addIntegerOption(option =>
      option.setName('amount')
        .setDescription('Số V muốn cược')
        .setRequired(true)
        .setMinValue(1)),
  async execute(interaction) {
    try {
      const choice = interaction.options.getString('choice', true);
      const amount = interaction.options.getInteger('amount', true);
      const store = getStore();
      const user = store.getUser(interaction.user.id);
      
      if (user.balance < amount) {
        await interaction.reply({ content: 'Không đủ V để chơi.', ephemeral: true });
        return;
      }
      
      // Roll dice
      const dice1 = Math.floor(Math.random() * 6) + 1;
      const dice2 = Math.floor(Math.random() * 6) + 1;
      const total = dice1 + dice2;
      const isEven = total % 2 === 0;
      const result = isEven ? 'chẵn' : 'lẻ';
      
      const isWin = choice === result;
      const multiplier = isWin ? 1.95 : 0;
      const winnings = Math.floor(amount * multiplier);
      const profit = winnings - amount;
      
      user.balance += profit;
      store.save();
      
      const embed = new EmbedBuilder()
        .setTitle('🎲 Xóc Đĩa')
        .setColor(profit > 0 ? '#4fc3f7' : '#f44336')
        .addFields(
          { name: 'Kết quả', value: `${dice1} + ${dice2} = ${total} (${result})`, inline: true },
          { name: 'Lựa chọn', value: choice, inline: true },
          { name: 'Kết quả', value: isWin ? 'Thắng!' : 'Thua!', inline: true },
          { name: 'Cược', value: `${amount} V`, inline: true },
          { name: 'Thắng', value: `${winnings} V`, inline: true },
          { name: 'Lãi/Lỗ', value: `${profit >= 0 ? '+' : ''}${profit} V`, inline: true },
          { name: 'Số dư', value: `${user.balance} V`, inline: false }
        )
        .setTimestamp();
      
      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Error in slashXocdia:', error);
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({ content: 'Có lỗi xảy ra khi chơi Xóc Đĩa.', ephemeral: true });
      }
    }
  }
};

// All prefix commands removed - only slash commands are supported now

export const slashes: SlashCommand[] = [slashBlackjack, slashBaucua, slashXocdia];
