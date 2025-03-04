const router = require("express").Router()

const {
    getOpenMatchData,
    postOpenMatch,
    deleteMatch,
    postTeamMatch
} = require("./service")

// 공개 매치 가져오기
router.get("/open",
    getOpenMatchData
)

// 공개 매치 생성하기
router.post("/open",
    postOpenMatch
)

// 팀 매치 생성하기
router.post("/team/:team_list_idx",
    postTeamMatch
)

// 매치 삭제하기
router.delete("/:match_match_idx",
    deleteMatch
)

module.exports = router