# Discord Bot "VIE" - MMORPG Thần Thoại Việt Nam

Một Discord bot MMORPG với theme thần thoại Việt Nam, hệ thống kinh tế V, ấp trứng, săn quái, đi ải và cửa hàng đa dạng.

## ✨ Tính Năng Chính

### 💰 Hệ Thống Kinh Tế (ECONOMY)
- **Làm việc** kiếm tiền với cooldown 1 giờ (100-999 V + level bonus)
- **Quà hàng ngày** với streak bonus (100 V + streak bonus)
- **Quà hàng tuần** với phần thưởng lớn
- **Chuyển tiền** giữa người dùng
- **Bảng xếp hạng** top 10 người giàu nhất
- **Hệ thống level** dựa trên XP từ các hoạt động

### 🥚 Hệ Thống Ấp Trứng (HATCH)
- Ấp 5 loại trứng thần thú với thời gian và lợi nhuận khác nhau
- Trứng rớt từ ải đấu, không mua được
- Thu hoạch với bonus ngẫu nhiên 10-30% và random KG từ 0.1-100 KG
- Nâng cấp trại để ấp trứng level cao hơn
- Nuôi thần thú để buff stats khi vào ải

### ⚔️ Hệ Thống Săn Quái (HUNT)
- Săn 6 loại quái vật thần thoại với tỷ lệ thành công khác nhau
- Cooldown ngắn 2 phút cho mỗi lần săn
- Khi săn sẽ random số KG của quái vật từ 1-100 KG
- Trang bị vũ khí để tăng tỷ lệ săn thành công
- Nhận linh hồn quái để craft bùa hộ mệnh
- Sử dụng bùa phép để tăng cơ hội

### 🏯 Hệ Thống Đi Ải (DUNGEON)
- 3 cõi ải đấu: Nhân Giới, Thiên Giới, Ma Giới
- Mỗi ải có 5 tầng với độ khó tăng dần
- Cooldown khác nhau: 5 phút (Nhân), 15 phút (Thiên), 30 phút (Ma)
- Yêu cầu items đặc biệt để vào ải cao cấp
- Phần thưởng đa dạng: trứng, linh hồn, ngọc linh, vũ khí, bí kíp

### 🛒 Hệ Thống Cửa Hàng (SHOP)
- 4 cửa hàng chính: Trứng Thần, Binh Khí, Phù Chú, Chức Nghiệp
- Mua bán vật phẩm với giá cố định
- Mua Role đặc biệt bằng V
- Bán vật phẩm thu thập được

### 📊 Quản Lý Cá Nhân
- Xem profile với thống kê chi tiết
- Quản lý túi đồ phân loại theo nhóm
- Xem leaderboard top người chơi
- Hệ thống inventory thông minh

## 🚀 Yêu Cầu Hệ Thống

- **Node.js** 18.17+
- **npm** hoặc **yarn**
- **Discord Bot Token**

## 📦 Cài Đặt

### Bước 1: Clone Repository
```bash
git clone <repository-url>
cd vie-mmorpg-bot
```

### Bước 2: Cài Đặt Dependencies
```bash
npm install
```

**⚠️ QUAN TRỌNG:** Bước này là **BẮT BUỘC**! Nếu bỏ qua sẽ gặp lỗi:
- `'tsx' is not recognized as an internal or external command`
- `'node' is not recognized as an internal or external command`
- Các lỗi module not found khác

### Bước 3: Cấu Hình Environment
```bash
# Copy file mẫu
cp .env.example .env

# Chỉnh sửa file .env với thông tin của bạn
# DISCORD_TOKEN=your_bot_token_here
# PREFIX=v
```

### Bước 4: Chạy Bot
```bash
# Development mode
npm run dev

# Production mode
npm run build
npm start
```

## ⚠️ Troubleshooting

### Lỗi "tsx is not recognized"
Nếu gặp lỗi này, có nghĩa là chưa cài đặt dependencies:

```bash
# Cài đặt dependencies
npm install

# Kiểm tra tsx đã được cài đặt chưa
npx tsx --version
```

### Lỗi "ERR_MODULE_NOT_FOUND"
Nếu gặp lỗi này, hãy kiểm tra:

1. **Đã cài đặt dependencies chưa:**
   ```bash
   npm install
   ```

2. **File .env đã tồn tại chưa:**
   ```bash
   cp .env.example .env
   # Sau đó chỉnh sửa file .env với token của bạn
   ```

3. **Node.js version:**
   ```bash
   node --version
   # Phải >= 18.17
   ```

4. **Clear cache và reinstall:**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

5. **Kiểm tra working directory:**
   ```bash
   # Đảm bảo đang ở đúng thư mục
   pwd
   ls -la
   # Phải thấy file package.json
   ```

6. **Fix npm cache:**
   ```bash
   npm cache clean --force
   npm install
   ```

7. **Kiểm tra file package.json:**
   ```bash
   # Xem nội dung file
   cat package.json
   # Hoặc trên Windows
   type package.json
   ```

8. **Nếu vẫn lỗi, thử tạo lại package.json:**
   ```bash
   # Backup file hiện tại
   cp package.json package.json.backup
   # Tạo lại file
   npm init -y
   # Sau đó copy lại nội dung từ backup
   ```

1. **Clone repository:**
```bash
git clone <repository-url>
cd luaviet-bot
```

2. **Cài đặt dependencies:**
```bash
npm install
```

3. **Cấu hình biến môi trường:**
Tạo file `.env` trong thư mục gốc với nội dung:
```env
DISCORD_TOKEN=YOUR_BOT_TOKEN_HERE
ADMIN_ROLE_NAME=Admin
USER_ROLE_NAME=User
PREFIX=lv
```

4. **Tạo thư mục dữ liệu:**
```bash
mkdir data
```

## 🏃‍♂️ Cách Chạy

**Development mode:**
```bash
npm run dev
```

**Production mode:**
```bash
npm run build
npm start
```

**Register slash commands:**
```bash
npm run register
```

## 📋 Danh Sách Lệnh Đầy Đủ

### 🆘 LỆNH TRỢ GIÚP
| Lệnh | Chức năng | Ví dụ |
|------|-----------|-------|
| `v help` | Hiển thị tất cả nhóm lệnh | `v help` |

### 💰 LỆNH KINH TẾ
| Lệnh | Chức năng | Cooldown | Ví dụ |
|------|-----------|----------|-------|
| `v work` | Làm việc kiếm V | 1 giờ | `v work` |
| `v daily` | Nhận quà hàng ngày | 24 giờ | `v daily` |
| `v weekly` | Nhận quà hàng tuần | 7 ngày | `v weekly` |
| `v profile` / `v cash` | Xem số dư & profile | - | `v cash` |
| `v give @user số_tiền` | Chuyển tiền cho user | - | `v give @John 100` |
| `v leaderboard` / `v top` | Xem top 10 giàu nhất | - | `v top` |
| `v bet số_tiền` | Đặt cược may rủi (50/50) | - | `v bet 100` |
| `v inventory` / `v inv` | Xem túi đồ chi tiết | - | `v inv` |

### 🥚 LỆNH ẤP TRỨNG
| Lệnh | Chức năng | Ví dụ |
|------|-----------|-------|
| `v hatch` | Xem trạng thái trại ấp trứng | `v hatch` |
| `v hatch place tên_trứng` | Đặt ấp trứng | `v hatch place rong_xanh` |
| `v hatch collect` | Thu thập trứng đã nở | `v hatch collect` |
| `v hatch upgrade` | Nâng cấp trại | `v hatch upgrade` |

**Trứng thần thú có sẵn:**
- **rong_xanh** (Trứng Rồng Xanh) - 5 phút - 50 V - Level 1
- **phuong_hoang** (Trứng Phượng Hoàng) - 30 phút - 80 V - Level 2
- **ky_lan** (Trứng Kỳ Lân) - 1 giờ - 120 V - Level 3
- **bach_ho** (Trứng Bạch Hổ) - 2 giờ - 200 V - Level 4
- **huyen_vu** (Trứng Huyền Vũ) - 5 giờ - 300 V - Level 5

### ⚔️ LỆNH SĂN QUÁI
| Lệnh | Chức năng | Cooldown | Ví dụ |
|------|-----------|----------|-------|
| `v hunt` | Săn quái một lượt | 2 phút | `v hunt` |
| `v hunt equip tên_vũ_khí` | Trang bị vũ khí | - | `v hunt equip kiem_go` |
| `v hunt inventory` | Xem đồ săn quái | - | `v hunt inv` |
| `v hunt use tên_bùa` | Dùng bùa phép | - | `v hunt use lucky_charm` |

**Quái vật có thể săn:**
- 👻 **Yêu Tinh** (80%) - 30-50 V
- 🦊 **Tinh Hồ Ly** (75%) - 40-60 V
- 👹 **Ma Rừng** (60%) - 80-120 V
- 🦌 **Linh Dương** (50%) - 100-150 V
- 🐅 **Hổ Thần** (30%) - 200-300 V
- 🐻 **Gấu Tinh** (25%) - 250-350 V

### 🏯 LỆNH ĐI ẢI
| Lệnh | Chức năng | Cooldown | Ví dụ |
|------|-----------|----------|-------|
| `v dungeon` | Xem trạng thái các ải | - | `v dungeon` |
| `v dungeon enter nhan` | Vào Nhân Giới | 5 phút | `v dungeon enter nhan` |
| `v dungeon enter thien` | Vào Thiên Giới | 15 phút | `v dungeon enter thien` |
| `v dungeon enter ma` | Vào Ma Giới | 30 phút | `v dungeon enter ma` |
| `v dungeon stats` | Thống kê cá nhân | - | `v dungeon stats` |
| `v dungeon leaderboard` | BXH chinh phục ải | - | `v dungeon leaderboard` |

**Các ải đấu:**
- 🌿 **Nhân Giới** (70% success) - 50-150 V + trứng thấp + linh hồn thấp
- ⚡ **Thiên Giới** (50% success) - 200-500 V + trứng trung + linh hồn trung (cần Bùa Hộ Mệnh)
- 🔥 **Ma Giới** (30% success) - 500-1500 V + trứng cao + linh hồn cao (cần Linh Đan Cấp Cao + Level 5+)

### 🛒 LỆNH CỬA HÀNG
| Lệnh | Chức năng | Ví dụ |
|------|-----------|-------|
| `v shop` | Xem tất cả cửa hàng | `v shop` |
| `v shop eggs` | Cửa hàng trứng thần | `v shop eggs` |
| `v shop weapons` | Cửa hàng binh khí | `v shop weapons` |
| `v shop dungeon` | Cửa hàng phù chú | `v shop dungeon` |
| `v shop roles` | Mua role bằng V | `v shop roles` |
| `v buy tên_vật_phẩm` | Mua vật phẩm | `v buy kiem_go` |
| `v sell tên_vật_phẩm` | Bán vật phẩm | `v sell linh_hon_yeu_tinh` |

**Vật phẩm cửa hàng:**

🥚 **Trứng thần:** rong_xanh_egg (0 V), phuong_hoang_egg (0 V), ky_lan_egg (0 V), bach_ho_egg (0 V), huyen_vu_egg (0 V) - Chỉ rớt từ ải

⚔️ **Binh khí:** kiem_go (0 V), kiem_sat (800 V), kiem_bac (2,500 V), kiem_vang (6,000 V), kiem_than (15,000 V)

🔮 **Phù chú:** phu_chu_tre (200 V), phu_chu_sat (500 V), phu_chu_bac (1,200 V), phu_chu_vang (3,000 V), phu_chu_kim_cuong (8,000 V)

💊 **Linh đan:** linh_dan_thap (10 V), linh_dan_trung (50 V), linh_dan_cao (150 V), linh_dan_cao_cap (400 V), linh_dan_than (1,000 V)

🎭 **Chức nghiệp:** Ấp Trứng Sư (5000 V), Trừ Tà Sư (8000 V), Phá Ải Sư (6000 V)

### 📦 LỆNH QUẢN LÝ CÁ NHÂN
| Lệnh | Chức năng | Ví dụ |
|------|-----------|-------|
| `v inventory` / `v inv` | Xem túi đồ chi tiết | `v inv` |
| `v profile @user` | Xem profile user khác | `v profile @John` |

### ⚡ LỆNH ADMIN (Chỉ Admin)
| Lệnh | Chức năng | Ví dụ |
|------|-----------|-------|
| `/ping` | Kiểm tra độ trễ của bot | `/ping` |
| `/add @user số_tiền` | Thêm tiền cho user | `/add @John 1000` |
| `/remove @user số_tiền` | Trừ tiền user | `/remove @John 500` |
| `/resetmoney @user` | Reset tiền user | `/resetmoney @John` |
| `/turnoff` | Tắt bot | `/turnoff` |
| `/reset` | Khởi động lại bot | `/reset` |
| `/status` | Kiểm tra trạng thái bot | `/status` |

### 🎉 LỆNH GIVEAWAY (Chỉ Role Giveaway / Admin)
| Lệnh | Chức năng | Ví dụ |
|------|-----------|-------|
| `v ga <số giờ> <số người win> <nội dung>` | Tạo một giveaway mới | `v ga 10h 1 100k OwO` |
| `v ga <số giờ> <số người win> <role yêu cầu> <nội dung>` | Tạo một giveaway mới theo role yêu cầu | `v ga 10h 1 @cư_dân 100k OwO` |
| `v reroll <id_message>` | Chọn lại người thắng cuộc | `v reroll 01234567890123` |
| `v end <id_message>` | Kết thúc một giveaway sớm | `v end 01234567890123` |
| `v glist` | Xem các giveaway đang diễn ra | `v glist` |

### ⚡ LỆNH FLASH (Chỉ Admin)
| Lệnh | Chức năng | Ví dụ |
|------|-----------|-------|
| `v rn <nội dung>` | Đổi tên kênh một cách nhanh chóng | `v rn done` |
| `v lock` | Khóa quyền gửi tin nhắn tại channel đó | `v lock` |
| `v unlock` | Mở khóa quyền gửi tin nhắn tại channel đó | `v unlock` |
| `v clear <số_lượng>` | Xóa số lượng tin nhắn | `v clear 10` |

## 🏗️ Cấu Trúc Dự Án

```
vie-mmorpg-bot/
├── index.ts                 # Entry point chính
├── modules/                 # Các module chức năng
│   ├── basic.ts            # Lệnh cơ bản & help
│   ├── economy.ts          # Hệ thống kinh tế
│   ├── hatch.ts            # Hệ thống ấp trứng
│   ├── hunt.ts             # Hệ thống săn quái
│   ├── dungeon.ts          # Hệ thống đi ải
│   ├── shop.ts             # Hệ thống cửa hàng
│   ├── entertainment.ts    # Game giải trí
│   ├── club.ts             # Hệ thống club
│   ├── manager.ts          # Quản trị
│   └── control.ts          # Điều khiển bot
├── data/                   # Lưu trữ dữ liệu
│   ├── db.json             # Dữ liệu người dùng
│   ├── shop_config.json    # Cấu hình cửa hàng
│   └── game_config.json    # Cấu hình game
├── store/                   # Quản lý dữ liệu
│   └── store.ts            # Store class chính
├── lib/                    # Utilities
│   ├── env.ts              # Environment config
│   └── loader.ts           # Command loader
├── tools/                  # Scripts tiện ích
│   ├── registerSlash.ts    # Đăng ký slash commands
│   └── clearCommands.ts    # Xóa commands
├── scripts/                # Scripts quản lý
│   ├── bot-control.ps1     # PowerShell control
│   └── bot-control.bat     # Batch control
├── types/                  # TypeScript types
│   └── command.ts          # Command interfaces
├── package.json            # Dependencies
├── tsconfig.json           # TypeScript config
├── Dockerfile              # Docker config
├── docker-compose.yml      # Docker compose
└── README.md              # Tài liệu
```

## 🎯 Hệ Thống Level & Tiến Trình

### Cách tăng Level:
- ✅ **Làm việc** (work): +10 XP
- ✅ **Nhận quà** (daily): +25 XP
- ✅ **Đi săn** (hunt): +15 XP
- ✅ **Câu cá** (fish): +12 XP
- ✅ **Thu hoạch** (farm harvest): +20 XP

### Công thức Level:
```
Level = max(1, int((XP / 100) ** 0.5))
```

### Lợi ích khi Level cao:
- 🎯 Mở khóa cây trồng mới
- ⚔️ Săn được quái vật hiếm
- 🎣 Câu được cá quý hiếm
- 💰 Bonus thu nhập từ công việc

## 🔄 Vòng Lặp Gameplay Chính

1. **💼 Kiếm tiền cơ bản** → `lv work`, `lv daily`
2. **🛒 Mua công cụ** → `lv shop weapons`, `lv shop seeds`
3. **🎮 Sử dụng công cụ** → `lv hunt`, `lv fish`, `lv farm`
4. **📈 Kiếm nhiều hơn** + Vật phẩm quý
5. **🎯 Level up** → Mở khóa nội dung mới
6. **🔄 Lặp lại** với hiệu suất cao hơn

## 🏆 Mục Tiêu Cuối Cùng

- ✅ **Top Leaderboard** - Trở thành người giàu nhất server
- 🎭 **Mua Role đặc biệt** - Thể hiện đẳng cấp
- ⚔️ **Sở hữu vũ khí hiếm** - Săn quái vật mạnh
- 🌾 **Nông trại cấp cao** - Thu hoạch siêu lợi nhuận
- 🎣 **Câu cá huyền thoại** - Rương báu giá trị cao

## ⚙️ Cấu Hình Nâng Cao

### Thời gian và Cooldown:
- **Work:** 1 giờ
- **Hunt:** 2 phút
- **Fish:** 5 phút
- **Daily:** 24 giờ
- **Weekly:** 7 ngày

### Giới hạn hệ thống:
- **Số dư tối đa:** 10,000,000 V
- **Level tối đa:** 100
- **Streak bonus tối đa:** 100 V

## 🐛 Xử Lý Lỗi

Bot được trang bị hệ thống xử lý lỗi toàn diện:

- ✅ Validation input nghiêm ngặt
- ✅ Cooldown hệ thống chống spam
- ✅ Backup dữ liệu tự động
- ✅ Log lỗi chi tiết

## 📞 Hỗ Trợ

Nếu gặp vấn đề:

1. Kiểm tra file logs trong thư mục logs/
2. Đảm bảo bot có đủ permissions
3. Kiểm tra cấu hình file .env
4. Liên hệ quản trị viên server

---

**Lửa Việt Bot** - Siêu cháy! 🔥
