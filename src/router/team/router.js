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
    regChampionshipAwardName,
    regChampionshipPeriod
} = require("../../constant/regx")

const { multerMiddleware } = require("../../database/s3Config/multerMiddleware")

const { 
    checkLogin, 
    optionalLogin 
} = require("../../middleware/checkLogin")

const {
    s3Uploader
} = require("../../middleware/s3UpLoader")

const {
    checkRegInput,
    checkIdx,
    checkPage,
    checkMatchFormation,
    checkMatchParticipationType,
    checkMatchType,
    checkMatchAttribute,
    checkPosition
} = require("../../middleware/checkInput")

const {
    checkHasTeam,
    checkIsTeamMember,
    checkIsTeamLeader
} = require("../../middleware/checkRole")

const {
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
} = require("../../middleware/checkData")

const {
    checkTeamMatchCooldown,
    checkTeamMemberCount,
    checkPlayerNotInTeam
} = require("../../middleware/checkCondition")

const {
    checkTeamNameDuplicate,
    checkTeamShortNameDuplicate
} = require("../../middleware/checkDuplicate")

const {
    getTeamList,
    getRecruitingTeamList,
    postTeam,
    getTeam,
    getMember,
    getTeamAward,
    getTeamHistory,
    teamMemberDeny,
    changeMemberRole,
    kickMember,
    teamApplication,
    teamApplicationList,
    changeTeamData,
    checkTeamName,
    checkTeamShortName,
    deleteTeam,
    teamMemberApproval,
    teamLeave,
    changeTeamEmblem,
    changeTeamBanner
} = require("./service")

// 팀 목록보기
router.get("/list",
    optionalLogin,
    getTeamList
)

// 팀 목록보기
router.get("/list/recruiting",
    optionalLogin,
    getRecruitingTeamList
)

// 팀 페이지 상세 정보 보기
router.get("/:team_list_idx/information",
    checkIdx("team_list_idx"),
    checkIsTeam,
    optionalLogin,
    getTeam
)

// 팀 페이지 멤버 목록보기
router.get("/:team_list_idx/member",
    checkIdx("team_list_idx"),
    checkIsTeam,
    getMember
)

// 수상 목록 보기
router.get("/:team_list_idx/award",
    checkIdx("team_list_idx"),
    checkIsTeam,
    getTeamAward
)

// 팀 연혁 보기
router.get("/:team_list_idx/history",
    checkIdx("team_list_idx"),
    checkIsTeam,
    getTeamHistory
)

// 팀 생성하기
router.post("/",
    checkRegInput(regTeamName,"team_list_name"),
    checkRegInput(regTeamShortName,"team_list_short_name"),
    checkRegInput(regColor,"team_list_color"),
    checkRegInput(regTeamAnnouncement,"team_list_announcement"),
    checkLogin,
    checkHasTeam(),
    checkTeamNameDuplicate(),
    checkTeamShortNameDuplicate(),
    postTeam
)

// 팀 정보 수정하기
router.put("/:team_list_idx",
    checkIdx("team_list_idx"),
    checkLogin,
    checkIsTeamMember(),
    checkIsTeamLeader(),
    checkIsTeam,
    changeTeamData
)

// 팀명 중복 확인하기
router.get("/check_name/:team_list_name",
    checkRegInput(regTeamName,"team_list_name"),
    checkTeamName
)

// 팀 약칭 중복 확인하기
router.get("/check_short_name/:team_list_short_name",
    checkRegInput(regTeamShortName,"team_list_short_name"),
    checkTeamShortName
)

// 팀 엠블렘 수정하기
router.put("/:team_list_idx/emblem",
    multerMiddleware,
    checkIdx("team_list_idx"),
    checkLogin,
    checkIsTeamMember(),
    checkIsTeamLeader(),
    checkIsTeam,
    checkTeamMemberCount(),
    s3Uploader("team"),
    changeTeamEmblem
)

// 팀 배너 수정하기
router.put("/:team_list_idx/banner",
    multerMiddleware,
    checkIdx("team_list_idx"),
    checkLogin,
    checkIsTeamMember(),
    checkIsTeamLeader(),
    checkIsTeam,
    checkTeamMemberCount(),
    s3Uploader("team"),
    changeTeamBanner
)

// 팀 해체하기
router.delete("/:team_list_idx",
    checkIdx("team_list_idx"),
    checkLogin,
    checkIsTeamMember(),
    checkIsTeamLeader(),
    checkIsTeam,
    checkTeamMatchCooldown,
    deleteTeam
)


// 팀 멤버 가입 승인
router.post("/:team_list_idx/member/:player_list_idx/access",
    checkIdx("team_list_idx"),
    checkIdx("player_list_idx"),
    checkLogin,
    checkIsTeamMember(),
    checkIsTeamLeader(),
    checkIsTeam,
    checkIsPlayer,
    checkPlayerNotInTeam(),
    teamMemberApproval
)

// 팀 멤버 가입 거절
router.delete("/:team_list_idx/member/:player_list_idx/access",
    checkIdx("team_list_idx"),
    checkIdx("player_list_idx"),
    checkLogin,
    checkIsTeamMember(),
    checkIsTeamLeader(),
    checkIsTeam,
    checkIsPlayer,
    teamMemberDeny
)

// 멤버 역할 변경
router.put("/:team_list_idx/member/:player_list_idx/role/:team_role_idx",
    checkIdx("team_list_idx"),
    checkIdx("player_list_idx"),
    checkIdx("team_role_idx"),
    checkLogin,
    checkIsTeamMember(),
    checkIsTeamLeader(),
    checkIsTeam,
    checkIsPlayer,
    changeMemberRole
)

// 팀 멤버 추방
router.delete("/:team_list_idx/member/:player_list_idx/kick",
    checkIdx("team_list_idx"),
    checkIdx("player_list_idx"),
    checkLogin,
    checkIsTeamMember(),
    checkIsTeamLeader(),
    checkIsTeam,
    checkIsPlayer,
    kickMember
)

// 팀 가입 신청 하기
router.put("/:team_list_idx/application",
    checkIdx("team_list_idx"),
    checkLogin,
    checkHasTeam(),
    checkIsTeam,
    teamApplication
)

// 팀 가입 신청 인원 목록 보기
router.get("/:team_list_idx/application/list",
    checkIdx("team_list_idx"),
    checkLogin,
    checkIsTeamMember(),
    checkIsTeamLeader(),
    checkIsTeam,
    teamApplicationList
)

// 팀 탈퇴하기
router.delete("/:team_list_idx/leave",
    checkIdx("team_list_idx"),
    checkLogin,
    checkIsTeamMember(),
    checkIsTeam,
    checkIsReallyPlayer(),
    teamLeave
)



module.exports = router
