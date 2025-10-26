import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, SlashCommandBuilder, time } from 'discord.js';
import type { PrefixCommand, SlashCommand } from '../types/command.js';
import { getStore } from '../store/store.js';
import { getEnv } from '../lib/env.js';

// ===================== BASIC CMDS =====================
// Slash: /help
export const slash: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Hướng dẫn sử dụng bot VIE'),
  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setTitle('🏯 Hướng dẫn sử dụng bot VIE')
      .setDescription('Danh sách các lệnh và chức năng của bot')
      .setColor('#1a237e')
      .addFields(
        { 
          name: '💰 Lệnh Kinh Tế (Economy)', 
          value: [
            '• `/work` - Làm việc kiếm V (1 giờ)',
            '• `/daily` - Nhận thưởng hàng ngày',
            '• `/weekly` - Quà hàng tuần (7 ngày)',
            '• `/bet` - Đặt cược may rủi 50/50',
            '• `/cash` - Kiểm tra số dư tài khoản',
            '• `/profile` - Xem profile đầy đủ',
            '• `/give` - Chuyển tiền cho người khác',
            '• `/leaderboard` - Xem bảng xếp hạng giàu có',
            '• `/quest` - Xem và làm nhiệm vụ hàng ngày',
            '• `/inventory` - Xem túi đồ phân loại'
          ].join('\n'),
          inline: false
        },
        { 
          name: '🥚 Lệnh Ấp Trứng (Hatch)', 
          value: [
            '• `/hatch` - Xem trạng thái trại ấp trứng',
            '• `/hatch-place` - Đặt ấp trứng',
            '• `/hatch-collect` - Thu thập trứng đã nở',
            '• `/hatch-upgrade` - Nâng cấp trại'
          ].join('\n'),
          inline: false
        },
        { 
          name: '⚔️ Lệnh Săn Quái (Hunt)', 
          value: [
            '• `/hunt` - Săn quái thần thoại (2 phút)',
            '• `/hunt-equip` - Trang bị vũ khí',
            '• `/hunt-inventory` - Xem đồ săn quái',
            '• `/hunt-use` - Dùng bùa phép'
          ].join('\n'),
          inline: false
        },
        { 
          name: '🏯 Lệnh Đi Ải (Dungeon)', 
          value: [
            '• `/dungeon` - Xem trạng thái các ải',
            '• `/dungeon-enter` - Vào ải',
            '• `/dungeon-stats` - Thống kê cá nhân',
            '• `/dungeon-leaderboard` - BXH chinh phục ải'
          ].join('\n'),
          inline: false
        },
        { 
          name: '🛒 Lệnh Cửa Hàng (Shop)', 
          value: [
            '• `/shop` - Xem tất cả cửa hàng',
            '• `/buy` - Mua item',
            '• `/sell` - Bán item'
          ].join('\n'),
          inline: false
        },
        { 
          name: '🎮 Giải trí (Entertainment)', 
          value: [
            '• `/blackjack` - Chơi Blackjack (x2, Blackjack x2.5)',
            '• `/baucua` - Chơi Bầu Cua',
            '• `/xocdia` - Chơi Xóc Đĩa (x1.95)'
          ].join('\n'),
          inline: false
        },
        { 
          name: '⚙️ Lệnh Khác', 
          value: [
            '• `/info` - Thông tin server',
            '• `/help` - Hiển thị hướng dẫn này'
          ].join('\n'),
          inline: false
        }
      )
      .setFooter({ text: '🏯 Bot VIE - Sức mạnh biển cả!' })
      .setTimestamp();
    
    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
};

// All prefix commands removed - only slash commands are supported now
// /info - Slash command handler
export const slashInfo: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('info')
    .setDescription('Hiển thị thông tin server'),
  async execute(interaction) {
    const g = interaction.guild!;
    const embed = new EmbedBuilder()
      .setTitle(`Thông tin server: ${g.name}`)
      .setColor('#1a237e')
      .addFields(
        { name: 'ID', value: g.id, inline: true },
        { name: 'Thành viên', value: `${g.memberCount}`, inline: true }
      );
    await interaction.reply({ embeds: [embed] });
  }
};

// /quest - Slash command handler
export const slashQuest: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('quest')
    .setDescription('Xem nhiệm vụ hàng ngày'),
  async execute(interaction) {
    const store = getStore();
    const quests = store.getDailyQuests(interaction.user.id);
    const rows = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId(`quest_refresh:${interaction.user.id}`).setLabel('Làm Mới').setStyle(ButtonStyle.Secondary)
    );
    const lines = quests.map((q, idx) => `Nhiệm vụ ${idx + 1}: ${q.desc} — Thưởng ${q.reward} V — ${q.done ? 'Hoàn thành' : 'Chưa'}`);
    await interaction.reply({ content: lines.join('\n') + '\nNhấn "Làm Mới" nếu nhiệm vụ quá khó (mất 2000 V).', components: [rows] });
  }
};

export const slashes: SlashCommand[] = [slash, slashInfo, slashQuest];


