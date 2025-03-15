const router = require("express").Router()

const {
    regColor,
    regMatchDuration,
    regMatchDatetime,
    regTeamName,
    regTeamShortName,
    regTeamAnnouncement,
    regChampionshipName,
    regChampionshipDescription,
    regChampionshipPeriod
} = require("../../constant/regx")

const {
    checkRegInput,
    checkIdx,
    checkPage,
    checkMatchFormation,
    checkMatchParticipationType,
    checkMatchType,
    checkMatchAttribute
} = require("../../middleware/checkInput")

const {
    getMatchAndTeamInfo
} = require("../../middleware/getMatchInfo")

const {
    uploadFileToS3
} = require("../../middleware/useS3")

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
    joinOpenMatch,
    joinTeamMatch,
    leaveMatch,
    postTeamStats,
    putTeamStats,
    postPlayerStats,
    putPlayerStats
} = require("./service")

// 팀 매치 목록 가져오기
router.get("/team/:team_list_idx",
    checkIdx("team_list_idx"),
    checkPage(),
    getTeamMatchList
)

// 공개 매치 목록 가져오기
router.get("/open",
    checkPage(),
    getOpenMatchList
)

// 팀 매치 생성하기
router.post("/team/:team_list_idx",
    checkIdx("team_list_idx"),
    checkMatchFormation(),
    checkMatchParticipationType(),
    checkMatchType(),
    checkMatchAttribute(),
    checkRegInput(regMatchDatetime,"match_match_start_time"),
    checkRegInput(regMatchDuration,"match_match_duration"),
    postTeamMatch
)

// 공방 매치 생성하기
router.post("/open",
    checkMatchFormation(),
    checkMatchParticipationType(),
    checkMatchType(),
    checkRegInput(regMatchDatetime,"match_match_start_time"),
    checkRegInput(regMatchDuration,"match_match_duration"),
    postOpenMatch
)

// 팀 매치 수정하기
router.put("/team/:team_list_idx",
    checkIdx("team_list_idx"),
    putTeamMatch
)

// 매치 마감하기
router.put("/:match_match_idx",
    checkIdx("match_match_idx"),
    closedMatch
)

// 매치 삭제하기
router.delete("/:match_match_idx",
    checkIdx("match_match_idx"),
    deleteMatch
)

// 매치 세부 정보 가져오기
router.get("/:match_match_idx",
    checkIdx("match_match_idx"),
    getMatchDetailData
)

// 매치 참여자 목록 가져오기
router.get("/:match_match_idx/participant",
    checkIdx("match_match_idx"),
    getMatchParticipantList
)

// 매치 참여 대기자 목록 가져오기
router.get("/:match_match_idx/waitlist",
    checkIdx("match_match_idx"),
    getMatchWaitList
)

// 매치 참여 승인 하기
router.post("/:match_match_idx/approval",
    checkIdx("match_match_idx"),
    waitApproval
)

// 공개 매치 참여하기
router.post("/:match_match_idx/open/join",
    checkIdx("match_match_idx"),
    joinOpenMatch
)

// 팀 매치 참여하기
router.post("/:match_match_idx/team/join",
    checkIdx("match_match_idx"),
    joinTeamMatch
)

// 매치 참여 해제하기
router.delete("/:match_match_idx/leave",
    checkIdx("match_match_idx"),
    getMatchAndTeamInfo,
    leaveMatch
)

// 매치 팀 스탯 작성하기
router.post("/:match_match_idx/team_stats",
    checkIdx("match_match_idx"),
    uploadFileToS3("evidance"),
    postTeamStats
)

// 매치 팀 스탯 수정하기
router.put("/:match_match_idx/team_stats",
    checkIdx("match_match_idx"),
    putTeamStats
)


// 개인 스탯 작성하기
router.post("/:match_match_idx/player_stats",
    checkIdx("match_match_idx"),
    uploadFileToS3("evidance"),
    postPlayerStats
)

// 개인 스탯 수정하기
router.put("/:match_match_idx/player_stats",
    checkIdx("match_match_idx"),
    putPlayerStats
)



module.exports = router