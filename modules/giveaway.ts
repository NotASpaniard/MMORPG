import { EmbedBuilder, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import type { PrefixCommand, SlashCommand } from '../types/command.js';

// Lệnh tạo giveaway

// /giveaway - Slash command handler
export const slashGiveaway: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('giveaway')
    .setDescription('giveaway command'),
  async execute(interaction) {
    // TODO: Implement slash command logic
    await interaction.reply({ content: 'Slash command giveaway - Coming soon!', ephemeral: true });
  }
};

export const prefixGiveaway: PrefixCommand = {
  name: 'ga',
  description: 'Tạo giveaway mới (chỉ role Giveaway/Admin)',
  async execute(message, args) {
    // Kiểm tra quyền
    const hasPermission = message.member?.permissions.has(PermissionFlagsBits.Administrator) ||
                         message.member?.roles.cache.some(role => role.name === 'Giveaway');
    
    if (!hasPermission) {
      await message.reply('❌ Bạn không có quyền sử dụng lệnh này.');
      return;
    }

    if (args.length < 3) {
      await message.reply('Cú pháp: `v ga <số giờ> <số người win> <nội dung>` hoặc `v ga <số giờ> <số người win> <role yêu cầu> <nội dung>`');
      return;
    }

    const hours = parseInt(args[0]);
    const winners = parseInt(args[1]);
    
    if (isNaN(hours) || isNaN(winners) || hours <= 0 || winners <= 0) {
      await message.reply('❌ Số giờ và số người thắng phải là số dương.');
      return;
    }

    // Kiểm tra xem có role yêu cầu không
    let requiredRole = null;
    let content = '';
    
    if (args.length >= 4 && args[2].startsWith('<@&') && args[2].endsWith('>')) {
      // Có role yêu cầu
      requiredRole = args[2];
      content = args.slice(3).join(' ');
    } else {
      // Không có role yêu cầu
      content = args.slice(2).join(' ');
    }

    if (!content) {
      await message.reply('❌ Nội dung giveaway không được để trống.');
      return;
    }

    const endTime = Date.now() + (hours * 60 * 60 * 1000);
    const endDate = new Date(endTime);

    const embed = new EmbedBuilder()
      .setAuthor({ 
        name: 'Lửa Việt', 
        iconURL: message.guild?.iconURL() || undefined 
      })
      .setDescription(`## ${content} 🎫\n\n<:LV_orange:1410543066435162174> Nhấn <a:LV_fire:1413427579326824479> để tham gia\n<:LV_orange:1410543066435162174> Đếm ngược: <t:${Math.floor(endTime / 1000)}:R>\n<:LV_orange:1410543066435162174> Tổ chức bởi: <@${message.author.id}>`)
      .setColor('#f46026')
      .setThumbnail(message.author.displayAvatarURL())
      .setFooter({ 
        text: `Giveaway với ${winners} giải · <t:${Math.floor(endTime / 1000)}:F>`, 
        iconURL: message.guild?.iconURL() || undefined 
      })
      .setTimestamp();

    if (requiredRole) {
      embed.addFields({ name: '📋 Yêu cầu', value: `Role: ${requiredRole}`, inline: false });
    }

    const giveawayMessage = await (message.channel as any).send({ embeds: [embed] });
    await giveawayMessage.react('<a:LV_fire:1413427579326824479>');

    // Lưu thông tin giveaway (có thể lưu vào database hoặc file)
    // Ở đây tôi sẽ chỉ log ra console
    console.log(`Giveaway created: ${giveawayMessage.id}, ends at ${endDate.toISOString()}, winners: ${winners}, content: ${content}`);

    await message.reply(`✅ Đã tạo giveaway! ID: ${giveawayMessage.id}`);
  }
};

// Lệnh reroll giveaway
export const prefixReroll: PrefixCommand = {
  name: 'reroll',
  description: 'Chọn lại người thắng cuộc (chỉ role Giveaway/Admin)',
  async execute(message, args) {
    // Kiểm tra quyền
    const hasPermission = message.member?.permissions.has(PermissionFlagsBits.Administrator) ||
                         message.member?.roles.cache.some(role => role.name === 'Giveaway');
    
    if (!hasPermission) {
      await message.reply('❌ Bạn không có quyền sử dụng lệnh này.');
      return;
    }

    if (args.length < 1) {
      await message.reply('Cú pháp: `v reroll <id_message>`');
      return;
    }

    const messageId = args[0];
    
    try {
      const giveawayMessage = await message.channel.messages.fetch(messageId);
      
      if (!giveawayMessage) {
        await message.reply('❌ Không tìm thấy tin nhắn giveaway.');
        return;
      }

      // Kiểm tra xem có phải là giveaway không
      if (!giveawayMessage.embeds[0]?.title?.includes('GIVEAWAY')) {
        await message.reply('❌ Tin nhắn này không phải là giveaway.');
        return;
      }

      // Lấy danh sách người tham gia
      const reaction = giveawayMessage.reactions.cache.get('<a:LV_fire:1413427579326824479>');
      if (!reaction) {
        await message.reply('❌ Không tìm thấy reaction 🔥 trong giveaway.');
        return;
      }

      const participants = await reaction.users.fetch();
      const validParticipants = participants.filter(user => !user.bot);

      if (validParticipants.size === 0) {
        await message.reply('❌ Không có người tham gia nào.');
        return;
      }

      // Chọn người thắng ngẫu nhiên
      const winners = Array.from(validParticipants.values()).sort(() => 0.5 - Math.random()).slice(0, 1);
      
      const embed = new EmbedBuilder()
        .setTitle('<a:LV_giveaway1:1428329034525442150> GIVEAWAY REROLL <a:LV_giveaway1:1428329034525442150>')
        .setDescription(`**Người thắng mới:** ${winners.map(w => `<@${w.id}>`).join(', ')}`)
        .setColor('#f46026')
        .setTimestamp();

      await message.reply({ embeds: [embed] });

    } catch (error) {
      await message.reply('❌ Lỗi khi reroll giveaway.');
      console.error('Reroll error:', error);
    }
  }
};

// Lệnh kết thúc giveaway sớm
export const prefixEndGiveaway: PrefixCommand = {
  name: 'end',
  description: 'Kết thúc giveaway sớm (chỉ role Giveaway/Admin)',
  async execute(message, args) {
    // Kiểm tra quyền
    const hasPermission = message.member?.permissions.has(PermissionFlagsBits.Administrator) ||
                         message.member?.roles.cache.some(role => role.name === 'Giveaway');
    
    if (!hasPermission) {
      await message.reply('❌ Bạn không có quyền sử dụng lệnh này.');
      return;
    }

    if (args.length < 1) {
      await message.reply('Cú pháp: `v end <id_message>`');
      return;
    }

    const messageId = args[0];
    
    try {
      const giveawayMessage = await message.channel.messages.fetch(messageId);
      
      if (!giveawayMessage) {
        await message.reply('❌ Không tìm thấy tin nhắn giveaway.');
        return;
      }

      // Kiểm tra xem có phải là giveaway không
      if (!giveawayMessage.embeds[0]?.title?.includes('GIVEAWAY')) {
        await message.reply('❌ Tin nhắn này không phải là giveaway.');
        return;
      }

      // Lấy danh sách người tham gia
      const reaction = giveawayMessage.reactions.cache.get('<a:LV_fire:1413427579326824479>');
      if (!reaction) {
        await message.reply('❌ Không tìm thấy reaction 🔥 trong giveaway.');
        return;
      }

      const participants = await reaction.users.fetch();
      const validParticipants = participants.filter(user => !user.bot);

      if (validParticipants.size === 0) {
        await message.reply('❌ Không có người tham gia nào.');
        return;
      }

      // Chọn người thắng ngẫu nhiên
      const winners = Array.from(validParticipants.values()).sort(() => 0.5 - Math.random()).slice(0, 1);
      
      const embed = new EmbedBuilder()
        .setTitle('<a:LV_giveaway1:1428329034525442150> GIVEAWAY KẾT THÚC <a:LV_giveaway1:1428329034525442150>')
        .setDescription(`**Người thắng:** ${winners.map(w => `<@${w.id}>`).join(', ')}\n\nChúc mừng! 🎊`)
        .setColor('#f46026')
        .setTimestamp();

      await giveawayMessage.edit({ embeds: [embed] });
      await message.reply('✅ Đã kết thúc giveaway!');

    } catch (error) {
      await message.reply('❌ Lỗi khi kết thúc giveaway.');
      console.error('End giveaway error:', error);
    }
  }
};

// Lệnh xem danh sách giveaway
export const prefixGiveawayList: PrefixCommand = {
  name: 'glist',
  description: 'Xem các giveaway đang diễn ra (chỉ role Giveaway/Admin)',
  async execute(message) {
    // Kiểm tra quyền
    const hasPermission = message.member?.permissions.has(PermissionFlagsBits.Administrator) ||
                         message.member?.roles.cache.some(role => role.name === 'Giveaway');
    
    if (!hasPermission) {
      await message.reply('❌ Bạn không có quyền sử dụng lệnh này.');
      return;
    }

    // Ở đây tôi sẽ chỉ hiển thị thông báo vì chưa có database lưu trữ giveaway
    const embed = new EmbedBuilder()
      .setTitle('📋 Danh Sách Giveaway')
      .setDescription('Hiện tại chưa có giveaway nào đang diễn ra.')
      .setColor('#FFA500')
      .setTimestamp();

    await message.reply({ embeds: [embed] });
  }
};

// PREFIX COMMANDS REMOVED - Only slash commands supported
