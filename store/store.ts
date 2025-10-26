import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import path from 'node:path';

type UserProfile = {
  userId: string;
  balance: number;
  daily: { last: number | null; streak: number };
  lastDaily: string;
  dailyStreak: number;
  inventory: Record<string, number>; // woodId -> kg
  quests: { desc: string; reward: number; done: boolean }[];
  xp: number;
  level: number;
  cooldowns: {
    work: number | null;
    hunt: number | null;
    fish: number | null;
    daily: number | null;
    weekly: number | null;
    dungeon_nhan: number | null;
    dungeon_thien: number | null;
    dungeon_ma: number | null;
  };
  categorizedInventory: {
    eggs: Record<string, number>;        // rong_xanh_egg, phuong_hoang_egg, etc.
    pets: Record<string, number>;       // rong_xanh_pet, phuong_hoang_pet, etc.
    weapons: Record<string, number>;    // kiem_go, kiem_sat, etc.
    monsterItems: Record<string, number>;  // linh_hon_yeu_tinh, linh_hon_ho_ly, etc.
    dungeonGear: Record<string, number>; // phu_chu_tre, bua_ho_menh, etc.
    dungeonLoot: Record<string, number>; // ngoc_linh, buff_items, etc.
    misc: Record<string, number>;       // rương thần bí, rác, etc.
  };
  equippedItems: {
    weapon: string | null;
    phuChu: string | null;
    linhDan: string | null;
  };
  hatchery: {
    level: number;
    plantedEgg: {
      type: string | null;
      plantedAt: number | null;
      harvestAt: number | null;
    };
  };
  dungeonStats?: {
    totalClears: number;
    successRate: number;
    totalEarned: number;
    eggsCollected: number;
    soulsCollected: number;
    ngocLinhCollected: number;
  };
};

type DB = {
  users: Record<string, UserProfile>;
  guilds: Record<string, Guild>;
};

type Guild = {
  name: string;
  ownerId: string;
  roleId: string | null;
  members: string[];
  inventory: Record<string, number>; // itemId -> quantity (kho guild)
  fire: { until: number | null };
  quests: { desc: string; reward: number; done: boolean }[];
  daily: { day: number | null; completed: string[] };
  guildRank: {
    level: number;        // Hạng guild (1-5)
    funds: number;        // Quỹ hiện tại
    totalContributed: number; // Tổng đã đóng góp
    contributors: Record<string, number>; // userId -> số tiền đã donate
  };
};

let singleton: Store | null = null;

export function getStore(): Store {
  if (!singleton) singleton = new Store();
  return singleton;
}

export class Store {
  private file: string;
  private db: DB;

  constructor() {
    const dir = path.join(process.cwd(), 'data');
    if (!existsSync(dir)) mkdirSync(dir);
    this.file = path.join(dir, 'db.json');
    this.db = { users: {}, guilds: {} };
    this.load();
  }

  private load(): void {
    try {
      const raw = readFileSync(this.file, 'utf8');
      this.db = JSON.parse(raw) as DB;
    } catch {
      this.save();
    }
  }

  save(): void {
    writeFileSync(this.file, JSON.stringify(this.db, null, 2), 'utf8');
  }

  getAllUsers(): UserProfile[] {
    return Object.values(this.db.users);
  }

  getUser(userId: string): UserProfile {
    if (!this.db.users[userId]) {
      this.db.users[userId] = {
        userId,
        balance: 0,
        daily: { last: null, streak: 0 },
        lastDaily: '',
        dailyStreak: 0,
        inventory: {},
        quests: this.generateQuests(),
        xp: 0,
        level: 1,
        cooldowns: {
          work: null,
          hunt: null,
          fish: null,
          daily: null,
          weekly: null,
          dungeon_nhan: null,
          dungeon_thien: null,
          dungeon_ma: null
        },
        categorizedInventory: {
          eggs: {},
          pets: {},
          weapons: {},
          monsterItems: {},
          dungeonGear: {},
          dungeonLoot: {},
          misc: {}
        },
        equippedItems: {
          weapon: null,
          phuChu: null,
          linhDan: null
        },
        hatchery: {
          level: 1,
          plantedEgg: {
            type: null,
            plantedAt: null,
            harvestAt: null
          }
        }
      };
      this.save();
    }
    
    // MIGRATION: Fix old users missing new fields
    const user = this.db.users[userId];
    let needsSave = false;
    
    // Add missing lastDaily and dailyStreak
    if (user.lastDaily === undefined) {
      user.lastDaily = '';
      needsSave = true;
    }
    if (user.dailyStreak === undefined) {
      user.dailyStreak = 0;
      needsSave = true;
    }
    
    // Add missing cooldowns.daily
    if (user.cooldowns && user.cooldowns.daily === undefined) {
      user.cooldowns.daily = null;
      needsSave = true;
    }
    
    // Ensure cooldowns exists
    if (!user.cooldowns) {
      user.cooldowns = {
        work: null,
        hunt: null,
        fish: null,
        daily: null,
        weekly: null,
        dungeon_nhan: null,
        dungeon_thien: null,
        dungeon_ma: null
      };
      needsSave = true;
    }
    
    // Ensure categorizedInventory exists
    if (!user.categorizedInventory) {
      user.categorizedInventory = {
        eggs: {},
        pets: {},
        weapons: {},
        monsterItems: {},
        dungeonGear: {},
        dungeonLoot: {},
        misc: {}
      };
      needsSave = true;
    }
    
    // Ensure equippedItems exists
    if (!user.equippedItems) {
      user.equippedItems = {
        weapon: null,
        phuChu: null,
        linhDan: null
      };
      needsSave = true;
    }
    
    // Ensure hatchery exists
    if (!user.hatchery) {
      user.hatchery = {
        level: 1,
        plantedEgg: {
          type: null,
          plantedAt: null,
          harvestAt: null
        }
      };
      needsSave = true;
    }
    
    // Ensure guilds exists in DB
    if (!this.db.guilds) {
      this.db.guilds = {};
      needsSave = true;
    }
    
    if (needsSave) {
      this.save();
    }
    
    return user;
  }

  getTopBalances(limit: number): { userId: string; balance: number }[] {
    return Object.values(this.db.users)
      .sort((a, b) => b.balance - a.balance)
      .slice(0, limit)
      .map((u) => ({ userId: u.userId, balance: u.balance }));
  }

  getInventory(userId: string): Record<string, number> {
    return this.getUser(userId).inventory;
  }

  // Daily reward with VN time (GMT+7)
  claimDaily(userId: string): { amount: number; message: string } {
    const u = this.getUser(userId);
    const now = Date.now();
    const vnNow = now + 7 * 60 * 60 * 1000; // shift to GMT+7
    const day = Math.floor(vnNow / 86400000); // days since epoch at GMT+7
    const lastDay = u.daily.last === null ? null : Math.floor((u.daily.last + 7 * 3600000) / 86400000);

    if (lastDay === day) {
      return { amount: 0, message: 'Hôm nay bạn đã điểm danh rồi.' };
    }

    // streak logic
    if (lastDay !== null && lastDay === day - 1) {
      u.daily.streak += 1;
    } else {
      u.daily.streak = 1;
    }
    u.daily.last = now;

    let reward = 100; // Base reward 100 V
    if (u.daily.streak === 2) reward = 200;
    else if (u.daily.streak === 3) reward = 300;
    else if (u.daily.streak > 7) reward = Math.floor(700 + Math.random() * (1999 - 700 + 1));
    // else default 100

    // Áp dụng guild rank buff
    const userGuild = this.getUserGuild(userId);
    if (userGuild) {
      const buffs = this.getGuildRankBuffs(userGuild.guildRank.level);
      const bonus = Math.floor(reward * buffs.incomeBonus / 100);
      reward += bonus;
    }

    u.balance += reward;
    
    // Cộng XP cho daily
    const xpResult = this.addXP(userId, 25);
    this.save();
    
    let message = `Điểm danh thành công! +${reward} V. Streak: ${u.daily.streak}.`;
    if (userGuild) {
      const buffs = this.getGuildRankBuffs(userGuild.guildRank.level);
      message += `\n🏆 Guild Hạng ${userGuild.guildRank.level} bonus: +${buffs.incomeBonus}%`;
    }
    message += `\n${xpResult.message}`;
    
    return { amount: reward, message };
  }

  // Quests
  generateQuests(): { desc: string; reward: number; done: boolean }[] {
    const pool = [
      { desc: 'Chat 50 tin nhắn', reward: 200 },
      { desc: 'Dùng lệnh bất kỳ 5 lần', reward: 150 },
      { desc: 'Đề cập 3 người', reward: 120 },
      { desc: 'Tham gia voice 10 phút', reward: 300 },
      { desc: 'Gửi 1 ảnh', reward: 100 }
    ];
    const pick = () => pool[Math.floor(Math.random() * pool.length)];
    return [pick(), pick(), pick()].map((q) => ({ ...q, done: false }));
  }

  getDailyQuests(userId: string): { desc: string; reward: number; done: boolean }[] {
    const u = this.getUser(userId);
    // reset by VN day
    const now = Date.now();
    const vnDay = Math.floor((now + 7 * 3600000) / 86400000);
    const last = u.daily.last ? Math.floor((u.daily.last + 7 * 3600000) / 86400000) : null;
    if (last !== vnDay) {
      // regenerate quests daily independently of daily claim
      u.quests = this.generateQuests();
      this.save();
    }
    return u.quests;
  }

  refreshDailyQuests(userId: string): void {
    const u = this.getUser(userId);
    u.quests = this.generateQuests();
    this.save();
  }

  // ====== CLUB (CLUB) ======
  ensureGuild(name: string): Guild {
    if (!this.db.guilds[name]) {
      this.db.guilds[name] = {
        name,
        ownerId: '',
        roleId: null,
        members: [],
        inventory: {},
        fire: { until: null },
        quests: this.generateQuests(),
        daily: { day: null, completed: [] },
        guildRank: {
          level: 1,
          funds: 0,
          totalContributed: 0,
          contributors: {}
        }
      };
      this.save();
    }
    return this.db.guilds[name];
  }

  setGuildOwner(name: string, ownerId: string, roleId: string | null): Guild {
    const g = this.ensureGuild(name);
    g.ownerId = ownerId;
    g.roleId = roleId;
    if (!g.members.includes(ownerId)) g.members.push(ownerId);
    this.save();
    return g;
  }

  addGuildMember(name: string, userId: string): Guild {
    const g = this.ensureGuild(name);
    if (!g.members.includes(userId)) g.members.push(userId);
    this.save();
    return g;
  }

  removeGuildMember(name: string, userId: string): Guild {
    const g = this.ensureGuild(name);
    g.members = g.members.filter((m) => m !== userId);
    this.save();
    return g;
  }

  getUserGuild(userId: string): Guild | null {
    return Object.values(this.db.guilds).find((g) => g.members.includes(userId)) ?? null;
  }

  getGuildInventory(name: string): Record<string, number> {
    return this.ensureGuild(name).inventory;
  }

  addItemToGuild(name: string, itemId: string, quantity: number): void {
    const inv = this.ensureGuild(name).inventory;
    inv[itemId] = (inv[itemId] ?? 0) + Math.max(0, Math.floor(quantity));
    this.save();
  }

  // Fire handling
  getGuildFire(name: string): { until: number | null } {
    return this.ensureGuild(name).fire;
  }

  startGuildFire(name: string, minutes: number): void {
    const g = this.ensureGuild(name);
    const now = Date.now();
    g.fire.until = now + minutes * 60000;
    this.save();
  }

  // Club quests/daily
  getGuildQuests(name: string): { desc: string; reward: number; done: boolean }[] {
    return this.ensureGuild(name).quests;
  }

  refreshGuildQuests(name: string): void {
    const g = this.ensureGuild(name);
    g.quests = this.generateQuests();
    this.save();
  }

  markGuildDaily(name: string, userId: string): { completedAll: boolean; message: string } {
    const g = this.ensureGuild(name);
    const vnDay = Math.floor((Date.now() + 7 * 3600000) / 86400000);
    if (g.daily.day !== vnDay) {
      g.daily.day = vnDay;
      g.daily.completed = [];
    }
    if (!g.daily.completed.includes(userId)) g.daily.completed.push(userId);
    const completedAll = g.members.length > 0 && g.daily.completed.length === g.members.length;
    this.save();
    return { completedAll, message: `Đã điểm danh guild: ${g.daily.completed.length}/${g.members.length}` };
  }

  // ====== GUILD RANK SYSTEM ======
  contributeToGuild(guildName: string, userId: string, amount: number): { success: boolean; message: string; upgraded: boolean } {
    const user = this.getUser(userId);
    if (user.balance < amount) {
      return { success: false, message: 'Không đủ tiền để đóng góp.', upgraded: false };
    }
    
    const guild = this.ensureGuild(guildName);
    if (!guild.members.includes(userId)) {
      return { success: false, message: 'Bạn không phải hội viên của guild này.', upgraded: false };
    }

    // Trừ tiền user và thêm vào quỹ guild
    user.balance -= amount;
    guild.guildRank.funds += amount;
    guild.guildRank.totalContributed += amount;
    guild.guildRank.contributors[userId] = (guild.guildRank.contributors[userId] || 0) + amount;

    // Kiểm tra auto-upgrade
    const upgraded = this.upgradeGuildRank(guildName);
    this.save();
    
    return { 
      success: true, 
      message: `Đã đóng góp ${amount} V vào quỹ guild. Quỹ hiện tại: ${guild.guildRank.funds} V.`,
      upgraded 
    };
  }

  upgradeGuildRank(guildName: string): boolean {
    const guild = this.ensureGuild(guildName);
    const currentLevel = guild.guildRank.level;
    const requiredFunds = this.getGuildRankUpgradeCost(currentLevel + 1);
    
    if (guild.guildRank.funds >= requiredFunds && currentLevel < 5) {
      guild.guildRank.level += 1;
      guild.guildRank.funds -= requiredFunds;
      return true;
    }
    return false;
  }

  getGuildRankUpgradeCost(level: number): number {
    const costs = [0, 10000, 100000, 1000000, 10000000, 100000000]; // Level 0-5
    return costs[level] || 0;
  }

  // ====== XP & LEVEL SYSTEM ======
  addXP(userId: string, amount: number): { leveledUp: boolean; newLevel: number; message: string } {
    const user = this.getUser(userId);
    user.xp += amount;
    
    const oldLevel = user.level;
    const newLevel = Math.max(1, Math.floor(Math.sqrt(user.xp / 100)));
    const leveledUp = newLevel > oldLevel;
    
    if (leveledUp) {
      user.level = newLevel;
      this.save();
      return {
        leveledUp: true,
        newLevel,
        message: `🎉 Level up! Bạn đã lên level ${newLevel}! (+${amount} XP)`
      };
    }
    
    this.save();
    return {
      leveledUp: false,
      newLevel: oldLevel,
      message: `+${amount} XP (${user.xp}/${Math.pow(newLevel + 1, 2) * 100} để lên level ${newLevel + 1})`
    };
  }

  // ====== COOLDOWN SYSTEM ======
  checkCooldown(userId: string, type: 'work' | 'hunt' | 'fish' | 'daily' | 'weekly' | 'dungeon_nhan' | 'dungeon_thien' | 'dungeon_ma'): { canUse: boolean; remainingMinutes: number } {
    const user = this.getUser(userId);
    const cooldownTime = user.cooldowns[type];
    
    if (!cooldownTime) {
      return { canUse: true, remainingMinutes: 0 };
    }
    
    const now = Date.now();
    const remainingMs = cooldownTime - now;
    
    if (remainingMs <= 0) {
      user.cooldowns[type] = null;
      this.save();
      return { canUse: true, remainingMinutes: 0 };
    }
    
    return { canUse: false, remainingMinutes: Math.ceil(remainingMs / 60000) };
  }

  setCooldown(userId: string, type: 'work' | 'hunt' | 'fish' | 'daily' | 'weekly' | 'dungeon_nhan' | 'dungeon_thien' | 'dungeon_ma', baseMinutes: number): void {
    const user = this.getUser(userId);
    
    // Áp dụng guild rank buff
    const userGuild = this.getUserGuild(userId);
    let actualMinutes = baseMinutes;
    
    if (userGuild) {
      const buffs = this.getGuildRankBuffs(userGuild.guildRank.level);
      actualMinutes = Math.max(1, Math.floor(baseMinutes * (1 - buffs.cooldownReduction / 100)));
    }
    
    user.cooldowns[type] = Date.now() + (actualMinutes * 60000);
    this.save();
  }

  // ====== INVENTORY SYSTEM ======
  addItemToInventory(userId: string, category: keyof UserProfile['categorizedInventory'], itemId: string, quantity: number): void {
    const user = this.getUser(userId);
    user.categorizedInventory[category][itemId] = (user.categorizedInventory[category][itemId] || 0) + quantity;
    this.save();
  }

  removeItemFromInventory(userId: string, category: keyof UserProfile['categorizedInventory'], itemId: string, quantity: number): boolean {
    const user = this.getUser(userId);
    const currentAmount = user.categorizedInventory[category][itemId] || 0;
    
    if (currentAmount < quantity) {
      return false;
    }
    
    user.categorizedInventory[category][itemId] = currentAmount - quantity;
    if (user.categorizedInventory[category][itemId] <= 0) {
      delete user.categorizedInventory[category][itemId];
    }
    this.save();
    return true;
  }

  getItemQuantity(userId: string, category: keyof UserProfile['categorizedInventory'], itemId: string): number {
    const user = this.getUser(userId);
    return user.categorizedInventory[category][itemId] || 0;
  }

  // ====== EQUIPMENT SYSTEM ======
  equipItem(userId: string, slot: 'weapon' | 'phuChu' | 'linhDan', itemId: string): { success: boolean; message: string } {
    const user = this.getUser(userId);
    
    // Kiểm tra có item trong inventory không
    const category = slot === 'weapon' ? 'weapons' : slot === 'phuChu' ? 'dungeonGear' : 'dungeonGear';
    if (this.getItemQuantity(userId, category, itemId) <= 0) {
      return { success: false, message: 'Bạn không có item này trong túi đồ.' };
    }
    
    user.equippedItems[slot] = itemId;
    this.save();
    return { success: true, message: `Đã trang bị ${itemId}.` };
  }

  // ====== HATCHERY SYSTEM ======
  plantEgg(userId: string, eggType: string): { success: boolean; message: string } {
    const user = this.getUser(userId);
    
    // Kiểm tra hatchery level
    const gameConfig = JSON.parse(readFileSync(path.join(process.cwd(), 'data/game_config.json'), 'utf8'));
    const eggConfig = gameConfig.eggs[eggType];
    
    if (!eggConfig) {
      return { success: false, message: 'Loại trứng không hợp lệ.' };
    }
    
    if (user.hatchery.level < eggConfig.levelRequired) {
      return { success: false, message: `Cần trại level ${eggConfig.levelRequired} để ấp ${eggConfig.name}.` };
    }
    
    // Kiểm tra đã ấp trứng chưa
    if (user.hatchery.plantedEgg.type) {
      return { success: false, message: 'Đã có trứng đang ấp. Hãy thu hoạch trước.' };
    }
    
    // Kiểm tra có trứng
    const eggId = `${eggType}_egg`;
    if (this.getItemQuantity(userId, 'eggs', eggId) <= 0) {
      return { success: false, message: `Không có trứng ${eggConfig.name}.` };
    }
    
    // Ấp trứng
    this.removeItemFromInventory(userId, 'eggs', eggId, 1);
    
    const now = Date.now();
    const growTimeMs = eggConfig.growTime * 60000; // Convert minutes to ms
    
    // Áp dụng guild rank buff
    const userGuild = this.getUserGuild(userId);
    let actualGrowTime = growTimeMs;
    if (userGuild) {
      const buffs = this.getGuildRankBuffs(userGuild.guildRank.level);
      actualGrowTime = Math.max(60000, Math.floor(growTimeMs * (1 - buffs.cooldownReduction / 100)));
    }
    
    user.hatchery.plantedEgg = {
      type: eggType,
      plantedAt: now,
      harvestAt: now + actualGrowTime
    };
    
    this.save();
    return { success: true, message: `Đã ấp ${eggConfig.name}. Thu hoạch sau ${Math.ceil(actualGrowTime / 60000)} phút.` };
  }

  hatchEgg(userId: string): { success: boolean; message: string; reward: number; kg: number } {
    const user = this.getUser(userId);
    
    if (!user.hatchery.plantedEgg.type) {
      return { success: false, message: 'Không có trứng nào để thu hoạch.', reward: 0, kg: 0 };
    }
    
    const now = Date.now();
    if (now < user.hatchery.plantedEgg.harvestAt!) {
      const remainingMs = user.hatchery.plantedEgg.harvestAt! - now;
      return { success: false, message: `Trứng chưa nở. Còn ${Math.ceil(remainingMs / 60000)} phút.`, reward: 0, kg: 0 };
    }
    
    const gameConfig = JSON.parse(readFileSync(path.join(process.cwd(), 'data/game_config.json'), 'utf8'));
    const eggConfig = gameConfig.eggs[user.hatchery.plantedEgg.type];
    
    // Random KG từ 0.1 - 100 KG
    const kg = Math.round((0.1 + Math.random() * 99.9) * 10) / 10; // Làm tròn 1 chữ số thập phân
    
    // Tính reward với bonus 10-30%
    const bonusPercent = 10 + Math.random() * 20; // 10-30%
    const reward = Math.floor(eggConfig.baseReward * (1 + bonusPercent / 100));
    
    // Thêm reward vào balance và inventory
    user.balance += reward;
    this.addItemToInventory(userId, 'pets', user.hatchery.plantedEgg.type, 1);
    
    // Reset hatchery
    user.hatchery.plantedEgg = {
      type: null,
      plantedAt: null,
      harvestAt: null
    };
    
    this.save();
    return { success: true, message: `Ấp trứng thành công! +${reward} V (+${Math.floor(bonusPercent)}% bonus). Thu được ${kg} KG ${eggConfig.name}.`, reward, kg };
  }

  upgradeHatchery(userId: string): { success: boolean; message: string } {
    const user = this.getUser(userId);
    const gameConfig = JSON.parse(readFileSync(path.join(process.cwd(), 'data/game_config.json'), 'utf8'));
    const nextLevel = user.hatchery.level + 1;
    const cost = gameConfig.hatchery_upgrade_costs[nextLevel.toString()];
    
    if (!cost) {
      return { success: false, message: 'Trại đã đạt level tối đa.' };
    }
    
    if (user.balance < cost) {
      return { success: false, message: `Không đủ ${cost} V để nâng cấp trại ấp trứng.` };
    }
    
    user.balance -= cost;
    user.hatchery.level = nextLevel;
    this.save();
    
    return { success: true, message: `Đã nâng cấp trại lên level ${nextLevel}!` };
  }

  getGuildRankBuffs(level: number): { memberSlots: number; incomeBonus: number; cooldownReduction: number; xpBonus: number } {
    return {
      memberSlots: 5 + (level - 1) * 2, // Level 1 = 5, Level 2 = 7, Level 3 = 9, etc.
      incomeBonus: (level - 1) * 5, // +5% per level
      cooldownReduction: (level - 1) * 5, // -5% per level
      xpBonus: (level - 1) * 10 // +10% per level
    };
  }


  // ====== DUNGEON SYSTEM ======
  enterDungeon(userId: string, tier: string): { success: boolean; message: string; rewards?: string } {
    const user = this.getUser(userId);
    const gameConfig = JSON.parse(readFileSync(path.join(process.cwd(), 'data/game_config.json'), 'utf8'));
    
    const tierConfig = gameConfig.dungeon_tiers[`${tier}_gioi`];
    if (!tierConfig) {
      return { success: false, message: 'Cõi không hợp lệ.' };
    }
    
    // Kiểm tra yêu cầu và tiêu hao items
    if (tierConfig.requirements.includes('bua_ho_menh')) {
      if (!this.getItemQuantity(userId, 'dungeonGear', 'bua_ho_menh')) {
        return { success: false, message: 'Cần 1 Bùa Hộ Mệnh để vào Thiên Giới.' };
      }
      this.removeItemFromInventory(userId, 'dungeonGear', 'bua_ho_menh', 1);
    }
    
    if (tierConfig.requirements.includes('linh_dan_cao_cap')) {
      if (!this.getItemQuantity(userId, 'dungeonGear', 'linh_dan_cao_cap')) {
        return { success: false, message: 'Cần 1 Linh Đan Cấp Cao để vào Ma Giới.' };
      }
      this.removeItemFromInventory(userId, 'dungeonGear', 'linh_dan_cao_cap', 1);
    }
    
    // Thực hiện ải (5 tầng)
    const success = Math.random() * 100 < tierConfig.successRate;
    
    if (!success) {
      return { success: true, message: `Thất bại ở tầng ${Math.floor(Math.random() * 5) + 1}. Hãy thử lại sau!` };
    }
    
    // Tính phần thưởng
    const rewards = [];
    let totalV = 0;
    
    // V coin
    const vReward = tierConfig.rewards.v_coin.min + Math.floor(Math.random() * (tierConfig.rewards.v_coin.max - tierConfig.rewards.v_coin.min + 1));
    user.balance += vReward;
    totalV += vReward;
    rewards.push(`💰 +${vReward} V`);
    
    // Ngọc Linh
    const ngocLinh = tierConfig.rewards.ngoc_linh.min + Math.floor(Math.random() * (tierConfig.rewards.ngoc_linh.max - tierConfig.rewards.ngoc_linh.min + 1));
    if (ngocLinh > 0) {
      this.addItemToInventory(userId, 'dungeonLoot', 'ngoc_linh', ngocLinh);
      rewards.push(`💎 +${ngocLinh} Ngọc Linh`);
    }
    
    // Trứng thần thú
    if (Math.random() * 100 < tierConfig.rewards.eggs_low) {
      const eggTypes = ['rong_xanh', 'phuong_hoang', 'ky_lan', 'bach_ho', 'huyen_vu'];
      const randomEgg = eggTypes[Math.floor(Math.random() * eggTypes.length)];
      this.addItemToInventory(userId, 'eggs', `${randomEgg}_egg`, 1);
      rewards.push(`🥚 +1 Trứng ${randomEgg}`);
    }
    
    // Linh hồn quái
    if (Math.random() * 100 < tierConfig.rewards.monster_souls_low) {
      const soulTypes = ['yeu_tinh', 'tinh_ho_ly', 'ma_rung', 'linh_duong', 'ho_than', 'gau_tinh'];
      const randomSoul = soulTypes[Math.floor(Math.random() * soulTypes.length)];
      this.addItemToInventory(userId, 'monsterItems', `linh_hon_${randomSoul}`, 1);
      rewards.push(`👻 +1 Linh hồn ${randomSoul}`);
    }
    
    // Vũ khí/Phù chú
    if (Math.random() * 100 < tierConfig.rewards.equipment) {
      const equipmentTypes = ['phu_chu_tre', 'phu_chu_sat', 'phu_chu_bac', 'phu_chu_vang', 'phu_chu_kim_cuong'];
      const randomEquip = equipmentTypes[Math.floor(Math.random() * equipmentTypes.length)];
      this.addItemToInventory(userId, 'dungeonGear', randomEquip, 1);
      rewards.push(`⚔️ +1 ${randomEquip}`);
    }
    
    // 🏆 THẦN KHÍ SIÊU HIẾM - Dép Tổ Ong (chỉ từ Ma Giới)
    if (tier === 'ma' && Math.random() * 100 < tierConfig.rewards.dep_to_ong) {
      this.addItemToInventory(userId, 'weapons', 'dep_to_ong', 1);
      rewards.push(`🏆 +1 DÉP TỔ ONG - THẦN KHÍ SIÊU HIẾM!`);
    }
    
    // Cập nhật stats
    if (!user.dungeonStats) {
      user.dungeonStats = {
        totalClears: 0,
        successRate: 0,
        totalEarned: 0,
        eggsCollected: 0,
        soulsCollected: 0,
        ngocLinhCollected: 0
      };
    }
    
    user.dungeonStats.totalClears += 1;
    user.dungeonStats.totalEarned += totalV;
    user.dungeonStats.successRate = Math.round((user.dungeonStats.successRate * (user.dungeonStats.totalClears - 1) + 100) / user.dungeonStats.totalClears);
    
    this.save();
    
    return { 
      success: true, 
      message: `🎉 Chinh phục thành công ${tierConfig.name}! Hoàn thành 5 tầng.`,
      rewards: rewards.join('\n')
    };
  }

}


