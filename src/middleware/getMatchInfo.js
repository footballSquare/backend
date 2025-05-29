const customError = require("../util/customError")
const client = require("../database/postgreSQL")

const { 
    MATCH_ATTRIBUTE
} = require("../constant/constantIndex")

// 해당
const getMatchAndTeamInfo = async (req, res, next) => {
    const { match_match_idx } = req.params;

    try {
        const matchResult  = await client.query(`
            SELECT 
            m.match_match_idx,
            m.team_list_idx,
            m.player_list_idx AS match_creator_idx,
            m.match_formation_idx,
            m.match_match_participation_type,
            m.match_type_idx,
            m.match_match_attribute,
            m.common_status_idx,
            m.match_match_created_at,
            m.match_match_start_time,
            m.match_match_duration,
            tl.player_list_idx AS team_captain_idx
            FROM match.match AS m
            LEFT JOIN team.member AS tl
            ON m.team_list_idx = tl.team_list_idx
            AND tl.team_role_idx = 0
            WHERE m.match_match_idx = $1;
        `, [match_match_idx]);

        if (matchResult.rowCount === 0) {
            throw customError(404, `존재하지 않는 매치.`);
        }

        const matchInfo = matchResult.rows[0];

        if (matchInfo.match_match_attribute == MATCH_ATTRIBUTE.CHAMPIONSHIP) {
            const championshipResult = await client.query(`
            SELECT championship_list_idx
            FROM championship.championship_match
            WHERE championship_match_first_idx = $1
            OR championship_match_second_idx = $1
            LIMIT 1
        `, [match_match_idx]);

            if (championshipResult.rowCount === 0) {
                throw customError(404, `대회 매치로 지정되었지만, 대회 정보가 존재하지 않습니다.`);
            }

            matchInfo.championship_list_idx = championshipResult.rows[0].championship_list_idx;
        }

        req.matchInfo = matchInfo;
        next();
    } catch (e) {
        next(e);
    }
};


module.exports = {
    getMatchAndTeamInfo
}