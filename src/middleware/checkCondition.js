const customError = require("../util/customError")
const client = require("../database/postgreSQL")

const {
    TEAM_ROLE,
    MATCH_PARTICIPATION_TYPE,
    MATCH_ATTRIBUTE,
    MATCH_TYPE,
    MATCH_FORMATION,
    MATCH_DURATION,
    COMMUNITY_ROLE,
    COMMUNINY_IDX,
    COMMON_STATUS,
    CHAMPIONSHIP_TYPE,
    CHAMPIONSHIP_STATUS,
    MATCH_POSITION,
    BOARD_CATEGORY,
    MATCH_FORMATION_POSITIONS
} = require("../constant/constantIndex")

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
        try {
        const {match_match_start_time,match_match_duration} = req.matchInfo
        const start = new Date(match_match_start_time);
        const end = new Date(start);
        
        if (match_match_duration.hours) {
            end.setHours(end.getHours() + parseInt(match_match_duration.hours));
        }
        if (match_match_duration.minutes) {
            end.setMinutes(end.getMinutes() + parseInt(match_match_duration.minutes));
        }
    
        const now = new Date();

        if (end > now) {
        throw customError(403, "매치가 아직 종료되지 않았습니다.");
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
        const {match_match_start_time} = req.matchInfo

        try {
            const matchStartTime = new Date(match_match_start_time);
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

// 대회 매치 포함된 매치의 상태 체크
const checkChampionshipMatchStatus = () => {
    return async (req, res, next) => {
        const championship_match_idx = req.body.championship_match_idx ?? req.params.championship_match_idx ?? req.query.championship_match_idx;

        const sql = `
            WITH match_info AS (
                SELECT championship_match_first_idx, championship_match_second_idx
                FROM championship.championship_match
                WHERE championship_match_idx = $1
            )
            SELECT m.common_status_idx 
            FROM match.match m
            WHERE m.match_match_idx IN (
                (SELECT championship_match_first_idx FROM match_info),
                (SELECT championship_match_second_idx FROM match_info)
            );
        `;

        try {
            const result = await client.query(sql, [championship_match_idx]);

            const [firstMatchStatus, secondMatchStatus] = result.rows.map(row => row.common_status_idx);

            if (firstMatchStatus !== 1 || secondMatchStatus !== 1) {
                throw customError(403, `대회 매치에 포함된 모든 매치가 마감되지 않았습니다.`);
            }

            next();
        } catch (e) {
            next(e);
        }
    };
};

// 지원자가 이미 소속된 커뮤니티 운영진 인지 확인하는 미들웨어 
const checkIsCommunityAdmin = () => {
    return async (req, res, next) => {
        const player_list_idx = req.body.player_list_idx ?? req.params.player_list_idx ?? req.query.player_list_idx;

        const sql = `
            SELECT community_role_idx 
            FROM community.staff 
            WHERE player_list_idx = $1;
        `;

        try {
            const result = await client.query(sql, [player_list_idx]);

            if (result.rows.length > 0) {
                throw customError(403, `이미 해당 선수는 커뮤니티 운영진입니다.`);
            }

            next();
        } catch (e) {
            next(e);
        }
    };
};

// 해당 팀이 소속 커뮤니티가 존재하는 지 여부 확인 
const checkIsTeamInCommunity = () => {
    return async (req, res, next) => {
        const team_list_idx = req.body.team_list_idx ?? req.params.team_list_idx ?? req.query.team_list_idx;

        const sql = `
            SELECT *
            FROM community.team 
            WHERE team_list_idx = $1;
        `;

        try {
            const result = await client.query(sql, [team_list_idx]);

            if (result.rows.length > 0) {
                throw customError(403, `해당 팀은 이미 커뮤니티에 소속되어 있습니다.`);
            }

            next();
        } catch (e) {
            next(e);
        }
    };
};

// 매치의 마감 여부를 확인
const checkMatchNotClosed = () => {
    return async (req, res, next) => {
        const match_match_idx = req.body.match_match_idx ?? req.params.match_match_idx ?? req.query.match_match_idx;

        const sql = `
            SELECT common_status_idx 
            FROM match.match 
            WHERE match_match_idx = $1
        `;

        try {
            const result = await client.query(sql, [match_match_idx]);
            const commonStatusIdx = result.rows[0].common_status_idx;

            if (commonStatusIdx === COMMON_STATUS.MATCH_LINEUP_CLOSED) {
                throw customError(403, "이미 마감된 매치입니다.");
            }

            next();
        } catch (e) {
            next(e);
        }
    };
};

// 매치의 스탯 입력 마감 여부를 확인
const checkMatchStatsPostClosed = () => {
    return async (req, res, next) => {
        const match_match_idx = req.body.match_match_idx ?? req.params.match_match_idx ?? req.query.match_match_idx;

        const sql = `
            SELECT common_status_idx 
            FROM match.match 
            WHERE match_match_idx = $1
        `;

        try {
            const result = await client.query(sql, [match_match_idx]);
            const commonStatusIdx = result.rows[0].common_status_idx;

            if (commonStatusIdx === COMMON_STATUS.MATCH_STATS_CLOSED) {
                throw customError(403, "이미 마감된 매치입니다.");
            }

            next();
        } catch (e) {
            next(e);
        }
    };
};

// 참여하려는 포지션 인덱스가 해당 포메이션에 실제로 존재하는지 확인하는
const checkPositionInFormation = () => {
    return async (req, res, next) => {
        try {
            const match_position_idx = Number(
                req.body.match_position_idx ??
                req.params.match_position_idx ??
                req.query.match_position_idx
            );
            const {match_formation_idx} = req.matchInfo
    
            const validPositions = MATCH_FORMATION_POSITIONS[match_formation_idx];
            console.log("validPositions:", validPositions)

            if (!validPositions.includes(match_position_idx)) {
            throw customError(403, "해당 포지션은 선택한 포메이션에 존재하지 않습니다.");
            }
  
            next();
        } catch (e) {
            next(e);
        }
    };
};

// 매치 생성자인지 확인
const checkIsMatchOwner = () => {
    return async (req, res, next) => {
        const my_player_list_idx = req.decoded.my_player_list_idx;
        const {match_creator_idx,team_captain_idx} = req.matchInfo

        try {
            if (my_player_list_idx != match_creator_idx &&
                (!team_captain_idx || my_player_list_idx != team_captain_idx)) {
                throw customError(403, '해당 매치를 생성한 사용자가 아니거나 주장이 아닙니다.');
            }

            next();
        } catch (e) {
            next(e);
        }
    };
};

// 같은 시간대에 진행중인 매치에 참여하고 있는지 확인
const checkMatchOverlap = () => {
    return async (req, res, next) => {
        const my_player_list_idx = req.decoded.my_player_list_idx;
        const match_match_idx = req.body.match_match_idx ?? req.params.match_match_idx ?? req.query.match_match_idx;

        try {
            // 1. 매치 시작시간과 지속시간 가져오기
            const matchResult = await client.query(
                `SELECT match_match_start_time, match_match_duration
                 FROM match.match
                 WHERE match_match_idx = $1`,
                [match_match_idx]
            );

            const { match_match_start_time, match_match_duration } = matchResult.rows[0];

            // 2. JS에서 endTime 계산 (PostgresInterval 객체 파싱)
            const durationMs =
                (match_match_duration.hours ?? 0) * 60 * 60 * 1000 +
                (match_match_duration.minutes ?? 0) * 60 * 1000 +
                (match_match_duration.seconds ?? 0) * 1000;

            const startTime = new Date(match_match_start_time);
            const endTime = new Date(startTime.getTime() + durationMs);

            console.log(startTime,endTime)

            // PostgreSQL에서 tstzrange 타입으로 비교
            const overlapResult = await client.query(
                `SELECT 1 FROM match.participant
                 WHERE player_list_idx = $1
                 AND match_time_range && tstzrange($2::timestamptz, $3::timestamptz)`,
                [my_player_list_idx, startTime.toISOString(), endTime.toISOString()]
            );

            if (overlapResult.rowCount > 0) {
                throw customError(403, '이미 해당 시간대에 다른 매치에 참여 중입니다.');
            }

            next();
        } catch (err) {
            next(err);
        }
    };
};

// 게시글 작성자 인지 확인하는
const checkIsPostOwner = () => {
    return async (req, res, next) => {
        const my_player_list_idx = req.decoded.my_player_list_idx;
        const board_list_idx = req.body.match_match_idx ?? req.params.match_match_idx ?? req.query.match_match_idx;

        try {
            const result = await client.query(
                `SELECT board_list_idx FROM board.list 
                 WHERE board_list_idx = $1 AND player_list_idx = $2`,
                [board_list_idx, my_player_list_idx]
            );

            if (result.rowCount === 0) {
                throw customError(403, '해당 게시글의 작성자가 아닙니다.');
            }

            next();
        } catch (err) {
            next(err);
        }
    };
};

// 해당 게시글에 좋아요를 눌렀는지 여부
const checkAlreadyLiked = () => {
    return async (req, res, next) => {
        const my_player_list_idx = req.decoded.my_player_list_idx;
        const board_list_idx = req.body.board_list_idx ?? req.params.board_list_idx ?? req.query.board_list_idx;

        try {
            const result = await client.query(
                `SELECT 1 FROM board.like
                 WHERE player_list_idx = $1 AND board_list_idx = $2`,
                [my_player_list_idx, board_list_idx]
            );

            if (result.rowCount > 0) {
                throw customError(403, '이미 좋아요를 누른 게시글입니다.');
            }

            next();
        } catch (err) {
            next(err);
        }
    };
};

// 게시글에 좋아요를 안 눌렀으면
const checkLikeExists = () => {
    return async (req, res, next) => {
        const my_player_list_idx = req.decoded.my_player_list_idx;
        const board_list_idx = req.body.board_list_idx ?? req.params.board_list_idx ?? req.query.board_list_idx;

        try {
            const result = await client.query(
                `SELECT 1 FROM board.like
                 WHERE player_list_idx = $1 AND board_list_idx = $2`,
                [my_player_list_idx, board_list_idx]
            );

            if (result.rowCount === 0) {
                throw customError(403, '아직 좋아요를 누르지 않은 게시글입니다.');
            }

            next();
        } catch (err) {
            next(err);
        }
    };
};

// 댓글 작성자인지 확인
const checkIsCommentOwner = () => {
    return async (req, res, next) => {
        const my_player_list_idx = req.decoded.my_player_list_idx;
        const board_comment_idx = req.body.board_comment_idx ?? req.params.board_comment_idx ?? req.query.board_comment_idx;

        try {
            const result = await client.query(
                `SELECT 1 FROM board.comment
                 WHERE board_comment_idx = $1 AND player_list_idx = $2`,
                [board_comment_idx, my_player_list_idx]
            );

            if (result.rowCount === 0) {
                throw customError(403, '본인이 작성한 댓글이 아닙니다.');
            }

            next();
        } catch (err) {
            next(err);
        }
    };
};

// 팀이 다른 커뮤니티에 소속되어 있는지 확인하는
const checkTeamNotJoinedCommunity = () => {
    return async (req, res, next) => {
        const teamIdx = req.decoded.my_team_list_idx;

        try {
            const result = await client.query(
                `SELECT 1 FROM community.team
                 WHERE team_list_idx = $1`,
                [teamIdx]
            );

            if (result.rowCount > 0) {
                throw customError(403, '해당 팀은 이미 커뮤니티에 소속되어 있습니다.');
            }

            next();
        } catch (err) {
            next(err);
        }
    };
};

// 두 팀이 대회에 참여한 팀인지 확인
const checkBothTeamsInChampionship = () => {
    return async (req, res, next) => {
        const firstTeamIdx = req.body.first_team_idx ?? req.params.first_team_idx ?? req.query.first_team_idx;
        const secondTeamIdx = req.body.second_team_idx ?? req.params.second_team_idx ?? req.query.second_team_idx;
        const championshipIdx = req.body.championship_list_idx ?? req.params.championship_list_idx ?? req.query.championship_list_idx;

        try {
            const result = await client.query(
                `SELECT team_list_idx FROM championship.participation_team
                 WHERE championship_list_idx = $1
                   AND team_list_idx IN ($2, $3)`,
                [championshipIdx, firstTeamIdx, secondTeamIdx]
            );

            const joinedTeamIdxSet = new Set(result.rows.map(r => r.team_list_idx));

            if (!joinedTeamIdxSet.has(Number(firstTeamIdx)) || !joinedTeamIdxSet.has(Number(secondTeamIdx))) {
                throw customError(403, '두 팀 중 하나 이상이 해당 대회에 참가하지 않았습니다.');
            }

            next();
        } catch (err) {
            next(err);
        }
    };
};


// 해당 포지션에 참여자가 존재하는지
const checkIsTherePositionParticipant = () => {
    return async (req, res, next) => {
        const matchIdx = req.body.match_match_idx ?? req.params.match_match_idx ?? req.query.match_match_idx;
        const positionIdx = req.body.match_position_idx ?? req.params.match_position_idx ?? req.query.match_position_idx;

        try {
            const result = await client.query(
                `SELECT 1 FROM match.participant
                 WHERE match_match_idx = $1 AND match_position_idx = $2`,
                [matchIdx, positionIdx]
            );

            if (result.rowCount > 0) {
                throw customError(409, '해당 포지션은 이미 다른 참가자가 있습니다.');
            }

            next();
        } catch (err) {
            next(err);
        }
    };
};

// 매치가 이미 종료됬는지 여부 체크
const checkMatchNotEnded = () => {
    return async (req, res, next) => {
        try {
            const { match_match_start_time, match_match_duration } = req.matchInfo
           
            const start = new Date(match_match_start_time);
            const end = new Date(start);

            if (match_match_duration.hours) {
                end.setHours(end.getHours() + parseInt(match_match_duration.hours));
            }
            if (match_match_duration.minutes) {
                end.setMinutes(end.getMinutes() + parseInt(match_match_duration.minutes));
            }

            const now = new Date();

            if (now >= end) {
                throw customError(403, "이미 종료된 매치입니다.");
            }

            next();
        } catch (err) {
            next(err);
        }
    };
};


module.exports = {
    checkTeamMatchCooldown,
    checkTeamMemberCount,
    checkPlayerNotInTeam,
    checkMatchEnded,
    checkMatchNotStarted,
    checkChampionshipMatchStatus,
    checkIsCommunityAdmin,
    checkIsTeamInCommunity,
    checkMatchNotClosed,
    checkMatchStatsPostClosed,
    checkPositionInFormation,
    checkIsMatchOwner,
    checkMatchOverlap,
    checkIsPostOwner,
    checkAlreadyLiked,
    checkLikeExists,
    checkIsCommentOwner,
    checkTeamNotJoinedCommunity,
    checkBothTeamsInChampionship,
    checkIsTherePositionParticipant,
    checkMatchNotEnded
}
