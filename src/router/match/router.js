const router = require("express").Router()

const {
    getTeamMatchList,
    getOpenMatchList,
    postOpenMatch,
    deleteMatch,
    getMatchDetailData,
    postTeamMatch,
    putTeamMatch,
    closedMatch,
    getMatchParticipantList,
    getMatchWaitList,
    waitApproval,
    joinOpenMatch
} = require("./service")

// 팀 매치 목록 가져오기
router.get("/team/:team_list_idx",
    getTeamMatchList
)

// 공개 매치 목록 가져오기
router.get("/open",
    getOpenMatchList
)

// 팀 매치 생성하기
router.post("/team/:team_list_idx",
    postTeamMatch
)

// 공방 매치 생성하기
router.post("/open",
    postOpenMatch
)

// 팀 매치 수정하기
router.put("/team/:team_list_idx",
    putTeamMatch
)

// 매치 마감하기
router.put("/:match_match_idx",
    closedMatch
)

// 매치 삭제하기
router.delete("/:match_match_idx",
    deleteMatch
)

// 매치 세부 정보 가져오기
router.get("/:match_match_idx",
    getMatchDetailData
)

// 매치 참여자 목록 가져오기
router.get("/:match_match_idx/participant",
    getMatchParticipantList
)

// 매치 참여 대기자 목록 가져오기
router.get("/:match_match_idx/waitlist",
    getMatchWaitList
)

// 매치 참여 승인 하기
router.post("/:match_match_idx/approval",
    waitApproval
)


// 공개 매치 참여하기
router.post("/:match_match_idx/open/join",
    joinOpenMatch
)
module.exports = router