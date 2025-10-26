import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import type { SlashCommand } from '../types/command.js';
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

// SLASH COMMANDS ONLY - PREFIX COMMANDS REMOVED
