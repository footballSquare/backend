const router = require("express").Router()

const { 
    multerMiddleware,
    multerArrayMiddleware
 } = require("../../database/s3Config/multerMiddleware")

const {
    s3Uploader,
    s3UploaderForChampionshipEvidence
} = require("../../middleware/s3UpLoader")

const {
    checkHasTeam,
    checkIsTeamMember,
    checkIsTeamLeader,
    checkIsTeamSubLeader,
    checkIsTeamMemberAtMatch
} = require("../../middleware/checkRole")

const {
    regColor,
    regMatchDuration,
    regMatchDatetime,
    regTeamName,
    regTeamShortName,
    regTeamAnnouncement,
    regChampionshipName,
    regChampionshipDescription,
    regChampionshipPeriod,
    regMatchName
} = require("../../constant/regx")

const {
    checkTeamStatsFileLimitMiddleware,
    checkPlayerStatsFileLimitMiddleware
} = require("../../middleware/checkFileLimit")

const { 
    checkLogin, 
    optionalLogin 
} = require("../../middleware/checkLogin")

const {
    checkIsTeam,
    checkIsMatch,
    checkIsCommunity,
    checkIsChampionship,
    checkIsChampionshipMatch,
    checkIsFormation,
    checkIsPlayer
} = require("../../middleware/checkData")

const {
    checkRegInput,
    checkIdx,
    checkPage,
    checkMatchFormation,
    checkMatchParticipationType,
    checkMatchType,
    checkMatchAttribute,
    checkPosition,
    checkMatchStartTimeValid,
    checkMatchDuration
} = require("../../middleware/checkInput")

const {
    getMatchAndTeamInfo
} = require("../../middleware/getMatchInfo")

const {
    checkMatchEnded,
    checkMatchNotStarted,
    checkMatchNotClosed,
    checkMatchStatsPostClosed,
    checkPositionInFormation,
    checkIsMatchOwner,
    checkMatchOverlap,
    checkIsTherePositionParticipant,
    checkMatchNotEnded,
    checkAlreadyWaitList,
    checkIfChampionshipMatchOnly,
    checkIsOpenMatch,
    checkIsTeamMatch
} = require("../../middleware/checkCondition")

const {
    getTeamMatchList,
    getOpenMatchList,
    postOpenMatch,
    deleteMatch,
    getMatchStanbyList,
    getMatchDetailData,
    postTeamMatch,
    putTeamMatch,
    changeMatchAttribute,
    closedMatch,
    getMatchParticipantList,
    getMatchWaitList,
    waitApproval,
    joinOpenMatch,
    joinTeamMatch,
    leaveMatch,
    postTeamStats,
    postTeamStatsEvidence,
    postPlayerStatsEvidence,
    postPlayerStats
} = require("./service")

// 팀 매치 목록 가져오기
router.get("/team/:team_list_idx",
    checkIdx("team_list_idx"),
    checkPage(),
    checkIsTeam,
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
    checkRegInput(regMatchName,"match_match_name"),
    checkMatchFormation(),
    checkMatchParticipationType(),
    checkMatchType(),
    checkRegInput(regMatchDatetime,"match_match_start_time"),
    checkMatchDuration(),
    checkMatchStartTimeValid(),
    checkLogin,
    checkIsTeamMember(),
    checkIsTeamSubLeader(),
    checkIsTeam,
    postTeamMatch
)

// 공방 매치 생성하기
router.post("/open",
    checkMatchFormation(),
    checkRegInput(regMatchName,"match_match_name"),
    checkMatchParticipationType(),
    checkMatchType(),
    checkRegInput(regMatchDatetime,"match_match_start_time"),
    checkMatchDuration(),
    checkMatchStartTimeValid(),
    checkLogin,
    postOpenMatch
)

// 팀 매치 수정하기
// router.put("/:match_match_idx/team/:team_list_idx",
//     checkIdx("team_list_idx"),
//     checkIdx("match_match_idx"),
//     checkMatchFormation(),
//     checkMatchParticipationType(),
//     checkMatchAttribute(),
//     checkRegInput(regMatchDatetime,"match_match_start_time"),
//     checkRegInput(regMatchDuration,"match_match_duration"),
//     checkLogin,
//     checkIsTeamSubLeader(),
//     getMatchAndTeamInfo,
//     checkIsTeamMemberAtMatch(),
//     checkMatchNotStarted(),
//     putTeamMatch
// )

// 팀 매치 공개 / 비공개 매치로 변경
router.put("/:match_match_idx/team/:team_list_idx",
    checkIdx("match_match_idx"),
    checkLogin,
    getMatchAndTeamInfo,
    checkIsMatchOwner(),
    checkMatchNotEnded(),
    checkIsTeamMatch(),
    changeMatchAttribute
)

// 매치 마감하기
router.put("/:match_match_idx",
    checkIdx("match_match_idx"),
    checkLogin,
    getMatchAndTeamInfo,
    checkIsMatchOwner(),
    checkMatchEnded(),
    closedMatch
)

// 매치 삭제하기
router.delete("/:match_match_idx",
    checkIdx("match_match_idx"),
    checkLogin,
    getMatchAndTeamInfo,
    checkIsMatchOwner(),
    checkMatchNotStarted(),
    deleteMatch
)

// 매치 참여 희망자 목록 가져오기
router.get("/stanbylist",
    getMatchStanbyList
)

// 매치 세부 정보 가져오기
router.get("/:match_match_idx",
    checkIdx("match_match_idx"),
    checkIsMatch,
    getMatchDetailData
)

// 매치 참여자 목록 가져오기
router.get("/:match_match_idx/participant",
    checkIdx("match_match_idx"),
    checkIsMatch,
    getMatchParticipantList
)

// 매치 참여 대기자 목록 가져오기
router.get("/:match_match_idx/waitlist",
    checkIdx("match_match_idx"),
    checkIsMatch,
    getMatchWaitList
)

// 매치 참여 승인 하기
router.post("/:match_match_idx/approval",
    checkIdx("match_match_idx"),
    checkLogin,
    getMatchAndTeamInfo,
    checkIsMatchOwner(),
    checkIsTherePositionParticipant(),
    checkMatchNotEnded(),
    waitApproval
)

// 공개 매치 참여하기
router.put("/:match_match_idx/open/join",
    checkIdx("match_match_idx"),
    checkIdx("match_position_idx"),
    checkPosition(),
    checkLogin,
    getMatchAndTeamInfo,
    checkIsOpenMatch(),
    checkMatchOverlap(),
    checkMatchNotEnded(),
    checkPositionInFormation(),
    checkAlreadyWaitList(),
    checkIsTherePositionParticipant(),
    joinOpenMatch
)

// 팀 매치 참여하기
router.put("/:match_match_idx/team/:team_list_idx/join",
    checkIdx("match_match_idx"),
    checkIdx("team_list_idx"),
    checkIdx("match_position_idx"),
    checkPosition(),
    checkLogin,
    getMatchAndTeamInfo,
    checkIsTeamMemberAtMatch(),
    checkMatchOverlap(),
    checkMatchNotEnded(),
    checkPositionInFormation(),
    checkAlreadyWaitList(),
    checkIsTherePositionParticipant(),
    joinTeamMatch
)

// 매치 참여 해제하기
router.delete("/:match_match_idx/leave",
    checkIdx("match_match_idx"),
    checkLogin,
    getMatchAndTeamInfo,
    checkMatchNotClosed(),
    leaveMatch
)

// 매치 팀 스탯 작성 / 수정하기
router.post("/:match_match_idx/team_stats",
    checkIdx("match_team_stats_our_score"),
    checkIdx("match_team_stats_other_score"),
    checkIdx("match_team_stats_possession"),
    checkIdx("match_team_stats_possession"),
    checkIdx("match_team_stats_total_shot"),
    checkIdx("match_team_stats_expected_goal"),
    checkIdx("match_team_stats_total_pass"),
    checkIdx("match_team_stats_total_tackle"),
    checkIdx("match_team_stats_saved"),
    checkIdx("match_team_stats_cornerkick"),
    checkIdx("match_team_stats_freekick"),
    checkIdx("match_team_stats_penaltykick"),
    checkIdx("mom_player_idx"),
    checkLogin,
    getMatchAndTeamInfo,
    checkIfChampionshipMatchOnly(),
    checkIsTeamMemberAtMatch(),
    checkIsTeamLeader(),
    checkMatchStatsPostClosed(),
    postTeamStats
)

// 팀 스탯 증빙 자료 입력 / 수정
router.post("/:match_match_idx/team_stats/evidence_img",
    multerArrayMiddleware,
    checkLogin,
    getMatchAndTeamInfo,
    checkIfChampionshipMatchOnly(),
    checkIsTeamMemberAtMatch(),
    checkIsTeamLeader(),
    checkMatchStatsPostClosed(),
    checkTeamStatsFileLimitMiddleware,
    s3UploaderForChampionshipEvidence,
    postTeamStatsEvidence
)

// 개인 스탯 작성 / 수정하기
router.post("/:match_match_idx/player_stats",
    checkIdx("match_match_idx"),
    checkIdx("match_player_stats_goal"),
    checkIdx("match_player_stats_assist"),
    checkIdx("match_player_stats_successrate_pass"),
    checkIdx("match_player_stats_successrate_dribble"),
    checkIdx("match_player_stats_possession"),
    checkIdx("match_player_stats_successrate_tackle"),
    checkIdx("match_player_stats_standing_tackle"),
    checkIdx("match_player_stats_sliding_tackle"),
    checkIdx("match_player_stats_cutting"),
    checkIdx("match_player_stats_saved"),
    checkIdx("match_player_stats_successrate_saved"),
    checkLogin,
    getMatchAndTeamInfo,
    checkIfChampionshipMatchOnly(),
    checkIsTeamMemberAtMatch(),
    checkMatchStatsPostClosed(),
    postPlayerStats
)

// 개인 스탯 증빙자료 입력/수정하기
router.post("/:match_match_idx/player_stats/evidence_img",
    multerArrayMiddleware,
    checkLogin,
    getMatchAndTeamInfo,
    checkIfChampionshipMatchOnly(),
    checkIsTeamMemberAtMatch(),
    checkMatchStatsPostClosed(),
    checkPlayerStatsFileLimitMiddleware,
    s3UploaderForChampionshipEvidence,
    postPlayerStatsEvidence
)

module.exports = router