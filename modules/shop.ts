import { EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import type { PrefixCommand, SlashCommand } from '../types/command.js';
import { getStore } from '../store/store.js';
import { readFileSync } from 'node:fs';
import path from 'node:path';

// v shop - Xem tất cả shop categories

// /shop - Slash command handler
export const slashShop: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('shop')
    .setDescription('Xem cửa hàng')
    .addStringOption(option =>
      option.setName('category')
        .setDescription('Loại cửa hàng')
        .setRequired(false)
        .addChoices(
          { name: 'Trứng', value: 'eggs' },
          { name: 'Vũ khí', value: 'weapons' },
          { name: 'Phù chú', value: 'dungeon' },
          { name: 'Vai trò', value: 'roles' }
        )),
  async execute(interaction) {
    try {
      const category = interaction.options.getString('category');
      const store = getStore();
      const shopConfig = JSON.parse(readFileSync(path.join(process.cwd(), 'data/shop_config.json'), 'utf8'));
      
      if (category) {
        // Show specific category
        const items = shopConfig[category];
        if (!items) {
          await interaction.reply({ content: 'Loại cửa hàng không tồn tại.', ephemeral: true });
          return;
        }
        
        const embed = new EmbedBuilder()
          .setTitle(`🛒 Cửa hàng ${category}`)
          .setColor('#1a237e')
          .setDescription(`Danh sách ${category} có sẵn:`);
        
        for (const [itemId, item] of Object.entries(items)) {
          const price = (item as any).price;
          const name = (item as any).name;
          const description = (item as any).description;
          const levelRequired = (item as any).levelRequired;
          
          embed.addFields({
            name: `${name} ${price === 0 ? '🏆 KHÔNG BÁN' : `${price} V`}`,
            value: `${description}\nLevel: ${levelRequired}`,
            inline: true
          });
        }
        
        await interaction.reply({ embeds: [embed] });
      } else {
        // Show all categories
        const embed = new EmbedBuilder()
          .setTitle('🛒 Cửa hàng VIE')
          .setColor('#1a237e')
          .setDescription('Chọn loại cửa hàng:')
          .addFields(
            { name: '🥚 Trứng', value: 'Trứng thần thoại để ấp', inline: true },
            { name: '⚔️ Vũ khí', value: 'Binh khí săn quái', inline: true },
            { name: '🔮 Phù chú', value: 'Bùa phép đi ải', inline: true },
            { name: '👑 Vai trò', value: 'Chức nghiệp đặc biệt', inline: true }
          )
          .setFooter({ text: 'Sử dụng /shop <category> để xem chi tiết' });
        
        await interaction.reply({ embeds: [embed] });
      }
    } catch (error) {
      console.error('Error in slashShop:', error);
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({ content: 'Có lỗi xảy ra khi xem cửa hàng.', ephemeral: true });
      }
    }
  }
};


// /buy - Slash command handler
export const slashBuy: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('buy')
    .setDescription('Mua item từ cửa hàng')
    .addStringOption(option =>
      option.setName('item_id')
        .setDescription('ID của item muốn mua')
        .setRequired(true))
    .addIntegerOption(option =>
      option.setName('quantity')
        .setDescription('Số lượng (mặc định: 1)')
        .setRequired(false)
        .setMinValue(1)),
  async execute(interaction) {
    try {
      const itemId = interaction.options.getString('item_id', true);
      const quantity = interaction.options.getInteger('quantity') || 1;
      const store = getStore();
      const user = store.getUser(interaction.user.id);
      const shopConfig = JSON.parse(readFileSync(path.join(process.cwd(), 'data/shop_config.json'), 'utf8'));
      
      // Find item in shop
      let item = null;
      let category = '';
      for (const [cat, items] of Object.entries(shopConfig)) {
        if ((items as any)[itemId]) {
          item = (items as any)[itemId];
          category = cat;
          break;
        }
      }
      
      if (!item) {
        await interaction.reply({ content: 'Item không tồn tại trong cửa hàng.', ephemeral: true });
        return;
      }
      
      const price = (item as any).price;
      const name = (item as any).name;
      const levelRequired = (item as any).levelRequired;
      const totalCost = price * quantity;
      
      if (price === 0) {
        await interaction.reply({ content: 'Item này không thể mua được.', ephemeral: true });
        return;
      }
      
      if (user.level < levelRequired) {
        await interaction.reply({ content: `Cần level ${levelRequired} để mua item này.`, ephemeral: true });
        return;
      }
      
      if (user.balance < totalCost) {
        await interaction.reply({ content: `Không đủ V. Cần ${totalCost} V, hiện có ${user.balance} V.`, ephemeral: true });
        return;
      }
      
      // Purchase item
      user.balance -= totalCost;
      store.addItemToInventory(interaction.user.id, category as any, itemId, quantity);
      store.save();
      
      const embed = new EmbedBuilder()
        .setTitle('🛒 Mua thành công!')
        .setColor('#4fc3f7')
        .addFields(
          { name: 'Item', value: `${name}`, inline: true },
          { name: 'Số lượng', value: `${quantity}`, inline: true },
          { name: 'Tổng chi phí', value: `${totalCost} V`, inline: true },
          { name: 'Số dư còn lại', value: `${user.balance} V`, inline: false }
        )
        .setTimestamp();
      
      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Error in slashBuy:', error);
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({ content: 'Có lỗi xảy ra khi mua item.', ephemeral: true });
      }
    }
  }
};


// /sell - Slash command handler
export const slashSell: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('sell')
    .setDescription('Bán item từ túi đồ')
    .addStringOption(option =>
      option.setName('item_id')
        .setDescription('ID của item muốn bán')
        .setRequired(true))
    .addIntegerOption(option =>
      option.setName('quantity')
        .setDescription('Số lượng (mặc định: 1)')
        .setRequired(false)
        .setMinValue(1)),
  async execute(interaction) {
    try {
      const itemId = interaction.options.getString('item_id', true);
      const quantity = interaction.options.getInteger('quantity') || 1;
      const store = getStore();
      const user = store.getUser(interaction.user.id);
      const shopConfig = JSON.parse(readFileSync(path.join(process.cwd(), 'data/shop_config.json'), 'utf8'));
      
      // Find item in shop to get sell price
      let item = null;
      let category = '';
      for (const [cat, items] of Object.entries(shopConfig)) {
        if ((items as any)[itemId]) {
          item = (items as any)[itemId];
          category = cat;
          break;
        }
      }
      
      if (!item) {
        await interaction.reply({ content: 'Item không tồn tại trong cửa hàng.', ephemeral: true });
        return;
      }
      
      const price = (item as any).price;
      const name = (item as any).name;
      const sellPrice = Math.floor(price * 0.5); // 50% of buy price
      const totalEarned = sellPrice * quantity;
      
      if (price === 0) {
        await interaction.reply({ content: 'Item này không thể bán được.', ephemeral: true });
        return;
      }
      
      // Check if user has enough items
      const currentQuantity = store.getItemQuantity(interaction.user.id, category as any, itemId);
      if (currentQuantity < quantity) {
        await interaction.reply({ content: `Không đủ item. Hiện có ${currentQuantity}, cần ${quantity}.`, ephemeral: true });
        return;
      }
      
      // Sell item
      store.removeItemFromInventory(interaction.user.id, category as any, itemId, quantity);
      user.balance += totalEarned;
      store.save();
      
      const embed = new EmbedBuilder()
        .setTitle('💰 Bán thành công!')
        .setColor('#4fc3f7')
        .addFields(
          { name: 'Item', value: `${name}`, inline: true },
          { name: 'Số lượng', value: `${quantity}`, inline: true },
          { name: 'Tổng thu được', value: `${totalEarned} V`, inline: true },
          { name: 'Số dư hiện tại', value: `${user.balance} V`, inline: false }
        )
        .setTimestamp();
      
      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Error in slashSell:', error);
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({ content: 'Có lỗi xảy ra khi bán item.', ephemeral: true });
      }
    }
  }
};

// All prefix commands removed - only slash commands are supported now

// All prefix commands removed - only slash commands are supported now

export const slashes: SlashCommand[] = [slashShop, slashBuy, slashSell];
