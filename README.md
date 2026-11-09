# 🔐 JWT Auth API

Node.js + Express + MongoDB bilan qurilgan to'liq autentifikatsiya tizimi.

## ✨ Xususiyatlar

- ✅ Ro'yxatdan o'tish (name, email, password)
- ✅ Tizimga kirish / chiqish
- ✅ Access Token — **3 daqiqa**
- ✅ Refresh Token — **1 hafta** (httpOnly Cookie)
- ✅ Token Rotation (xavfsizlik)
- ✅ Barcha qurilmalardan chiqish
- ✅ bcrypt bilan parol hashlash

## 🛠 Texnologiyalar

| Paket | Maqsad |
|-------|--------|
| `express` | Web server |
| `mongoose` | MongoDB ORM |
| `jsonwebtoken` | JWT tokenlar |
| `bcryptjs` | Parol hashlash |
| `cookie-parser` | Cookie boshqarish |
| `dotenv` | Muhit o'zgaruvchilari |

## 📁 Fayl Strukturasi

```
├── config/
│   └── db.js
├── controllers/
│   └── authController.js
├── middleware/
│   └── authMiddleware.js
├── models/
│   └── User.js
├── routes/
│   └── authRoutes.js
├── utils/
│   └── tokenUtils.js
├── .env.example
├── server.js
└── package.json
```

## 🚀 Ishga Tushirish

```bash
# 1. Klonlash
git clone https://github.com/USERNAME/REPO_NAME.git
cd REPO_NAME

# 2. Paketlarni o'rnatish
npm install

# 3. .env faylini yaratish
cp .env.example .env
# .env ni o'zingizga mos o'zgartiring

# 4. Serverni ishga tushirish
npm run dev
```

## ⚙️ .env Sozlamalari

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/auth_db
JWT_ACCESS_SECRET=your_access_secret_here
JWT_REFRESH_SECRET=your_refresh_secret_here
ACCESS_TOKEN_EXPIRE=3m
REFRESH_TOKEN_EXPIRE=7d
NODE_ENV=development
```

## 📡 API Endpointlar

| Method | URL | Himoya | Tavsif |
|--------|-----|--------|--------|
| POST | `/api/auth/register` | Public | Ro'yxatdan o'tish |
| POST | `/api/auth/login` | Public | Tizimga kirish |
| POST | `/api/auth/logout` | 🔒 Private | Chiqish |
| POST | `/api/auth/logout-all` | 🔒 Private | Barcha qurilmalardan chiqish |
| POST | `/api/auth/refresh-token` | Cookie | Access tokenni yangilash |
| GET | `/api/auth/me` | 🔒 Private | Joriy user ma'lumotlari |

### So'rov namunalari

**Register:**
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name": "Ali", "email": "ali@test.com", "password": "secret123"}'
```

**Login:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{"email": "ali@test.com", "password": "secret123"}'
```

**Himoyalangan route:**
```bash
curl http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer <access_token>"
```

**Token yangilash:**
```bash
curl -X POST http://localhost:5000/api/auth/refresh-token \
  -b cookies.txt -c cookies.txt
```

## 🔒 Xavfsizlik

- **httpOnly Cookie** — XSS hujumidan himoya
- **sameSite: strict** — CSRF hujumidan himoya
- **Token Rotation** — har yangilashda refresh token almashadi
- **Token Blacklist** — bazada saqlanadi, o'g'irlangan token bloklangan

## 📄 Litsenziya

MIT

