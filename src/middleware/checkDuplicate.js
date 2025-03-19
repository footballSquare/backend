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

module.exports = {
    checkTeamNameDuplicate,
    checkTeamShortNameDuplicate
};
