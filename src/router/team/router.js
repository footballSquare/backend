const router = require("express").Router()

const {
    getTeamList,
    postTeam,
    getTeam,
    getMember
} = require("./service")

// 팀 목록보기
router.get("/list",
    getTeamList
)

// 팀 생성하기
router.post("/",
    postTeam
)

// 팀 페이지 상세 정보 보기
router.get("/:team_list_idx/information",
    getTeam
)

router.get("/:team_list_idx/member",
    getMember
)

module.exports = router
