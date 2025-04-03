const customError = require("../util/customError")
const client = require("../database/postgreSQL")

const checkExistsInDB = (table, column) => {
    return async (req, res, next) => {
        const value = req.body[column] ?? req.params[column] ?? req.query[column]
        

        const sql = `SELECT * FROM ${table} WHERE ${column} = $1`;

        try {
            const result = await client.query(sql, [value]);
            if (!result.rows.length) {
                throw customError(404, `${column} 가(이) 존재하지 않습니다.`);
            }
            next();
        } catch (e) {
            next(e);
        }
    };
};

// 진짜 존재하는 플레이어인지 체크
const checkIsReallyPlayer = () => {
    return async (req, res, next) => {
        const value = req.decoded.my_player_list_idx
        const sql = `SELECT * FROM player.list WHERE player_list_idx = $1`;

        try {
            const result = await client.query(sql, [value]);
            if (!result.rows.length) {
                throw customError(404, `선수가 존재하지 않습니다.`);
            }
            next();
        } catch (e) {
            next(e);
        }
    };
};


// 팀 존재 여부 확인
const checkIsTeam = checkExistsInDB("team.list", "team_list_idx");

// 매치 존재 여부 확인
const checkIsMatch = checkExistsInDB("match.match", "match_match_idx");

// 커뮤니티 존재 여부 확인
const checkIsCommunity = checkExistsInDB("community.list", "community_list_idx");

// 대회 존재 여부 확인
const checkIsChampionship = checkExistsInDB("championship.list", "championship_list_idx");

// 대회 매치 존재 여부 확인
const checkIsChampionshipMatch = checkExistsInDB("championship.championship_match", "championship_match_idx");

// 포메이션 존재 여부 확인
const checkIsFormation = checkExistsInDB("formation.list", "formation_idx");

// 플레이어 존재 여부 확인
const checkIsPlayer = checkExistsInDB("player.list", "player_list_idx");

// 게시판 존재 여부 확인
const checkIsBoard = checkExistsInDB("board.list","board_list_idx")

// 댓글 존재 여부 확인
const checkIsComment = checkExistsInDB("board.comment","board_comment_idx")


module.exports = {
    checkIsTeam,
    checkIsMatch,
    checkIsCommunity,
    checkIsChampionship,
    checkIsChampionshipMatch,
    checkIsFormation,
    checkIsPlayer,
    checkIsBoard,
    checkIsComment,
    checkIsReallyPlayer
}

