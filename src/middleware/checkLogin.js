const customError = require("./../util/customError");
const client = require("../database/postgreSQL")
const jwt = require("jsonwebtoken");

const checkLogin = async (req, res, next) => {

  if (req.method === "OPTIONS") {
    return next();
  }
  
  try {
    const { authorization } = req.headers;

    if (!authorization) throw customError(401, "로그인이 필요합니다.");

    const { my_player_list_idx } = jwt.verify(authorization, process.env.ACCESS_TOKEN_SECRET);
    const sql = `
      SELECT 
        tm.team_list_idx AS my_team_list_idx,
        tm.team_role_idx AS my_team_role_idx,
        cs.community_role_idx AS my_community_role_idx,
        cs.community_list_idx AS my_community_list_idx
      FROM player.list pl
      LEFT JOIN team.member tm ON pl.player_list_idx = tm.player_list_idx
      LEFT JOIN community.staff cs ON pl.player_list_idx = cs.player_list_idx
      WHERE pl.player_list_idx = $1
    `;

    const result = await client.query(sql, [my_player_list_idx]);

    const {
      my_team_list_idx,
      my_team_role_idx,
      my_community_role_idx,
      my_community_list_idx,
    } = result.rows[0] || {};

    req.decoded = {
      my_player_list_idx,
      my_team_list_idx,
      my_team_role_idx,
      my_community_role_idx,
      my_community_list_idx,
    }; 

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

const optionalLogin = async (req, res, next) => {
  const { authorization } = req.headers;

  if (authorization) {
    try {
      const { my_player_list_idx } = jwt.verify(authorization, process.env.ACCESS_TOKEN_SECRET);
      const sql = `
        SELECT 
          tm.team_list_idx AS my_team_list_idx,
          tm.team_role_idx AS my_team_role_idx,
          cs.community_role_idx AS my_community_role_idx,
          cs.community_list_idx AS my_community_list_idx
        FROM player.list pl
        LEFT JOIN team.member tm ON pl.player_list_idx = tm.player_list_idx
        LEFT JOIN community.staff cs ON pl.player_list_idx = cs.player_list_idx
        WHERE pl.player_list_idx = $1
      `;

      const result = await client.query(sql, [my_player_list_idx]);

      const {
        my_team_list_idx,
        my_team_role_idx,
        my_community_role_idx,
        my_community_list_idx,
      } = result.rows[0] || {};

      req.decoded = {
        my_player_list_idx,
        my_team_list_idx,
        my_team_role_idx,
        my_community_role_idx,
        my_community_list_idx,
      }; 
    } catch (e) {
      req.decoded = {}; // 잘못된 토큰일 경우 null로 설정
    }
  } else {
    req.decoded = {}; // 토큰이 없는 경우 null로 설정
  }
  next();
};

module.exports = { checkLogin, optionalLogin };
