const customError = require("../util/customError")
const client = require("../database/postgreSQL")

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

        req.matchInfo = matchResult.rows[0];

        console.log(req.matchInfo)
        next();
    } catch (e) {
        next(e);
    }
};


module.exports = {
    getMatchAndTeamInfo
}