const customError = require("../util/customError")
const client = require("../database/postgreSQL")

// 팀명 중복 확인 
const checkTeamNameDuplicate = () => {
    return async (req, res, next) => {
        const { team_list_name } = req.body;

        const sql = `SELECT COUNT(*) FROM team.list WHERE team_list_name = $1`;

        try {
            const result = await client.query(sql, [team_list_name]);

            if (parseInt(result.rows[0].count) > 0) {
                throw customError(409, "이미 존재하는 팀명입니다.");
            }

            next();
        } catch (e) {
            next(e);
        }
    };
};

// 팀 약칭 중복 확인
const checkTeamShortNameDuplicate = () => {
    return async (req, res, next) => {
        const { team_list_short_name } = req.body;

        const sql = `SELECT COUNT(*) FROM team.list WHERE team_list_short_name = $1`;

        try {
            const result = await client.query(sql, [team_list_short_name]);

            if (parseInt(result.rows[0].count) > 0) {
                throw customError(409, "이미 존재하는 팀약칭입니다.");
            }

            next();
        } catch (e) {
            next(e);
        }
    };
};

// 대회 명 중복 체크
const checkChampionshipNameDuplicate = () => {
    return async (req, res, next) => {
        const { championship_list_name } = req.body;

        const sql = `
            SELECT COUNT(*) 
            FROM championship.list 
            WHERE championship_list_name = $1
        `;

        try {
            const result = await client.query(sql, [championship_list_name]);

            if (parseInt(result.rows[0].count) > 0) {
                throw customError(409, "이미 존재하는 대회명입니다.");
            }

            next();
        } catch (e) {
            next(e);
        }
    };
};

const checkNicknameDuplicate = () => {
  return async (req, res, next) => {
    const { nickname } = req.body;
    const my_player_list_idx = req.decoded.my_player_list_idx;

    const sql = `SELECT player_list_idx FROM player.list WHERE player_list_nickname = $1`;

    try {
      const result = await client.query(sql, [nickname]);

      // 닉네임이 아예 존재하지 않으면 통과
      if (result.rows.length === 0) {
        return next();
      }

      // 존재하는 닉네임이 내 닉네임이면 통과
      const existingPlayerIdx = result.rows[0].player_list_idx;
      if (existingPlayerIdx === my_player_list_idx) {
        return next();
      }

      // 다른 사람 닉네임이면 중복 에러
      throw customError(409, "이미 존재하는 닉네임입니다.");
    } catch (e) {
      next(e);
    }
  };
};



module.exports = {
    checkTeamNameDuplicate,
    checkTeamShortNameDuplicate,
    checkChampionshipNameDuplicate,
    checkNicknameDuplicate
};
