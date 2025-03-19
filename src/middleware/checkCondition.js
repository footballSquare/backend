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

// 정규팀 여부 체크
const checkTeamMemberCount = () => {
    return async (req, res, next) => {
        const team_list_idx = req.body.team_list_idx ?? req.params.team_list_idx ?? req.query.team_list_idx;

        const sql = `SELECT COUNT(*) FROM team.member WHERE team_list_idx = $1`;

        try {
            const result = await client.query(sql, [team_list_idx]);
            const memberCount = parseInt(result.rows[0].count, 10);

            if (memberCount < 10) {
                throw customError(403, `팀원 수 부족: 최소 10명 필요 (현재 ${memberCount}명)`);
            }

            next();
        } catch (e) {
            next(e);
        }
    };
};

// 소속팀 여부 체크
const checkPlayerNotInTeam = () => {
    return async (req, res, next) => {
        const player_list_idx = req.body.player_list_idx ?? req.params.player_list_idx ?? req.query.player_list_idx;

        const sql = `SELECT team_list_idx FROM team.member WHERE player_list_idx = $1`;

        try {
            const result = await client.query(sql, [player_list_idx]);

            if (result.rows.length > 0) {
                throw customError(403, `해당 선수는 이미 팀에 가입되어 있습니다.`);
            }

            next();
        } catch (e) {
            next(e);
        }
    };
};

// 매치 종료 시각 체크
const checkMatchEnded = () => {
    return async (req, res, next) => {
        const match_match_idx = req.body.match_match_idx ?? req.params.match_match_idx ?? req.query.match_match_idx;
        console.log(match_match_idx)
        const sql = `
            SELECT (match_match_start_time + match_match_duration) AS match_end_time
            FROM match.match 
            WHERE match_match_idx = $1
        `;

        try {
            const result = await client.query(sql, [match_match_idx]);

            const matchEndTime = new Date(result.rows[0].match_end_time);
            const now = new Date();

            if (matchEndTime > now) {
                throw customError(403, `매치가 아직 종료되지 않았습니다.`);
            }

            next();
        } catch (e) {
            next(e);
        }
    };
};

// 매치 시작 시간 체크
const checkMatchNotStarted = () => {
    return async (req, res, next) => {
        const match_match_idx = req.body.match_match_idx ?? req.params.match_match_idx ?? req.query.match_match_idx;
        
        const sql = `
            SELECT match_match_start_time 
            FROM match.match 
            WHERE match_match_idx = $1
        `;

        try {
            const result = await client.query(sql, [match_match_idx]);
            const matchStartTime = new Date(result.rows[0].match_match_start_time);
            const now = new Date();

            if (now >= matchStartTime) {
                throw customError(403, `매치가 이미 시작되었습니다.`);
            }

            next();
        } catch (e) {
            next(e);
        }
    };
};

module.exports = {
    checkTeamMatchCooldown,
    checkTeamMemberCount,
    checkPlayerNotInTeam,
    checkMatchEnded,
    checkMatchNotStarted
}
