const customError = require("../util/customError")
const client = require("../database/postgreSQL")

const checkTeamStatsFileLimitMiddleware = async (req, res, next) => {
    try {
        const { match_match_idx } = req.params;
        const { my_team_list_idx } = req.decoded;
        const urls = req.body.url || []
        const newFiles = req.file || []

        console.log(newFiles)

        // DB에서 현재 등록된 이미지 URL들 조회
        const { rows } = await client.query(`
            SELECT *
            FROM match.team_stats
            WHERE match_match_idx = $1 AND team_list_idx = $2
        `, [match_match_idx, my_team_list_idx]);

        const teamStatsRow = rows[0] || null;
        const existingUrls = teamStatsRow?.match_team_stats_evidence_img || [];

        // db에 존재하는 url만 검증
        const verifiedUrls = urls.filter(url => existingUrls.includes(url));
        const total = verifiedUrls.length + newFiles.length;

        if (total > 5) {
            throw customError(400, `이미지 총합이 5장을 초과할 수 없습니다. (현재: ${total})`);
        }

        req.teamStatsRow = teamStatsRow;
        req.verifiedUrls = verifiedUrls;

        next();
    } catch (err) {
      console.error("❌ 이미지 개수 제한 체크 실패:", err.message);
      return res.status(500).json({ message: "서버 오류로 이미지 업로드 제한 확인 실패" });
    }
};

const checkPlayerStatsFileLimitMiddleware = async (req, res, next) => {
  try {
    const { match_match_idx } = req.params;
    const { my_player_list_idx } = req.decoded;
    const urls = req.body.url || [];
    const newFiles = req.files || [];

    // DB에서 현재 등록된 개인 스탯 증빙 이미지 조회
    const { rows } = await client.query(`
      SELECT *
      FROM match.player_stats
      WHERE match_match_idx = $1 AND player_list_idx = $2
    `, [match_match_idx, my_player_list_idx]);

    const playerStatsRow = rows[0] || null;
    const existingUrls = playerStatsRow?.match_player_stats_evidence_img || [];

    // 실제 DB에 존재하는 URL만 필터링
    const verifiedUrls = urls.filter(url => existingUrls.includes(url));
    const total = verifiedUrls.length + newFiles.length;

    if (total > 5) {
      throw customError(400, `이미지 총합이 5장을 초과할 수 없습니다. (현재: ${total})`);
    }

    // 다음 미들웨어에서 사용할 수 있도록 주입
    req.playerStatsRow = playerStatsRow;
    req.verifiedUrls = verifiedUrls;

    next();
  } catch (err) {
    console.error("❌ 개인 스탯 이미지 개수 제한 체크 실패:", err.message);
    return res.status(500).json({ message: "서버 오류로 이미지 업로드 제한 확인 실패" });
  }
};


module.exports = {
    checkTeamStatsFileLimitMiddleware,
    checkPlayerStatsFileLimitMiddleware
}