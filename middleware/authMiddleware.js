const { verifyAccessToken } = require("../utils/tokenUtils");
const User = require("../models/User");

/**
 * Foydalanuvchi autentifikatsiyasini tekshirish
 * Authorization: Bearer <access_token>
 */
const protect = async (req, res, next) => {
  try {
    let token;

    // Header'dan tokenni olish
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Kirish uchun avval tizimga kiring",
      });
    }

    // Tokenni tekshirish
    let decoded;
    try {
      decoded = verifyAccessToken(token);
    } catch (err) {
      if (err.name === "TokenExpiredError") {
        return res.status(401).json({
          success: false,
          message: "Access token muddati tugagan, refresh token bilan yangilang",
          expired: true,
        });
      }
      return res.status(401).json({
        success: false,
        message: "Token noto'g'ri",
      });
    }

    // Foydalanuvchini bazadan topish
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Foydalanuvchi topilmadi",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server xatosi",
    });
  }
};

module.exports = { protect };

