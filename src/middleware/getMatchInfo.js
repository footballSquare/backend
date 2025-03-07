const customError = require("../util/customError")
const client = require("../database/postgreSQL")

// 해당
const getMatchAndTeamInfo = async (req, res, next) => {
    const { match_match_idx } = req.params;

    try {
        const matchResult  = await client.query(`
            SELECT 
                match.match.player_list_idx AS match_creator_idx,
                match.match.team_list_idx,
                team_leader.player_list_idx AS team_captain_idx
            FROM match.match
            LEFT JOIN team.member AS team_leader 
                ON match.match.team_list_idx = team_leader.team_list_idx 
                AND team_leader.team_role_idx = 0
            WHERE match.match.match_match_idx = $1;
        `, [match_match_idx]);

        if (matchResult.rowCount === 0) {
            throw customError(404, `존재하지 않는 매치.`);
        }

        const { match_creator_idx, team_list_idx, team_captain_idx } = matchResult.rows[0];

        req.matchInfo = { match_creator_idx, team_list_idx, team_captain_idx };
        next();
    } catch (e) {
        next(e);
    }
};


module.exports = {
    getMatchAndTeamInfo
}