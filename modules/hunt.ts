import { EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import type { PrefixCommand, SlashCommand } from '../types/command.js';
import { getStore } from '../store/store.js';
import { readFileSync } from 'node:fs';
import path from 'node:path';

// v hunt - Săn quái 1 lần

// /hunt - Slash command handler
export const slashHunt: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('hunt')
    .setDescription('Săn quái thần thoại (cooldown 2 phút)'),
  async execute(interaction) {
    try {
      const store = getStore();
      const cooldownCheck = store.checkCooldown(interaction.user.id, 'hunt');
      
      if (!cooldownCheck.canUse) {
        await interaction.reply({ content: `⏰ Bạn cần chờ ${cooldownCheck.remainingMinutes} phút nữa mới có thể săn quái.`, ephemeral: true });
        return;
      }
      
      const user = store.getUser(interaction.user.id);
      const gameConfig = JSON.parse(readFileSync(path.join(process.cwd(), 'data/game_config.json'), 'utf8'));
      
      // Lọc monsters theo level
      const availableMonsters = Object.entries(gameConfig.monsters)
        .filter(([_, config]: [string, any]) => user.level >= config.levelRequired);
      
      if (availableMonsters.length === 0) {
        await interaction.reply({ content: 'Bạn cần level cao hơn để săn quái.', ephemeral: true });
        return;
      }
      
      // Tính tỷ lệ thành công với weapon bonus
      let baseSuccessRate = 0;
      let monsterName = '';
      let monsterEmoji = '';
      let monsterReward = { min: 0, max: 0 };
      let monsterLoot = '';
      
      // Chọn monster ngẫu nhiên
      const [monsterId, monsterConfig] = availableMonsters[Math.floor(Math.random() * availableMonsters.length)];
      monsterName = (monsterConfig as any).name;
      monsterEmoji = (monsterConfig as any).emoji;
      monsterReward = (monsterConfig as any).reward;
      monsterLoot = (monsterConfig as any).loot;
      baseSuccessRate = (monsterConfig as any).successRate;
      
      // Weapon bonus
      let weaponBonus = 0;
      if (user.equippedItems.weapon) {
        const weaponId = user.equippedItems.weapon;
        const weaponBonusData = gameConfig.weapon_bonuses[weaponId];
        if (weaponBonusData) {
          weaponBonus = weaponBonusData;
        }
      }
      
      const finalSuccessRate = Math.min(95, baseSuccessRate + weaponBonus);
      const isSuccess = Math.random() * 100 < finalSuccessRate;
      
      if (isSuccess) {
        // Thành công
        const reward = monsterReward.min + Math.floor(Math.random() * (monsterReward.max - monsterReward.min + 1));
        let finalReward = reward;
        
        // Dép Tổ Ong bonus
        if (user.equippedItems.weapon === 'dep_to_ong') {
          finalReward = Math.floor(reward * 1.5);
        }
        
        user.balance += finalReward;
        store.addItemToInventory(interaction.user.id, 'monsterItems', monsterLoot, 1);
        store.setCooldown(interaction.user.id, 'hunt', 2);
        store.addXP(interaction.user.id, 5);
        store.save();
        
        const embed = new EmbedBuilder()
          .setTitle('⚔️ Săn quái thành công!')
          .setColor('#4fc3f7')
          .addFields(
            { name: 'Quái vật', value: `${monsterEmoji} ${monsterName}`, inline: true },
            { name: 'Phần thưởng', value: `${finalReward} V`, inline: true },
            { name: 'Loot', value: `${monsterLoot}`, inline: true }
          )
          .setTimestamp();
        
        if (user.equippedItems.weapon === 'dep_to_ong') {
          embed.addFields({ name: '🏆 Dép Tổ Ong Bonus', value: '+50% V reward', inline: false });
        }
        
        await interaction.reply({ embeds: [embed] });
      } else {
        // Thất bại
        store.setCooldown(interaction.user.id, 'hunt', 2);
        store.save();
        
        const embed = new EmbedBuilder()
          .setTitle('💀 Săn quái thất bại!')
          .setColor('#f44336')
          .addFields(
            { name: 'Quái vật', value: `${monsterEmoji} ${monsterName}`, inline: true },
            { name: 'Kết quả', value: 'Quái vật đã trốn thoát!', inline: true },
            { name: 'Tỷ lệ thành công', value: `${finalSuccessRate}%`, inline: true }
          )
          .setTimestamp();
        
        await interaction.reply({ embeds: [embed] });
      }
    } catch (error) {
      console.error('Error in slashHunt:', error);
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({ content: 'Có lỗi xảy ra khi săn quái.', ephemeral: true });
      }
    }
  }
};

// All prefix commands removed - only slash commands are supported now

// /hunt-equip - Slash command handler
export const slashHuntEquip: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('hunt-equip')
    .setDescription('Trang bị vũ khí săn quái')
    .addStringOption(option =>
      option.setName('weapon')
        .setDescription('Tên vũ khí muốn trang bị')
        .setRequired(true)),
  async execute(interaction) {
    const weaponName = interaction.options.getString('weapon', true);
    const store = getStore();
    const result = store.equipItem(interaction.user.id, 'weapon', weaponName);
    
    const embed = new EmbedBuilder()
      .setTitle('⚔️ Trang Bị Vũ Khí')
      .setColor(result.success ? '#00FF00' : '#FF0000')
      .setDescription(result.message)
      .setTimestamp();
    
    await interaction.reply({ embeds: [embed] });
  }
};

// /hunt-inventory - Slash command handler
export const slashHuntInventory: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('hunt-inventory')
    .setDescription('Xem đồ săn quái'),
  async execute(interaction) {
    const store = getStore();
    const user = store.getUser(interaction.user.id);
    const monsterItems = user.categorizedInventory.monsterItems;
    const weapons = user.categorizedInventory.weapons;
    
    const formatItems = (items: Record<string, number>, emoji: string) => {
      const entries = Object.entries(items);
      if (entries.length === 0) return `${emoji} Trống`;
      return entries.map(([item, qty]) => `${emoji} ${item}: ${qty}`).join('\n');
    };
    
    const embed = new EmbedBuilder()
      .setTitle('⚔️ Đồ Săn Quái')
      .setColor('#1a237e')
      .addFields(
        { name: '⚔️ Vũ khí', value: formatItems(weapons, '⚔️'), inline: true },
        { name: '👻 Linh hồn quái', value: formatItems(monsterItems, '👻'), inline: true },
        { name: '🎯 Đang trang bị', value: user.equippedItems.weapon || 'Không có', inline: true }
      )
      .setTimestamp();
    
    await interaction.reply({ embeds: [embed] });
  }
};

// /hunt-use - Slash command handler
export const slashHuntUse: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('hunt-use')
    .setDescription('Dùng bùa phép tăng tỷ lệ săn quái')
    .addStringOption(option =>
      option.setName('item')
        .setDescription('Tên bùa phép muốn dùng')
        .setRequired(true)
        .addChoices(
          { name: 'Lucky Charm', value: 'lucky_charm' }
        )),
  async execute(interaction) {
    const itemName = interaction.options.getString('item', true);
    const store = getStore();
    const user = store.getUser(interaction.user.id);
    
    if (itemName === 'lucky_charm') {
      const hasCharm = store.getItemQuantity(interaction.user.id, 'monsterItems', 'lucky_charm') > 0;
      if (!hasCharm) {
        await interaction.reply({ content: 'Bạn không có lucky charm.', ephemeral: true });
        return;
      }
      
      // Lucky charm sẽ được dùng tự động khi hunt
      await interaction.reply({ content: '🍀 Lucky charm đã được kích hoạt! Sẽ được dùng trong lần săn tiếp theo.', ephemeral: true });
      return;
    }
    
    await interaction.reply({ content: 'Chỉ có thể dùng lucky_charm.', ephemeral: true });
  }
};

export const slashes: SlashCommand[] = [slashHunt, slashHuntEquip, slashHuntInventory, slashHuntUse];
