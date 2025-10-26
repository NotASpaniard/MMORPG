import { EmbedBuilder, PermissionFlagsBits, ChannelType, SlashCommandBuilder } from 'discord.js';
import type { PrefixCommand, SlashCommand } from '../types/command.js';

// Lệnh đổi tên kênh nhanh

// /flash - Slash command handler
export const slashFlash: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('flash')
    .setDescription('flash command'),
  async execute(interaction) {
    // TODO: Implement slash command logic
    await interaction.reply({ content: 'Slash command flash - Coming soon!', ephemeral: true });
  }
};

export const prefixRenameChannel: PrefixCommand = {
  name: 'rn',
  description: 'Đổi tên kênh một cách nhanh chóng (chỉ Admin)',
  async execute(message, args) {
    // Kiểm tra quyền admin
    if (!message.member?.permissions.has(PermissionFlagsBits.Administrator)) {
      await message.reply('❌ Bạn không có quyền sử dụng lệnh này.');
      return;
    }

    if (args.length < 1) {
      await message.reply('Cú pháp: `v rn <tên_kênh_mới>`');
      return;
    }

    const newName = args.join(' ');

    try {
      if ('setName' in message.channel) {
        await (message.channel as any).setName(newName);
      }
      
      const embed = new EmbedBuilder()
        .setTitle('✅ Đổi Tên Kênh')
        .setDescription(`Đã đổi tên kênh thành: **${newName}**`)
        .setColor('#00FF00')
        .setTimestamp();

      await message.reply({ embeds: [embed] });
    } catch (error) {
      await message.reply('❌ Lỗi khi đổi tên kênh. Có thể do tên kênh không hợp lệ hoặc bot không có quyền.');
      console.error('Rename channel error:', error);
    }
  }
};

// Lệnh khóa kênh
export const prefixLockChannel: PrefixCommand = {
  name: 'lock',
  description: 'Khóa quyền gửi tin nhắn tại channel đó (chỉ Admin)',
  async execute(message) {
    // Kiểm tra quyền admin
    if (!message.member?.permissions.has(PermissionFlagsBits.Administrator)) {
      await message.reply('❌ Bạn không có quyền sử dụng lệnh này.');
      return;
    }

    try {
      // Khóa kênh cho @everyone
      if ('permissionOverwrites' in message.channel) {
        await (message.channel as any).permissionOverwrites.edit(message.guild!.roles.everyone, {
          SendMessages: false
        });
      }

      const embed = new EmbedBuilder()
        .setTitle('🔒 Khóa Kênh')
        .setDescription('Kênh đã được khóa. Chỉ admin mới có thể gửi tin nhắn.')
        .setColor('#FF0000')
        .setTimestamp();

      await message.reply({ embeds: [embed] });
    } catch (error) {
      await message.reply('❌ Lỗi khi khóa kênh. Bot có thể không có quyền quản lý kênh.');
      console.error('Lock channel error:', error);
    }
  }
};

// Lệnh mở khóa kênh
export const prefixUnlockChannel: PrefixCommand = {
  name: 'unlock',
  description: 'Mở khóa quyền gửi tin nhắn tại channel đó (chỉ Admin)',
  async execute(message) {
    // Kiểm tra quyền admin
    if (!message.member?.permissions.has(PermissionFlagsBits.Administrator)) {
      await message.reply('❌ Bạn không có quyền sử dụng lệnh này.');
      return;
    }

    try {
      // Mở khóa kênh cho @everyone
      if ('permissionOverwrites' in message.channel) {
        await (message.channel as any).permissionOverwrites.edit(message.guild!.roles.everyone, {
          SendMessages: true
        });
      }

      const embed = new EmbedBuilder()
        .setTitle('🔓 Mở Khóa Kênh')
        .setDescription('Kênh đã được mở khóa. Mọi người có thể gửi tin nhắn.')
        .setColor('#00FF00')
        .setTimestamp();

      await message.reply({ embeds: [embed] });
    } catch (error) {
      await message.reply('❌ Lỗi khi mở khóa kênh. Bot có thể không có quyền quản lý kênh.');
      console.error('Unlock channel error:', error);
    }
  }
};

// Lệnh xóa tin nhắn
export const prefixClearMessages: PrefixCommand = {
  name: 'clear',
  description: 'Xóa số lượng tin nhắn (chỉ Admin)',
  async execute(message, args) {
    // Kiểm tra quyền admin
    if (!message.member?.permissions.has(PermissionFlagsBits.Administrator)) {
      await message.reply('❌ Bạn không có quyền sử dụng lệnh này.');
      return;
    }

    if (args.length < 1) {
      await message.reply('Cú pháp: `v clear <số_lượng>`');
      return;
    }

    const amount = parseInt(args[0]);
    
    if (isNaN(amount) || amount <= 0 || amount > 100) {
      await message.reply('❌ Số lượng phải là số từ 1 đến 100.');
      return;
    }

    try {
      // Xóa tin nhắn
      let deleted = 0;
      if ('bulkDelete' in message.channel) {
        const result = await (message.channel as any).bulkDelete(amount, true);
        deleted = result?.size || 0;
      }
      
      const embed = new EmbedBuilder()
        .setTitle('🗑️ Xóa Tin Nhắn')
        .setDescription(`Đã xóa **${deleted}** tin nhắn.`)
        .setColor('#FFA500')
        .setTimestamp();

      const reply = await message.reply({ embeds: [embed] });
      
      // Tự động xóa tin nhắn phản hồi sau 5 giây
      setTimeout(async () => {
        try {
          await reply.delete();
        } catch (error) {
          console.error('Error deleting reply:', error);
        }
      }, 5000);

    } catch (error) {
      await message.reply('❌ Lỗi khi xóa tin nhắn. Có thể do tin nhắn quá cũ (hơn 14 ngày) hoặc bot không có quyền.');
      console.error('Clear messages error:', error);
    }
  }
};

// PREFIX COMMANDS REMOVED - Only slash commands supported
