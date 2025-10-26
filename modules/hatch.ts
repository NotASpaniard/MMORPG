import { EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import type { PrefixCommand, SlashCommand } from '../types/command.js';
import { getStore } from '../store/store.js';
import { readFileSync } from 'node:fs';
import path from 'node:path';

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
    
    if (user.hatchery.plantedEgg.type) {
      const now = Date.now();
      const eggConfig = gameConfig.eggs[user.hatchery.plantedEgg.type];
      
      if (now < user.hatchery.plantedEgg.harvestAt!) {
        const totalTime = user.hatchery.plantedEgg.harvestAt! - user.hatchery.plantedEgg.plantedAt!;
        const elapsed = now - user.hatchery.plantedEgg.plantedAt!;
        const remaining = user.hatchery.plantedEgg.harvestAt! - now;
        const progress = Math.floor((elapsed / totalTime) * 100);
        
        // Tạo progress bar
        const filled = Math.floor(progress / 10);
        progressBar = '[' + '█'.repeat(filled) + '░'.repeat(10 - filled) + `] ${progress}%`;
        
        hatchStatus = `🥚 Đang ấp ${eggConfig.emoji} ${eggConfig.name}\n⏰ Còn ${Math.ceil(remaining / 60000)} phút\n${progressBar}`;
      } else {
        hatchStatus = `🐉 ${eggConfig.emoji} ${eggConfig.name} đã nở, có thể thu thập!`;
      }
    }
    
    // Hiển thị các loại trứng có thể ấp
    const availableEggs = Object.entries(gameConfig.eggs)
      .filter(([_, config]: [string, any]) => user.hatchery.level >= config.levelRequired)
      .map(([key, config]: [string, any]) => `${config.emoji} ${config.name} (Level ${config.levelRequired})`)
      .join('\n');
    
    const embed = new EmbedBuilder()
      .setTitle('🥚 Trại Ấp Trứng')
      .setColor('#1a237e')
      .addFields(
        { name: '🏗️ Trại Level', value: `${user.hatchery.level}`, inline: true },
        { name: '🥚 Trạng thái', value: hatchStatus, inline: false },
        { name: '🐉 Có thể ấp', value: availableEggs || 'Cần nâng cấp trại', inline: false }
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
    
    const embed = new EmbedBuilder()
      .setTitle('🥚 Đặt Trứng Ấp')
      .setColor('#4fc3f7')
      .setDescription(result.message)
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
    
    const embed = new EmbedBuilder()
      .setTitle('🐉 Thu Thập Thần Thú')
      .setColor('#ff6f00')
      .setDescription(`${result.message}\n${xpResult.message}`)
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
