import { EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import type { PrefixCommand, SlashCommand } from '../types/command.js';
import { getStore } from '../store/store.js';
import { readFileSync } from 'node:fs';
import path from 'node:path';

// v dungeon - Xem trạng thái các ải

// /dungeon - Slash command handler
export const slashDungeon: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('dungeon')
    .setDescription('Xem trạng thái các ải'),
  async execute(interaction) {
    const store = getStore();
    const user = store.getUser(interaction.user.id);
    const gameConfig = JSON.parse(readFileSync(path.join(process.cwd(), 'data/game_config.json'), 'utf8'));
    
    const embed = new EmbedBuilder()
      .setTitle('🏯 Tam Giới Ải Đấu')
      .setColor('#1a237e')
      .setDescription('Chọn một trong ba cõi để chinh phục:')
      .addFields(
        {
          name: '🌿 Nhân Giới (Normal)',
          value: `Cooldown: 5 phút\nYêu cầu: Không\nĐộ khó: Thấp (70%)\nPhần thưởng: Trứng thấp, Linh hồn thấp, V 50-150`,
          inline: true
        },
        {
          name: '⚡ Thiên Giới (Challenge)',
          value: `Cooldown: 15 phút\nYêu cầu: 1 Bùa Hộ Mệnh\nĐộ khó: Trung bình (50%)\nPhần thưởng: Trứng trung, Linh hồn trung, V 200-500`,
          inline: true
        },
        {
          name: '🔥 Ma Giới (Insane)',
          value: `Cooldown: 30 phút\nYêu cầu: 1 Linh Đan Cấp Cao + Level 5+\nĐộ khó: Cao (30%)\nPhần thưởng: Trứng cao, Linh hồn cao, V 500-1500`,
          inline: true
        }
      )
      .setFooter({ text: 'Sử dụng: /dungeon-enter <nhan|thien|ma>' })
      .setTimestamp();
    
    await interaction.reply({ embeds: [embed] });
  }
};

// All prefix commands removed - only slash commands are supported now

// /dungeon-enter - Slash command handler
export const slashDungeonEnter: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('dungeon-enter')
    .setDescription('Vào ải đấu')
    .addStringOption(option =>
      option.setName('tier')
        .setDescription('Cõi muốn vào')
        .setRequired(true)
        .addChoices(
          { name: 'Nhân Giới', value: 'nhan' },
          { name: 'Thiên Giới', value: 'thien' },
          { name: 'Ma Giới', value: 'ma' }
        )),
  async execute(interaction) {
    const tier = interaction.options.getString('tier', true);
    const store = getStore();
    const user = store.getUser(interaction.user.id);
    const gameConfig = JSON.parse(readFileSync(path.join(process.cwd(), 'data/game_config.json'), 'utf8'));
    
    // Kiểm tra cooldown
    const cooldownKey = `dungeon_${tier}`;
    const cooldownCheck = store.checkCooldown(interaction.user.id, cooldownKey as any);
    
    if (!cooldownCheck.canUse) {
      await interaction.reply({ content: `⏰ Bạn cần chờ ${cooldownCheck.remainingMinutes} phút nữa mới có thể vào ${tier} giới.`, ephemeral: true });
      return;
    }
    
    // Lấy config cho tier
    const tierConfig = gameConfig.dungeon_tiers[`${tier}_gioi`];
    if (!tierConfig) {
      await interaction.reply({ content: 'Cõi không hợp lệ.', ephemeral: true });
      return;
    }
    
    // Kiểm tra yêu cầu
    if (tierConfig.requirements.includes('bua_ho_menh')) {
      if (!store.getItemQuantity(interaction.user.id, 'dungeonGear', 'bua_ho_menh')) {
        await interaction.reply({ content: 'Cần 1 Bùa Hộ Mệnh để vào Thiên Giới. Hãy craft từ 5 Linh Hồn Thấp.', ephemeral: true });
        return;
      }
    }
    
    if (tierConfig.requirements.includes('linh_dan_cao_cap')) {
      if (!store.getItemQuantity(interaction.user.id, 'dungeonGear', 'linh_dan_cao_cap')) {
        await interaction.reply({ content: 'Cần 1 Linh Đan Cấp Cao để vào Ma Giới. Hãy craft từ 10 Linh Hồn Cao.', ephemeral: true });
        return;
      }
    }
    
    if (tierConfig.requirements.includes('level_5')) {
      if (user.level < 5) {
        await interaction.reply({ content: 'Cần Level 5+ để vào Ma Giới.', ephemeral: true });
        return;
      }
    }
    
    // Thực hiện vào ải
    const result = store.enterDungeon(interaction.user.id, tier);
    
    if (!result.success) {
      await interaction.reply({ content: result.message, ephemeral: true });
      return;
    }
    
    // Set cooldown
    store.setCooldown(interaction.user.id, cooldownKey as any, tierConfig.cooldown);
    
    // Cộng XP
    const xpResult = store.addXP(interaction.user.id, 20);
    store.save();
    
    const embed = new EmbedBuilder()
      .setTitle(`${tierConfig.emoji} ${tierConfig.name}`)
      .setColor(tier === 'nhan' ? '#4fc3f7' : tier === 'thien' ? '#ff6f00' : '#1a237e')
      .setDescription(result.message)
      .addFields(
        { name: '💰 Phần thưởng', value: result.rewards || 'Không có', inline: true },
        { name: '⏰ Cooldown', value: `${tierConfig.cooldown} phút`, inline: true },
        { name: '📈 XP', value: xpResult.message, inline: true }
      )
      .setTimestamp();
    
    await interaction.reply({ embeds: [embed] });
  }
};

// /dungeon-stats - Slash command handler
export const slashDungeonStats: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('dungeon-stats')
    .setDescription('Thống kê cá nhân về ải đấu'),
  async execute(interaction) {
    const store = getStore();
    const user = store.getUser(interaction.user.id);
    
    const embed = new EmbedBuilder()
      .setTitle('📊 Thống Kê Ải Đấu')
      .setColor('#1a237e')
      .addFields(
        { name: '🏆 Tổng lần chinh phục', value: `${user.dungeonStats?.totalClears || 0}`, inline: true },
        { name: '✅ Tỷ lệ thành công', value: `${user.dungeonStats?.successRate || 0}%`, inline: true },
        { name: '💰 Tổng V kiếm được', value: `${user.dungeonStats?.totalEarned || 0} V`, inline: true },
        { name: '🐉 Trứng thu thập', value: `${user.dungeonStats?.eggsCollected || 0}`, inline: true },
        { name: '👻 Linh hồn thu thập', value: `${user.dungeonStats?.soulsCollected || 0}`, inline: true },
        { name: '💎 Ngọc linh thu thập', value: `${user.dungeonStats?.ngocLinhCollected || 0}`, inline: true }
      )
      .setTimestamp();
    
    await interaction.reply({ embeds: [embed] });
  }
};

// /dungeon-leaderboard - Slash command handler
export const slashDungeonLeaderboard: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('dungeon-leaderboard')
    .setDescription('Bảng xếp hạng chinh phục ải'),
  async execute(interaction) {
    const store = getStore();
    const users = Object.values((store as any).db.users) as any[];
    
    const leaderboard = users
      .filter(u => u.dungeonStats?.totalClears > 0)
      .sort((a, b) => (b.dungeonStats?.totalClears || 0) - (a.dungeonStats?.totalClears || 0))
      .slice(0, 10);
    
    const lines = leaderboard.map((u, i) => 
      `${i + 1}. <@${u.userId}> - ${u.dungeonStats?.totalClears || 0} lần chinh phục`
    );
    
    const embed = new EmbedBuilder()
      .setTitle('🏆 Bảng Xếp Hạng Ải Đấu')
      .setColor('#ff6f00')
      .setDescription(lines.join('\n') || 'Chưa có ai chinh phục ải nào.')
      .setTimestamp();
    
    await interaction.reply({ embeds: [embed] });
  }
};

export const slashes: SlashCommand[] = [slashDungeon, slashDungeonEnter, slashDungeonStats, slashDungeonLeaderboard];
