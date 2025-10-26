import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import type { PrefixCommand, SlashCommand } from '../types/command.js';
import { getStore } from '../store/store.js';

// /guildowner <@user> <tên guild> <role>
export const slash: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('guildowner')
    .setDescription('Gán chủ sở hữu guild')
    .addUserOption((o) => o.setName('user').setDescription('Người dùng').setRequired(true))
    .addStringOption((o) => o.setName('name').setDescription('Tên guild').setRequired(true))
    .addStringOption((o) => o.setName('role').setDescription('ID role').setRequired(true)),
  async execute(interaction) {
    // Role kiểm soát: chỉ role id 1409811217048141896 được phép
    const allowRoleId = '1409811217048141896';
    const member = await interaction.guild!.members.fetch(interaction.user.id);
    if (!member.roles.cache.has(allowRoleId)) {
      await interaction.reply({ content: 'Bạn không có quyền dùng lệnh này.', ephemeral: true });
      return;
    }
    const user = interaction.options.getUser('user', true);
    const name = interaction.options.getString('name', true);
    const roleId = interaction.options.getString('role', true);
    const store = getStore();
    store.setGuildOwner(name, user.id, roleId);
    store.save();
    await interaction.reply({ content: `Đã đặt ${user} làm Guild Master '${name}' (role ${roleId}).`, ephemeral: true });
  }
};

// PREFIX COMMANDS REMOVED - Only slash commands supported
    const sub = (args[0] || '').toLowerCase();
    const store = getStore();
    const myGuild = store.getUserGuild(message.author.id);
    
    if (sub === 'create') {
      // Kiểm tra user chưa thuộc guild nào
      if (myGuild) {
        await message.reply('Bạn đã thuộc một guild rồi. Chỉ có thể tạo guild mới khi rời guild hiện tại.');
        return;
      }
      
      const guildName = args.slice(1).join(' ').trim();
      if (!guildName) {
        await message.reply('Cú pháp: v guild create <tên guild>');
        return;
      }
      
      // Tạo guild mới với user làm chủ
      const newGuild = store.ensureGuild(guildName);
      newGuild.ownerId = message.author.id;
      newGuild.members = [message.author.id];
      store.save();
      
      await message.reply(`Đã tạo guild '${guildName}' thành công! Bạn là Guild Master.`);
      return;
    }
    
    if (sub === 'add') {
      if (!myGuild || myGuild.ownerId !== message.author.id) { 
        await message.reply('Chỉ Guild Master mới dùng được.'); 
        return; 
      }
      
      const target = message.mentions.users.first();
      if (!target) { 
        await message.reply('Cú pháp: v guild add <@user>'); 
        return; 
      }
      
      // Kiểm tra target chưa thuộc guild nào
      const targetGuild = store.getUserGuild(target.id);
      if (targetGuild) {
        await message.reply(`${target} đã thuộc guild khác rồi.`);
        return;
      }
      
      // Kiểm tra slot còn trống
      const buffs = store.getGuildRankBuffs(myGuild.guildRank.level);
      if (myGuild.members.length >= buffs.memberSlots) {
        await message.reply(`Guild đã đầy! Tối đa ${buffs.memberSlots} hội viên (Hạng ${myGuild.guildRank.level}).`);
        return;
      }
      
      store.addGuildMember(myGuild.name, target.id);
      store.save();
      await message.reply(`Đã thêm ${target} vào guild ${myGuild.name}.`);
      return;
    }
    
    if (sub === 'remove') {
      if (!myGuild || myGuild.ownerId !== message.author.id) { 
        await message.reply('Chỉ Guild Master mới dùng được.'); 
        return; 
      }
      const target = message.mentions.users.first();
      if (!target) { 
        await message.reply('Cú pháp: v guild remove <@user>'); 
        return; 
      }
      store.removeGuildMember(myGuild.name, target.id);
      store.save();
      await message.reply(`Đã xóa ${target} khỏi guild ${myGuild.name}.`);
      return;
    }
    
    if (sub === 'list') {
      if (!myGuild) { 
        await message.reply('Bạn chưa thuộc guild nào.'); 
        return; 
      }
      const lines = myGuild.members.map((m) => `<@${m}>`).join(', ');
      await message.reply(`Hội viên guild ${myGuild.name}: ${lines || 'Trống'}`);
      return;
    }
    
    if (sub === 'inv') {
      if (!myGuild) { 
        await message.reply('Bạn chưa thuộc guild nào.'); 
        return; 
      }
      const lines = Object.entries(myGuild.inventory).map(([k, v]) => `${k}: ${v}`).join('\n');
      await message.reply(lines || 'Kho guild trống.');
      return;
    }
    
    if (sub === 'daily') {
      if (!myGuild) { 
        await message.reply('Bạn chưa thuộc guild nào.'); 
        return; 
      }
      const res = store.markGuildDaily(myGuild.name, message.author.id);
      // Nếu tất cả các thành viên đã điểm danh: thưởng 300 V cho tất cả
      if (res.completedAll) {
        for (const uid of myGuild.members) {
          store.getUser(uid).balance += 300;
        }
        store.save();
        await message.reply(`Toàn bộ hội viên đã điểm danh! Mỗi người nhận 300 V.`);
      } else {
        await message.reply(res.message);
      }
      return;
    }
    
    if (sub === 'bxh') {
      // BXH: theo hạng guild → tổng quỹ → số hội viên
      const guilds = Object.values((getStore() as any)['db'].guilds) as any[];
      const score = guilds.map((g) => ({
        name: g.name,
        level: g.guildRank.level,
        funds: g.guildRank.funds,
        members: g.members.length
      }));
      score.sort((a, b) => b.level - a.level || b.funds - a.funds || b.members - a.members);
      const lines = score.slice(0, 10).map((g, i) => 
        `${i + 1}. ${g.name} — Hạng ${g.level} — Quỹ: ${g.funds.toLocaleString()} V — ${g.members} hội viên`
      );
      await message.reply(lines.join('\n') || 'Chưa có guild nào.');
      return;
    }
    
    if (sub === 'quest') {
      if (!myGuild) { 
        await message.reply('Bạn chưa thuộc guild nào.'); 
        return; 
      }
      const quests = store.getGuildQuests(myGuild.name);
      const lines = quests.map((q, i) => `Nhiệm vụ ${i + 1}: ${q.desc} — Thưởng ${q.reward} V — ${q.done ? 'Hoàn thành' : 'Chưa'}`);
      await message.reply(lines.join('\n'));
      return;
    }
    
    if (sub === 'info') {
      if (!myGuild) { 
        await message.reply('Bạn chưa thuộc guild nào.'); 
        return; 
      }
      
      const buffs = store.getGuildRankBuffs(myGuild.guildRank.level);
      const nextLevelCost = store.getGuildRankUpgradeCost(myGuild.guildRank.level + 1);
      const progress = myGuild.guildRank.funds;
      const progressPercent = nextLevelCost > 0 ? Math.round((progress / nextLevelCost) * 100) : 100;
      
      const embed = new EmbedBuilder()
        .setTitle(`🏯 Guild: ${myGuild.name}`)
        .setColor('#1a237e')
        .addFields(
          { name: '👑 Guild Master', value: `<@${myGuild.ownerId}>`, inline: true },
          { name: '🏆 Guild Hạng', value: `${myGuild.guildRank.level}/5`, inline: true },
          { name: '👥 Hội viên', value: `${myGuild.members.length}/${buffs.memberSlots}`, inline: true },
          { name: '💰 Quỹ hiện tại', value: `${myGuild.guildRank.funds.toLocaleString()} V`, inline: true },
          { name: '📈 Tiến độ nâng hạng', value: `${progressPercent}% (${progress.toLocaleString()}/${nextLevelCost.toLocaleString()})`, inline: true },
          { name: '🎯 Buff hiện tại', value: [
            `• Phúc Lộc: +${buffs.incomeBonus}%`,
            `• Tốc Hành: -${buffs.cooldownReduction}%`,
            `• Tu Luyện: +${buffs.xpBonus}%`
          ].join('\n'), inline: false }
        )
        .setTimestamp();
      
      await message.reply({ embeds: [embed] });
      return;
    }
    
    if (sub === 'donate') {
      if (!myGuild) { 
        await message.reply('Bạn chưa thuộc guild nào.'); 
        return; 
      }
      
      const amount = Number(args[1]);
      if (!Number.isFinite(amount) || amount <= 0) {
        await message.reply('Cú pháp: v guild donate <số tiền>');
        return;
      }
      
      const result = store.contributeToGuild(myGuild.name, message.author.id, amount);
      if (!result.success) {
        await message.reply(result.message);
        return;
      }
      
      let reply = result.message;
      if (result.upgraded) {
        const newLevel = myGuild.guildRank.level;
        const newBuffs = store.getGuildRankBuffs(newLevel);
        reply += `\n\n🎉 **GUILD ĐÃ NÂNG HẠNG LÊN HẠNG ${newLevel}!** 🎉\n`;
        reply += `• Slot hội viên: ${newBuffs.memberSlots}\n`;
        reply += `• Buff Phúc Lộc: +${newBuffs.incomeBonus}%\n`;
        reply += `• Buff Tốc Hành: -${newBuffs.cooldownReduction}%\n`;
        reply += `• Buff Tu Luyện: +${newBuffs.xpBonus}%`;
      }
      
      await message.reply(reply);
      return;
    }
    
    await message.reply('Các lệnh: v guild create/add/remove/list/inv/daily/bxh/quest/info/donate');
  }
};

// PREFIX COMMANDS REMOVED - Only slash commands supported
