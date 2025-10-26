import { REST, Routes, SlashCommandBuilder } from 'discord.js';
import { getEnv } from '../lib/env.js';

const env = getEnv();

const commands = [
  // Economy Commands
  new SlashCommandBuilder()
    .setName('work')
    .setDescription('Làm việc kiếm V (60 phút cooldown)'),
  
  new SlashCommandBuilder()
    .setName('daily')
    .setDescription('Nhận thưởng hàng ngày'),
  
  new SlashCommandBuilder()
    .setName('weekly')
    .setDescription('Nhận thưởng hàng tuần'),
  
  new SlashCommandBuilder()
    .setName('cash')
    .setDescription('Xem số dư V'),
  
  new SlashCommandBuilder()
    .setName('profile')
    .setDescription('Xem profile cá nhân'),
  
  new SlashCommandBuilder()
    .setName('give')
    .setDescription('Chuyển V cho người khác')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('Người nhận')
        .setRequired(true))
    .addIntegerOption(option =>
      option.setName('amount')
        .setDescription('Số V muốn chuyển')
        .setRequired(true)
        .setMinValue(1)),
  
  new SlashCommandBuilder()
    .setName('bet')
    .setDescription('Cá cược V')
    .addIntegerOption(option =>
      option.setName('amount')
        .setDescription('Số V muốn cược')
        .setRequired(true)
        .setMinValue(1)),
  
  new SlashCommandBuilder()
    .setName('inventory')
    .setDescription('Xem túi đồ'),
  
  new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('Bảng xếp hạng'),

  // Hunt Commands
  new SlashCommandBuilder()
    .setName('hunt')
    .setDescription('Săn quái thần thoại')
    .addSubcommand(subcommand =>
      subcommand
        .setName('start')
        .setDescription('Bắt đầu săn quái'))
    .addSubcommand(subcommand =>
      subcommand
        .setName('equip')
        .setDescription('Trang bị vũ khí')
        .addStringOption(option =>
          option.setName('weapon')
            .setDescription('Tên vũ khí')
            .setRequired(true)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('inventory')
        .setDescription('Xem đồ săn quái'))
    .addSubcommand(subcommand =>
      subcommand
        .setName('use')
        .setDescription('Dùng bùa phép')
        .addStringOption(option =>
          option.setName('item')
            .setDescription('Tên bùa phép')
            .setRequired(true))),

  // Hatch Commands
  new SlashCommandBuilder()
    .setName('hatch')
    .setDescription('Trại ấp trứng thần thú')
    .addSubcommand(subcommand =>
      subcommand
        .setName('status')
        .setDescription('Xem trạng thái trại'))
    .addSubcommand(subcommand =>
      subcommand
        .setName('place')
        .setDescription('Đặt trứng vào trại')
        .addStringOption(option =>
          option.setName('egg')
            .setDescription('Loại trứng')
            .setRequired(true)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('collect')
        .setDescription('Thu hoạch thần thú'))
    .addSubcommand(subcommand =>
      subcommand
        .setName('upgrade')
        .setDescription('Nâng cấp trại')),

  // Dungeon Commands
  new SlashCommandBuilder()
    .setName('dungeon')
    .setDescription('Tam Giới Ải Đấu')
    .addSubcommand(subcommand =>
      subcommand
        .setName('status')
        .setDescription('Xem trạng thái các ải'))
    .addSubcommand(subcommand =>
      subcommand
        .setName('enter')
        .setDescription('Vào ải')
        .addStringOption(option =>
          option.setName('tier')
            .setDescription('Cõi muốn vào')
            .setRequired(true)
            .addChoices(
              { name: 'Nhân Giới', value: 'nhan' },
              { name: 'Thiên Giới', value: 'thien' },
              { name: 'Ma Giới', value: 'ma' }
            )))
    .addSubcommand(subcommand =>
      subcommand
        .setName('stats')
        .setDescription('Thống kê cá nhân'))
    .addSubcommand(subcommand =>
      subcommand
        .setName('equip')
        .setDescription('Trang bị phù chú')
        .addStringOption(option =>
          option.setName('gear')
            .setDescription('Tên phù chú')
            .setRequired(true)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('inventory')
        .setDescription('Xem đồ đi ải')),

  // Guild Commands
  new SlashCommandBuilder()
    .setName('guild')
    .setDescription('Guild - Hội thần thoại')
    .addSubcommand(subcommand =>
      subcommand
        .setName('create')
        .setDescription('Tạo guild')
        .addStringOption(option =>
          option.setName('name')
            .setDescription('Tên guild')
            .setRequired(true)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('add')
        .setDescription('Thêm thành viên')
        .addUserOption(option =>
          option.setName('user')
            .setDescription('Người muốn thêm')
            .setRequired(true)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('remove')
        .setDescription('Xóa thành viên')
        .addUserOption(option =>
          option.setName('user')
            .setDescription('Người muốn xóa')
            .setRequired(true)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('list')
        .setDescription('Danh sách guild'))
    .addSubcommand(subcommand =>
      subcommand
        .setName('info')
        .setDescription('Thông tin guild'))
    .addSubcommand(subcommand =>
      subcommand
        .setName('donate')
        .setDescription('Đóng góp V vào guild')
        .addIntegerOption(option =>
          option.setName('amount')
            .setDescription('Số V muốn đóng góp')
            .setRequired(true)
            .setMinValue(1)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('upgrade')
        .setDescription('Nâng hạng guild'))
    .addSubcommand(subcommand =>
      subcommand
        .setName('fire')
        .setDescription('Đốt lửa trại guild')),

  // Shop Commands
  new SlashCommandBuilder()
    .setName('shop')
    .setDescription('Cửa hàng VIE')
    .addSubcommand(subcommand =>
      subcommand
        .setName('view')
        .setDescription('Xem cửa hàng')
        .addStringOption(option =>
          option.setName('category')
            .setDescription('Danh mục')
            .setRequired(false)
            .addChoices(
              { name: 'Trứng Thần', value: 'eggs' },
              { name: 'Binh Khí', value: 'weapons' },
              { name: 'Phù Chú', value: 'dungeon_gear' },
              { name: 'Chức Nghiệp', value: 'roles' }
            ))),
  
  new SlashCommandBuilder()
    .setName('buy')
    .setDescription('Mua đồ')
    .addStringOption(option =>
      option.setName('item')
        .setDescription('Tên item')
        .setRequired(true))
    .addIntegerOption(option =>
      option.setName('quantity')
        .setDescription('Số lượng')
        .setRequired(false)
        .setMinValue(1)
        .setMaxValue(100)),
  
  new SlashCommandBuilder()
    .setName('sell')
    .setDescription('Bán đồ')
    .addStringOption(option =>
      option.setName('item')
        .setDescription('Tên item')
        .setRequired(true))
    .addIntegerOption(option =>
      option.setName('quantity')
        .setDescription('Số lượng')
        .setRequired(false)
        .setMinValue(1)
        .setMaxValue(100)),

  // Entertainment Commands
  new SlashCommandBuilder()
    .setName('blackjack')
    .setDescription('Chơi blackjack')
    .addIntegerOption(option =>
      option.setName('amount')
        .setDescription('Số V muốn cược')
        .setRequired(true)
        .setMinValue(1)),
  
  new SlashCommandBuilder()
    .setName('baucua')
    .setDescription('Chơi bầu cua')
    .addIntegerOption(option =>
      option.setName('amount')
        .setDescription('Số V muốn cược')
        .setRequired(true)
        .setMinValue(1))
    .addStringOption(option =>
      option.setName('choice')
        .setDescription('Con muốn chọn')
        .setRequired(true)
        .addChoices(
          { name: 'Cua', value: 'cua' },
          { name: 'Bầu', value: 'bau' },
          { name: 'Tôm', value: 'tom' },
          { name: 'Cá', value: 'ca' },
          { name: 'Gà', value: 'ga' },
          { name: 'Nai', value: 'nai' }
        )),
  
  new SlashCommandBuilder()
    .setName('xocdia')
    .setDescription('Chơi xóc đĩa')
    .addIntegerOption(option =>
      option.setName('amount')
        .setDescription('Số V muốn cược')
        .setRequired(true)
        .setMinValue(1))
    .addStringOption(option =>
      option.setName('choice')
        .setDescription('Chẵn hay lẻ')
        .setRequired(true)
        .addChoices(
          { name: 'Chẵn', value: 'chan' },
          { name: 'Lẻ', value: 'le' }
        )),

  // Basic Commands
  
  new SlashCommandBuilder()
    .setName('info')
    .setDescription('Thông tin bot VIE'),

  // Giveaway Commands
  new SlashCommandBuilder()
    .setName('giveaway')
    .setDescription('Giveaway - Quà tặng')
    .addSubcommand(subcommand =>
      subcommand
        .setName('start')
        .setDescription('Tạo giveaway')
        .addStringOption(option =>
          option.setName('prize')
            .setDescription('Phần thưởng')
            .setRequired(true))
        .addIntegerOption(option =>
          option.setName('duration')
            .setDescription('Thời gian (phút)')
            .setRequired(true)
            .setMinValue(1)
            .setMaxValue(10080))
        .addIntegerOption(option =>
          option.setName('winners')
            .setDescription('Số người thắng')
            .setRequired(true)
            .setMinValue(1)
            .setMaxValue(10)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('end')
        .setDescription('Kết thúc giveaway')
        .addStringOption(option =>
          option.setName('message_id')
            .setDescription('ID tin nhắn giveaway')
            .setRequired(true)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('reroll')
        .setDescription('Quay lại giveaway')
        .addStringOption(option =>
          option.setName('message_id')
            .setDescription('ID tin nhắn giveaway')
            .setRequired(true))),

  // Flash Commands
  new SlashCommandBuilder()
    .setName('flash')
    .setDescription('Flash Sale - Bán chớp nhoáng')
    .addStringOption(option =>
      option.setName('item')
        .setDescription('Tên item')
        .setRequired(true))
    .addIntegerOption(option =>
      option.setName('price')
        .setDescription('Giá bán')
        .setRequired(true)
        .setMinValue(1))
    .addIntegerOption(option =>
      option.setName('quantity')
        .setDescription('Số lượng')
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(100))
    .addIntegerOption(option =>
      option.setName('duration')
        .setDescription('Thời gian (phút)')
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(60))
];

const rest = new REST().setToken(env.DISCORD_TOKEN);

(async () => {
  try {
    console.log(`Started refreshing ${commands.length} application (/) commands.`);

    const data = await rest.put(
      Routes.applicationCommands(env.DISCORD_CLIENT_ID),
      { body: commands },
    );

    console.log(`Successfully reloaded ${data.length} application (/) commands.`);
  } catch (error) {
    console.error(error);
  }
})();
