const User = require("../models/User");
const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} = require("../utils/tokenUtils");

// Refresh token cookie sozlamalari
const REFRESH_TOKEN_COOKIE_OPTIONS = {
  httpOnly: true,       // JavaScript orqali o'qib bo'lmaydi (XSS himoya)
  secure: process.env.NODE_ENV === "production", // HTTPS da ishlaydi
  sameSite: "strict",   // CSRF himoya
  maxAge: 7 * 24 * 60 * 60 * 1000, // 1 hafta (ms)
};

// ─────────────────────────────────────────────
// @route   POST /api/auth/register
// @desc    Yangi foydalanuvchi ro'yxatdan o'tkazish
// @access  Public
// ─────────────────────────────────────────────
const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Maydonlarni tekshirish
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Ism, email va parol kiritish majburiy",
      });
    }

    // Email mavjudligini tekshirish
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Bu email allaqachon ro'yxatdan o'tgan",
      });
    }

    // Yangi foydalanuvchi yaratish
    const user = await User.create({ name, email, password });

    // Tokenlar yaratish
    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    // Refresh tokenni bazaga saqlash
    await User.findByIdAndUpdate(user._id, {
      $push: { refreshTokens: refreshToken },
    });

    // Refresh tokenni cookie ga saqlash
    res.cookie("refreshToken", refreshToken, REFRESH_TOKEN_COOKIE_OPTIONS);

    res.status(201).json({
      success: true,
      message: "Muvaffaqiyatli ro'yxatdan o'tdingiz",
      accessToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    // Mongoose validation xatosi
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({
        success: false,
        message: messages.join(", "),
      });
    }
    res.status(500).json({
      success: false,
      message: "Server xatosi: " + error.message,
    });
  }
};

// ─────────────────────────────────────────────
// @route   POST /api/auth/login
// @desc    Tizimga kirish
// @access  Public
// ─────────────────────────────────────────────
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Maydonlarni tekshirish
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email va parol kiritish majburiy",
      });
    }

    // Foydalanuvchini topish (password select: false bo'lgani uchun qo'lda so'raymiz)
    const user = await User.findOne({ email }).select("+password +refreshTokens");
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Email yoki parol noto'g'ri",
      });
    }

    // Parolni tekshirish
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Email yoki parol noto'g'ri",
      });
    }

    // Tokenlar yaratish
    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    // Refresh tokenni bazaga qo'shish
    user.refreshTokens.push(refreshToken);
    await user.save({ validateBeforeSave: false });

    // Refresh tokenni cookie ga saqlash
    res.cookie("refreshToken", refreshToken, REFRESH_TOKEN_COOKIE_OPTIONS);

    res.status(200).json({
      success: true,
      message: "Muvaffaqiyatli kirdingiz",
      accessToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server xatosi: " + error.message,
    });
  }
};

// ─────────────────────────────────────────────
// @route   POST /api/auth/logout
// @desc    Tizimdan chiqish
// @access  Private
// ─────────────────────────────────────────────
const logout = async (req, res) => {
  try {
    const refreshToken = req.cookies?.refreshToken;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: "Refresh token topilmadi",
      });
    }

    // Bazadan refresh tokenni o'chirish
    await User.findByIdAndUpdate(req.user._id, {
      $pull: { refreshTokens: refreshToken },
    });

    // Cookie ni o'chirish
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    res.status(200).json({
      success: true,
      message: "Muvaffaqiyatli chiqdingiz",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server xatosi: " + error.message,
    });
  }
};

// ─────────────────────────────────────────────
// @route   POST /api/auth/logout-all
// @desc    Barcha qurilmalardan chiqish
// @access  Private
// ─────────────────────────────────────────────
const logoutAll = async (req, res) => {
  try {
    // Barcha refresh tokenlarni o'chirish
    await User.findByIdAndUpdate(req.user._id, {
      $set: { refreshTokens: [] },
    });

    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    res.status(200).json({
      success: true,
      message: "Barcha qurilmalardan chiqdingiz",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server xatosi: " + error.message,
    });
  }
};

// ─────────────────────────────────────────────
// @route   POST /api/auth/refresh-token
// @desc    Yangi access token olish
// @access  Public (refresh token bilan)
// ─────────────────────────────────────────────
const refreshAccessToken = async (req, res) => {
  try {
    const refreshToken = req.cookies?.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: "Refresh token topilmadi, qaytadan kiring",
      });
    }

    // Refresh tokenni tekshirish
    let decoded;
    try {
      decoded = verifyRefreshToken(refreshToken);
    } catch (err) {
      // Muddati o'tgan yoki noto'g'ri token - cookieni o'chirish
      res.clearCookie("refreshToken");
      return res.status(401).json({
        success: false,
        message:
          err.name === "TokenExpiredError"
            ? "Refresh token muddati tugagan, qaytadan kiring"
            : "Refresh token noto'g'ri",
      });
    }

    // Foydalanuvchini va tokenni bazadan tekshirish (token rotation xavfsizligi)
    const user = await User.findById(decoded.id).select("+refreshTokens");
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Foydalanuvchi topilmadi",
      });
    }

    // Tokenning bazada mavjudligini tekshirish
    if (!user.refreshTokens.includes(refreshToken)) {
      // Token o'g'irlangan bo'lishi mumkin - barcha tokenlarni o'chiramiz
      user.refreshTokens = [];
      await user.save({ validateBeforeSave: false });
      res.clearCookie("refreshToken");
      return res.status(401).json({
        success: false,
        message: "Token yaroqsiz, xavfsizlik sababi bilan barcha sessiyalar yakunlandi",
      });
    }

    // Token Rotation: eski tokenni o'chirib, yangi token yaratamiz
    const newAccessToken = generateAccessToken(user._id);
    const newRefreshToken = generateRefreshToken(user._id);

    // Bazada eski tokenni yangi token bilan almashtirish
    user.refreshTokens = user.refreshTokens.filter((t) => t !== refreshToken);
    user.refreshTokens.push(newRefreshToken);
    await user.save({ validateBeforeSave: false });

    // Yangi refresh tokenni cookie ga saqlash
    res.cookie("refreshToken", newRefreshToken, REFRESH_TOKEN_COOKIE_OPTIONS);

    res.status(200).json({
      success: true,
      message: "Token muvaffaqiyatli yangilandi",
      accessToken: newAccessToken,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server xatosi: " + error.message,
    });
  }
};

// ─────────────────────────────────────────────
// @route   GET /api/auth/me
// @desc    Joriy foydalanuvchi ma'lumotlari
// @access  Private
// ─────────────────────────────────────────────
const getMe = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        createdAt: req.user.createdAt,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server xatosi",
    });
  }
};

module.exports = {
  register,
  login,
  logout,
  logoutAll,
  refreshAccessToken,
  getMe,
};

