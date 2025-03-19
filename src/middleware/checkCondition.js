const customError = require("../util/customError")
const client = require("../database/postgreSQL")

// 매치 마지막 생성일 2주가 지났는지 확인하는 미들웨어
const checkTeamMatchCooldown = async (req, res, next) => {
    const { team_list_idx } = req.params;

    try {
        const result = await client.query(
            `
            SELECT match_match_created_at
            FROM match.match
            WHERE team_list_idx = $1
            ORDER BY match_match_created_at DESC
            LIMIT 1;
            `, [team_list_idx]);

        // 최근 생성된 매치가 없으면 통과
        if (result.rows.length === 0) {
            return next();
        }

        const lastMatchDate = new Date(result.rows[0].match_match_created_at);
        const now = new Date();
        const fourteenDaysAgo = new Date(now.setDate(now.getDate() - 14));

        // 14일이 지나지 않았다면 요청 거부
        if (lastMatchDate > fourteenDaysAgo) {
            throw customError(403, `최근 팀 매치 생성 이후 14일이 지나지 않았습니다.`);
        }
        next();
    } catch (e) {
        next(e);
    }
};

module.exports = {
    checkTeamMatchCooldown
}
