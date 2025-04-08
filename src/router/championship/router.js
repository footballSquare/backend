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
    checkLogin, 
    optionalLogin 
} = require("../../middleware/checkLogin")

const {
    checkIsCommunityAdminRole,
    checkHasCommunityRole,
    checkIsTeamLeader,
    checkIsCommunityStaffRole
} = require("../../middleware/checkRole")

const {
    checkRegInput,
    checkIdx,
    checkPage,
    checkMatchFormation,
    checkMatchParticipationType,
    checkMatchType,
    checkMatchAttribute,
    checkChampionshipType
} = require("../../middleware/checkInput")

const {
    checkChampionshipMatchStatus,
    checkBothTeamsInChampionship
} = require("../../middleware/checkCondition")

const {
    checkIsChampionshipMatch,
    checkIsChampionship
} = require("../../middleware/checkData")

const {
    doneChampionship,
    fetchDoneChampionship,
    postChampionShipMatch,
    deleteChampionShipMatch,
    championShipMatchDone,
    getChampionShipParticipationTeam,
    getChampionShipData,
    getChampionShipMatchList,
    fetchChampionShipMatch,
    fetchEvidanceImg,
    getChampionShipPlayerStats
} = require("./service")

// 대회 종료하기
router.put("/:championship_list_idx/done",
    checkIdx("championship_list_idx"),
    checkLogin,
    checkIsCommunityAdminRole(),
    checkIsChampionship,
    doneChampionship
)

// 대회 종료하기 정보 전달
router.get("/:championship_list_idx/done",
    checkIdx("championship_list_idx"),
    checkLogin,
    checkIsCommunityAdminRole(),
    checkIsChampionship,
    fetchDoneChampionship
)


// 대회 매치 생성하기
router.post("/:championship_list_idx/championship_match",
    checkIdx("championship_list_idx"),
    checkIdx("first_team_idx"),
    checkIdx("second_team_idx"),
    checkRegInput(regMatchDatetime,"match_match_start_time"),
    checkLogin,
    checkIsCommunityStaffRole(),
    checkBothTeamsInChampionship(),
    postChampionShipMatch
)

// 대회 매치 삭제하기
router.delete("/championship_match/:championship_match_idx",
    checkIdx("championship_match_idx"),
    checkLogin,
    checkIsCommunityStaffRole(),
    checkIsChampionshipMatch,
    deleteChampionShipMatch
)

// 대회 매치 마감하기
router.put("/championship_match/:championship_match_idx/done",
    checkIdx("championship_match_idx"),
    checkLogin,
    checkIsCommunityStaffRole(),
    checkIsChampionshipMatch,
    checkChampionshipMatchStatus(),
    championShipMatchDone
)

// 대회 매치 증빙자료 가져오기
router.get("/championship_match/:championship_match_idx/evidance_img",
    checkIdx("championship_match_idx"),
    checkIsChampionshipMatch,
    fetchEvidanceImg
)

// 대회 정보 가져오기
router.get("/:championship_list_idx",
    checkIdx("championship_list_idx"),
    checkIsChampionship,
    getChampionShipData
)

// 대회 참여 팀 가져오기
router.get("/:championship_list_idx/participation_team",
    checkIdx("championship_list_idx"),
    checkIsChampionship,
    getChampionShipParticipationTeam
)

// 대회 매치 목록 가져오기
router.get("/:championship_list_idx/championship_match",
    checkIdx("championship_list_idx"),
    getChampionShipMatchList
)

// 대회 매치 세부 정보 가져오기
router.get("/championship_match/:championship_match_idx/detail",
    checkIdx("championship_match_idx"),
    checkIsChampionshipMatch,
    fetchChampionShipMatch
)

// 대회 개인 스탯 가져오기
router.get("/:championship_list_idx/player_stats",
    checkIdx("championship_list_idx"),
    checkIsChampionship,
    getChampionShipPlayerStats
)

module.exports = router