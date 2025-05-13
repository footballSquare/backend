const customError = require("./../util/customError");
const jwt = require("jsonwebtoken");

const checkLogin = (req, res, next) => {
  console.log("들어옴")
  if (req.method === "OPTIONS") {
    return next();
  }
  
  try {
    const { authorization } = req.headers;

    if (!authorization) throw customError(401, "로그인이 필요합니다.");

    req.decoded = jwt.verify(authorization, process.env.ACCESS_TOKEN_SECRET);

    next();
  } catch (e) {
    if (e.name === "TokenExpiredError") {
      e.status = 401;
      e.message = "만료된 access token 입니다.";
    } else if (e.name === "JsonWebTokenError") {
      e.status = 403;
      e.message = "잘못된 access token 입니다.";
    }
    next(e);
  }
};

const optionalLogin = (req, res, next) => {
  const { authorization } = req.headers;

  if (authorization) {
    try {
      req.decoded = jwt.verify(authorization, process.env.ACCESS_TOKEN_SECRET);
    } catch (e) {
      req.decoded = {}; // 잘못된 토큰일 경우 null로 설정
    }
  } else {
    req.decoded = {}; // 토큰이 없는 경우 null로 설정
  }
  next();
};

module.exports = { checkLogin, optionalLogin };
