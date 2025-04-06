const router = require("express").Router()

const { multerMiddleware } = require("../../database/s3Config/multerMiddleware")

const { 
    checkLogin, 
    optionalLogin 
} = require("../../middleware/checkLogin")

const {
    s3Uploader
} = require("../../middleware/s3UpLoader")

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
    regChampionshipPeriod,
    regCommunityNotice
} = require("../../constant/regx")

const {
    checkIsCommunityAdminRole,
    checkHasCommunityRole,
    checkIsTeamLeader
} = require("../../middleware/checkRole")

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
    checkIsCommunityAdmin,
    checkIsTeamInCommunity,
    checkTeamNotJoinedCommunity
} = require("../../middleware/checkCondition")

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
    getCommunity,
    getCommunityStaff,
    getCommunityTeam,
    getCommunityChampionship,
    putCommunityNotice,
    putCommunityEmblem,
    putCommunityBanner,
    postChampioship,
    communityStaffAccess,
    communityStaffAccessDeny,
    kickCommunityStaff,
    communityStaffApplication,
    getCommunityStaffApplication,
    getCommunityTeamApplication,
    communityTeamApplication,
    communityTeamAccess,
    communityTeamAccessDeny,
    communityTeamKick
} = require("./service")

// 커뮤니티 정보 가져오기
router.get("/:community_list_idx",
    checkIdx("community_list_idx"),
    checkIsCommunity,
    getCommunity
)

// 커뮤니티 운영진 목록 가져오기
router.get("/:community_list_idx/staff",
    checkIdx("community_list_idx"),
    checkIsCommunity,
    getCommunityStaff
)

// 커뮤니티 소속 팀 목록 가져오기
router.get("/:community_list_idx/participation_team",
    checkIdx("community_list_idx"),
    checkIsCommunity,
    getCommunityTeam
)

// 커뮤니티 소속 진행 대회 목록 보기
router.get("/:community_list_idx/championship",
    checkIdx("community_list_idx"),
    checkIsCommunity,
    getCommunityChampionship
)

// 커뮤니티 공지 수정하기
router.put("/:community_list_idx/notice",
    checkLogin,
    checkIdx("community_list_idx"),
    checkRegInput(regCommunityNotice,"community_list_notice"),
    checkIsCommunityAdminRole(),
    putCommunityNotice
)

// 커뮤니티 엠블렘 수정하기
router.put("/:community_list_idx/emblem",
    checkLogin,
    checkIdx("community_list_idx"),
    checkIsCommunityAdminRole(),
    multerMiddleware,
    s3Uploader("team"),
    putCommunityEmblem
)

// 커뮤니티 배너 수정하기
router.put("/:community_list_idx/banner",
    checkLogin,
    checkIdx("community_list_idx"),
    checkIsCommunityAdminRole(),
    multerMiddleware,
    s3Uploader("team"),
    putCommunityBanner
)

// 대회 만들기
router.post("/:community_list_idx/championship",
    checkLogin,
    checkIsCommunityAdminRole(),
    multerMiddleware,
    checkIdx("community_list_idx"),
    checkRegInput(regChampionshipName,"championship_list_name"),
    checkRegInput(regChampionshipDescription,"championship_list_description"),
    checkRegInput(regColor,"championship_list_color"),
    checkRegInput(regChampionshipPeriod,"championship_list_start_date"),
    checkRegInput(regChampionshipPeriod,"championship_list_end_date"),
    checkIdx("participation_team_idxs"),
    checkRegInput(regChampionshipAwardName,"championship_award_name"),
    s3Uploader("championship"),
    postChampioship
)


// 커뮤니티 운영진 가입 승인
router.post("/:community_list_idx/staff/:player_list_idx/access",
    checkIdx("community_list_idx"),
    checkIdx("player_list_idx"),
    checkLogin,
    checkIsCommunityAdminRole(),
    checkIsPlayer,
    checkIsCommunityAdmin(),
    communityStaffAccess
)

// 커뮤니티 운영진 가입 거절
router.delete("/:community_list_idx/staff/:player_list_idx/access",
    checkIdx("community_list_idx"),
    checkIdx("player_list_idx"),
    checkLogin,
    checkIsCommunityAdminRole(),
    checkIsPlayer,
    communityStaffAccessDeny
)

// 커뮤니티 운영진 추방
router.delete("/staff/:player_list_idx/kick",
    checkIdx("player_list_idx"),
    checkLogin,
    checkIsCommunityAdminRole(),
    checkIsPlayer,
    kickCommunityStaff
)

// 커뮤니티 운영진 가입 신청
router.post("/:community_list_idx/staff/application",
    checkIdx("community_list_idx"),
    checkLogin,
    checkIsCommunity,
    checkHasCommunityRole(),
    communityStaffApplication
)

// 커뮤니티 운영진 가입 신청 목록 보기
router.get("/:community_list_idx/staff/application",
    checkIdx("community_list_idx"),
    checkIsCommunity,
    getCommunityStaffApplication
)

// 커뮤니티 팀 가입 신청 목록 보기
router.get("/:community_list_idx/team/application",
    checkIdx("community_list_idx"),
    checkIsCommunity,
    getCommunityTeamApplication
)

// 커뮤니티 팀 가입 신청
router.post("/:community_list_idx/team/application",
    checkIdx("community_list_idx"),
    checkLogin,
    checkIsTeamLeader(),
    checkTeamNotJoinedCommunity(),
    checkIsCommunity,
    communityTeamApplication
)

// 커뮤니티 팀 가입 신청 승인
router.post("/team/:team_list_idx/access",
    checkIdx("team_list_idx"),
    checkLogin,
    checkIsCommunityAdminRole(),
    checkIsTeam,
    checkIsTeamInCommunity(),
    communityTeamAccess
)

// 커뮤니티 팀 가입 신청 거절
router.delete("/team/:team_list_idx/access",
    checkIdx("team_list_idx"),
    checkLogin,
    checkIsCommunityAdminRole(),
    checkIsTeam,
    communityTeamAccessDeny
)

// 커뮤니티 팀 추방
router.delete("/team/:team_list_idx/kick",
    checkIdx("team_list_idx"),
    checkLogin,
    checkIsCommunityAdminRole(),
    checkIsTeam,
    communityTeamKick
)



module.exports = router