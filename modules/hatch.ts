import { EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import type { PrefixCommand, SlashCommand } from '../types/command.js';
import { getStore } from '../store/store.js';
import { readFileSync } from 'node:fs';
import path from 'node:path';

// Helper function để tạo progress bar
function createProgressBar(current: number, max: number, emoji: string): string {
  const percentage = Math.min(100, Math.max(0, Math.floor((current / max) * 100)));
  const filled = Math.floor(percentage / 10);
  const empty = 10 - filled;
  const bar = '█'.repeat(filled) + '░'.repeat(empty);
  return `${emoji} [${bar}] ${percentage}%`;
}

// Helper function để tạo visual stage indicator
function getStageIndicator(progress: number): string {
  if (progress < 20) return '🥚⏳'; // Egg + waiting
  if (progress < 50) return '🥚✨'; // Egg + sparkles
  if (progress < 80) return '🐣⏳'; // Hatching + waiting
  if (progress < 100) return '🐣✨'; // Hatching + sparkles
  return '🐉🎉'; // Dragon + celebration
}

// v hatch - Xem trạng thái trại ấp trứng

// /hatch - Slash command handler
export const slashHatch: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('hatch')
    .setDescription('Xem trạng thái trại ấp trứng'),
  async execute(interaction) {
    const store = getStore();
    const user = store.getUser(interaction.user.id);
    const gameConfig = JSON.parse(readFileSync(path.join(process.cwd(), 'data/game_config.json'), 'utf8'));
    
    // Tính thời gian còn lại cho hatch
    let hatchStatus = 'Không có trứng đang ấp';
    let progressBar = '';
    let stageIndicator = '';
    let temperature = '';
    let humidity = '';
    
    if (user.hatchery.plantedEgg.type) {
      const now = Date.now();
      const eggConfig = gameConfig.eggs[user.hatchery.plantedEgg.type];
      
      if (now < user.hatchery.plantedEgg.harvestAt!) {
        const totalTime = user.hatchery.plantedEgg.harvestAt! - user.hatchery.plantedEgg.plantedAt!;
        const elapsed = now - user.hatchery.plantedEgg.plantedAt!;
        const remaining = user.hatchery.plantedEgg.harvestAt! - now;
        const progress = Math.floor((elapsed / totalTime) * 100);
        
        // Tạo progress bar và stage indicator
        progressBar = createProgressBar(elapsed, totalTime, '⏰');
        stageIndicator = getStageIndicator(progress);
        temperature = eggConfig.temperature || '25°C';
        humidity = eggConfig.humidity || '60%';
        
        hatchStatus = `${stageIndicator} **${eggConfig.name}**\n${progressBar}\n⏰ Còn ${Math.ceil(remaining / 60000)} phút\n🌡️ Nhiệt độ: ${temperature} | 💧 Độ ẩm: ${humidity}`;
      } else {
        stageIndicator = '🐉🎉';
        hatchStatus = `${stageIndicator} **${eggConfig.name}** đã nở!\n💰 Có thể thu thập ngay!`;
      }
    }
    
    // Hiển thị các loại trứng có thể ấp với thông tin chi tiết
    const availableEggs = Object.entries(gameConfig.eggs)
      .filter(([_, config]: [string, any]) => user.hatchery.level >= config.levelRequired)
      .map(([key, config]: [string, any]) => {
        const rarity = config.rarity || 'Common';
        const rarityEmoji = rarity === 'Common' ? '⚪' : rarity === 'Uncommon' ? '🟢' : rarity === 'Rare' ? '🔵' : rarity === 'Epic' ? '🟣' : '🟡';
        return `${rarityEmoji} ${config.emoji} **${config.name}**\n   ${config.description}\n   ⏰ ${config.growTime} phút | 💰 ${config.baseReward} V | Level ${config.levelRequired}`;
      })
      .join('\n\n');
    
    const embed = new EmbedBuilder()
      .setTitle('🥚 Trại Ấp Trứng Thần Thú')
      .setColor('#1a237e')
      .setDescription('Nơi ấp nở những sinh vật huyền thoại từ thần thoại Việt Nam')
      .addFields(
        { name: '🏗️ Trại Level', value: `**${user.hatchery.level}**`, inline: true },
        { name: '📊 Trạng thái', value: hatchStatus, inline: false },
        { name: '🐉 Có thể ấp', value: availableEggs || '❌ Cần nâng cấp trại để mở khóa thêm loại trứng', inline: false }
      )
      .setTimestamp();
    
    await interaction.reply({ embeds: [embed] });
  }
};

// All prefix commands removed - only slash commands are supported now

// /hatch-place - Slash command handler
export const slashHatchPlace: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('hatch-place')
    .setDescription('Đặt trứng ấp')
    .addStringOption(option =>
      option.setName('egg_type')
        .setDescription('Loại trứng muốn ấp')
        .setRequired(true)
        .addChoices(
          { name: 'Rồng Xanh', value: 'rong_xanh' },
          { name: 'Phượng Hoàng', value: 'phuong_hoang' },
          { name: 'Kỳ Lân', value: 'ky_lan' },
          { name: 'Bạch Hổ', value: 'bach_ho' },
          { name: 'Huyền Vũ', value: 'huyen_vu' }
        )),
  async execute(interaction) {
    const eggType = interaction.options.getString('egg_type', true);
    const store = getStore();
    const result = store.plantEgg(interaction.user.id, eggType);
    
    if (!result.success) {
      await interaction.reply({ content: result.message, ephemeral: true });
      return;
    }
    
    // Lấy thông tin chi tiết về trứng
    const gameConfig = JSON.parse(readFileSync(path.join(process.cwd(), 'data/game_config.json'), 'utf8'));
    const eggConfig = gameConfig.eggs[eggType];
    
    const embed = new EmbedBuilder()
      .setTitle('🥚 Đặt Trứng Ấp')
      .setColor('#4fc3f7')
      .setDescription(`**${eggConfig.emoji} ${eggConfig.name}**\n${eggConfig.description}`)
      .addFields(
        { name: '📖 Lore', value: eggConfig.lore, inline: false },
        { name: '⏰ Thời gian ấp', value: `${eggConfig.growTime} phút`, inline: true },
        { name: '💰 Phần thưởng', value: `${eggConfig.baseReward} V`, inline: true },
        { name: '🌡️ Nhiệt độ', value: eggConfig.temperature, inline: true },
        { name: '💧 Độ ẩm', value: eggConfig.humidity, inline: true },
        { name: '⭐ Độ hiếm', value: eggConfig.rarity, inline: true }
      )
      .setTimestamp();
    
    await interaction.reply({ embeds: [embed] });
  }
};

// /hatch-collect - Slash command handler
export const slashHatchCollect: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('hatch-collect')
    .setDescription('Thu thập thần thú đã nở'),
  async execute(interaction) {
    const store = getStore();
    const result = store.hatchEgg(interaction.user.id);
    
    if (!result.success) {
      await interaction.reply({ content: result.message, ephemeral: true });
      return;
    }
    
    // Cộng XP cho collect
    const xpResult = store.addXP(interaction.user.id, 20);
    
    // Lấy thông tin chi tiết về thần thú đã nở
    const gameConfig = JSON.parse(readFileSync(path.join(process.cwd(), 'data/game_config.json'), 'utf8'));
    const currentUser = store.getUser(interaction.user.id);
    const eggConfig = gameConfig.eggs[currentUser.hatchery.plantedEgg.type!];
    
    const embed = new EmbedBuilder()
      .setTitle('🐉 Thu Thập Thần Thú Thành Công!')
      .setColor('#FFD700')
      .setDescription(`**${eggConfig.emoji} ${eggConfig.name}** đã nở thành công!`)
      .addFields(
        { name: '📖 Lore', value: eggConfig.lore, inline: false },
        { name: '💰 Phần thưởng', value: `**${result.reward} V** (+${Math.floor((result.reward / eggConfig.baseReward - 1) * 100)}% bonus)`, inline: true },
        { name: '⚖️ Trọng lượng', value: `**${result.kg} KG**`, inline: true },
        { name: '🎯 XP', value: xpResult.message, inline: true },
        { name: '⭐ Độ hiếm', value: eggConfig.rarity, inline: true }
      )
      .setTimestamp();
    
    await interaction.reply({ embeds: [embed] });
  }
};

// /hatch-upgrade - Slash command handler
export const slashHatchUpgrade: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('hatch-upgrade')
    .setDescription('Nâng cấp trại ấp trứng'),
  async execute(interaction) {
    const store = getStore();
    const result = store.upgradeHatchery(interaction.user.id);
    
    if (!result.success) {
      await interaction.reply({ content: result.message, ephemeral: true });
      return;
    }
    
    const embed = new EmbedBuilder()
      .setTitle('🏗️ Nâng Cấp Trại')
      .setColor('#ff6f00')
      .setDescription(result.message)
      .setTimestamp();
    
    await interaction.reply({ embeds: [embed] });
  }
};

export const slashes: SlashCommand[] = [slashHatch, slashHatchPlace, slashHatchCollect, slashHatchUpgrade];
