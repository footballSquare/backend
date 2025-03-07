const router = require("express").Router()

const {
    getTeamList,
    postTeam,
    getTeam,
    getMember,
    teamMemberDeny,
    teamApplication,
    teamApplicationList
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

// 팀 페이지 멤버 목록보기
router.get("/:team_list_idx/member",
    getMember
)

// 팀 멤버 가입 거절
router.delete("/:team_list_idx/member/:player_list_idx/access",
    teamMemberDeny
)

// 팀 가입 신청 하기
router.put("/:team_list_idx/application",
    teamApplication
)

// 팀 가입 신청 인원 목록 보기
router.get("/:team_list_idx/application/list",
    teamApplicationList
)
module.exports = router
