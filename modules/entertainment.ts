import { EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import type { PrefixCommand, SlashCommand } from '../types/command.js';
import { getStore } from '../store/store.js';

// ====== BLACKJACK GAME ======

// /blackjack - Slash command handler
export const slashBlackjack: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('blackjack')
    .setDescription('Chơi Blackjack: x2, Blackjack x2.5')
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
      
      // Deal cards
      const playerCards = [Math.floor(Math.random() * 13) + 1, Math.floor(Math.random() * 13) + 1];
      const dealerCards = [Math.floor(Math.random() * 13) + 1, Math.floor(Math.random() * 13) + 1];
      
      const playerValue = playerCards.reduce((sum, card) => sum + Math.min(card, 10), 0);
      const dealerValue = dealerCards.reduce((sum, card) => sum + Math.min(card, 10), 0);
      
      let result = '';
      let multiplier = 0;
      
      if (playerValue === 21 && playerCards.length === 2) {
        // Blackjack
        result = 'Blackjack!';
        multiplier = 2.5;
      } else if (playerValue === 21) {
        // 21
        result = '21!';
        multiplier = 2;
      } else if (playerValue > 21) {
        // Bust
        result = 'Bust!';
        multiplier = 0;
      } else if (dealerValue > 21 || playerValue > dealerValue) {
        // Win
        result = 'Win!';
        multiplier = 2;
      } else if (playerValue < dealerValue) {
        // Lose
        result = 'Lose!';
        multiplier = 0;
      } else {
        // Tie
        result = 'Tie!';
        multiplier = 1;
      }
      
      const winnings = Math.floor(amount * multiplier);
      const profit = winnings - amount;
      
      user.balance += profit;
      store.save();
      
      const embed = new EmbedBuilder()
        .setTitle('🃏 Blackjack')
        .setColor(profit > 0 ? '#4fc3f7' : '#f44336')
        .addFields(
          { name: 'Kết quả', value: result, inline: true },
          { name: 'Cược', value: `${amount} V`, inline: true },
          { name: 'Thắng', value: `${winnings} V`, inline: true },
          { name: 'Lãi/Lỗ', value: `${profit >= 0 ? '+' : ''}${profit} V`, inline: true },
          { name: 'Số dư', value: `${user.balance} V`, inline: true }
        )
        .setTimestamp();
      
      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Error in slashBlackjack:', error);
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({ content: 'Có lỗi xảy ra khi chơi Blackjack.', ephemeral: true });
      }
    }
  }
};


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
