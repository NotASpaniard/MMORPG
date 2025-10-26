import { ActionRowBuilder, ButtonBuilder, ButtonStyle, SlashCommandBuilder } from 'discord.js';
import type { PrefixCommand, SlashCommand } from '../types/command.js';
import { getStore } from '../store/store.js';

// PREFIX: v!name <content>, v!legit <content>
const MANAGER_ROLES = ['326514371876356097']; // Admin User ID

function hasAnyRole(member: any, roleIds: string[]): boolean {
  // Check if user ID matches
  if (roleIds.includes(member.user.id)) return true;
  // Check roles
  return roleIds.some((id) => member.roles.cache.has(id));
}

export const prefixName: PrefixCommand = {
  name: 'name',
  description: 'Đổi tên kênh nhanh: v!name <content>',
  async execute(message, args) {
    const member = await message.guild!.members.fetch(message.author.id);
    if (!hasAnyRole(member, MANAGER_ROLES)) { await message.reply('Bạn không có quyền.'); return; }
    const content = args.join(' ').trim();
    if (!content) { await message.reply('Cú pháp: v!name <content>'); return; }
    if ('setName' in message.channel) {
      await (message.channel as any).setName(content.slice(0, 100));
    }
    await message.reply('Đã đổi tên kênh.');
  }
};

export const prefixLegit: PrefixCommand = {
  name: 'legit',
  description: 'Feedback/legit đơn hàng: v!legit <content>',
  async execute(message, args) {
    const member = await message.guild!.members.fetch(message.author.id);
    if (!hasAnyRole(member, MANAGER_ROLES)) { await message.reply('Bạn không có quyền.'); return; }
    const content = args.join(' ').trim();
    if (!content) { await message.reply('Cú pháp: v!legit <content>'); return; }
    await message.reply(`LEGIT: ${content}`);
  }
};

// PREFIX COMMANDS REMOVED - Only slash commands supported

// SLASH: /add /remove /reset với xác nhận
function buildConfirmRow(id: string, label: string): ActionRowBuilder<ButtonBuilder> {
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setCustomId(id).setLabel(label).setStyle(ButtonStyle.Danger)
  );
}

export const slashAdd: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('add')
    .setDescription('Thêm tiền cho người dùng (cần quyền)')
    .addUserOption((o) => o.setName('user').setDescription('Người dùng').setRequired(true))
    .addIntegerOption((o) => o.setName('amount').setDescription('Số tiền').setRequired(true)),
  async execute(interaction) {
    const member = await interaction.guild!.members.fetch(interaction.user.id);
    if (!hasAnyRole(member, MANAGER_ROLES)) { await interaction.reply({ content: 'Bạn không có quyền.', ephemeral: true }); return; }
    const user = interaction.options.getUser('user', true);
    const amount = interaction.options.getInteger('amount', true);
    await interaction.reply({ content: `Xác nhận thêm ${amount} V cho ${user}?`, components: [buildConfirmRow(`admin_add:${user.id}:${amount}`, 'Xác Nhận')], ephemeral: true });
  }
};

export const slashRemove: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('remove')
    .setDescription('Trừ tiền người dùng (cần quyền)')
    .addUserOption((o) => o.setName('user').setDescription('Người dùng').setRequired(true))
    .addIntegerOption((o) => o.setName('amount').setDescription('Số tiền').setRequired(true)),
  async execute(interaction) {
    const member = await interaction.guild!.members.fetch(interaction.user.id);
    if (!hasAnyRole(member, MANAGER_ROLES)) { await interaction.reply({ content: 'Bạn không có quyền.', ephemeral: true }); return; }
    const user = interaction.options.getUser('user', true);
    const amount = interaction.options.getInteger('amount', true);
    await interaction.reply({ content: `Xác nhận trừ ${amount} V của ${user}?`, components: [buildConfirmRow(`admin_remove:${user.id}:${amount}`, 'Xác Nhận')], ephemeral: true });
  }
};

export const slashReset: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('resetmoney')
    .setDescription('Reset toàn bộ tiền người dùng (cần quyền)')
    .addUserOption((o) => o.setName('user').setDescription('Người dùng').setRequired(true)),
  async execute(interaction) {
    const member = await interaction.guild!.members.fetch(interaction.user.id);
    if (!hasAnyRole(member, MANAGER_ROLES)) { await interaction.reply({ content: 'Bạn không có quyền.', ephemeral: true }); return; }
    const user = interaction.options.getUser('user', true);
    await interaction.reply({ content: `Xác nhận reset tiền của ${user}?`, components: [buildConfirmRow(`admin_reset:${user.id}:0`, 'Xác Nhận')], ephemeral: true });
  }
};

export const slashes: SlashCommand[] = [slashAdd, slashRemove, slashReset];


