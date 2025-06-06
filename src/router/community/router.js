const router = require("express").Router()

const { 
    multerMiddleware,
    multerArrayMiddleware
 } = require("../../database/s3Config/multerMiddleware")

const { 
    checkLogin, 
    optionalLogin
} = require("../../middleware/checkLogin")

const {
    s3Uploader,
    s3UploaderMultiple,
    s3UploaderOptional
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
    regCommunityNotice,
    regBoardTitle,
    regBoardContent,
    regCommentContent
} = require("../../constant/regx")

const {
    checkIsCommunityAdminRole,
    checkHasCommunityRole,
    checkIsTeamLeader,
    checkIsYourCommunity
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
    checkTeamNotJoinedCommunity,
    checkTeamNotJoinedCommunityWaitList,
    checkIsAlreadyWaitlist
} = require("../../middleware/checkCondition")

const {
    checkRegInput,
    checkIdx,
    checkPage,
    checkMatchFormation,
    checkMatchParticipationType,
    checkMatchType,
    checkMatchAttribute,
    checkChampionshipType,
    validateAwardForm
} = require("../../middleware/checkInput")

const {
    checkChampionshipNameDuplicate
} = require("../../middleware/checkDuplicate")

const {
    getCommunityBoardList,
    // postCommunityBoard,
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

// 커뮤니티 게시글 목록 가져오기
router.get("/:community_list_idx/board",
    checkIdx("community_list_idx"),
    checkPage(),
    checkIsCommunity,
    getCommunityBoardList
)

// // 커뮤니티 게시글 작성하기
// router.post("/:community_list_idx/board",
//     multerMiddleware,
//     checkRegInput(regBoardTitle,"board_list_title"),
//     checkRegInput(regBoardContent,"board_list_content"),
//     checkLogin,
//     checkIsCommunityAdminRole(),
//     checkIsYourCommunity(),
//     s3UploaderOptional("board"),
//     postCommunityBoard
// )

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
    checkIsYourCommunity(),
    putCommunityNotice
)

// 커뮤니티 엠블렘 수정하기
router.put("/:community_list_idx/emblem",
    checkLogin,
    checkIdx("community_list_idx"),
    checkIsCommunityAdminRole(),
    checkIsYourCommunity(),
    multerMiddleware,
    s3Uploader("team"),
    putCommunityEmblem
)

// 커뮤니티 배너 수정하기
router.put("/:community_list_idx/banner",
    checkLogin,
    checkIdx("community_list_idx"),
    checkIsCommunityAdminRole(),
    checkIsYourCommunity(),
    multerMiddleware,
    s3Uploader("team"),
    putCommunityBanner
)

// 대회 만들기
router.post("/:community_list_idx/championship",
    checkLogin,
    checkIsCommunityAdminRole(),
    checkIsYourCommunity(),
    multerArrayMiddleware,
    checkIdx("community_list_idx"),
    checkRegInput(regChampionshipName,"championship_list_name"),
    checkRegInput(regChampionshipDescription,"championship_list_description"),
    checkRegInput(regColor,"championship_list_color"),
    checkRegInput(regChampionshipPeriod,"championship_list_start_date"),
    checkRegInput(regChampionshipPeriod,"championship_list_end_date"),
    checkIdx("participation_team_idxs"),
    checkRegInput(regChampionshipAwardName,"championship_award_name"),
    checkChampionshipNameDuplicate(),
    validateAwardForm,
    s3UploaderMultiple("championship"),
    postChampioship
)


// 커뮤니티 운영진 가입 승인
router.post("/:community_list_idx/staff/:player_list_idx/access",
    checkIdx("community_list_idx"),
    checkIdx("player_list_idx"),
    checkLogin,
    checkIsCommunityAdminRole(),
    checkIsYourCommunity(),
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
    checkIsYourCommunity(),
    checkIsPlayer,
    communityStaffAccessDeny
)

// 커뮤니티 운영진 추방
router.delete("/:community_list_idx/staff/:player_list_idx/kick",
    checkIdx("player_list_idx"),
    checkLogin,
    checkIsCommunityAdminRole(),
    checkIsYourCommunity(),
    checkIsPlayer,
    kickCommunityStaff
)

// 커뮤니티 운영진 가입 신청
router.post("/:community_list_idx/staff/application",
    checkIdx("community_list_idx"),
    checkLogin,
    checkIsCommunity,
    checkHasCommunityRole(),
    checkIsAlreadyWaitlist(),
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
    checkTeamNotJoinedCommunityWaitList(),
    checkIsCommunity,
    communityTeamApplication
)

// 커뮤니티 팀 가입 신청 승인
router.post("/:community_list_idx/team/:team_list_idx/access",
    checkIdx("team_list_idx"),
    checkLogin,
    checkIsCommunityAdminRole(),
    checkIsYourCommunity(),
    checkIsTeam,
    checkIsTeamInCommunity(),
    communityTeamAccess
)

// 커뮤니티 팀 가입 신청 거절
router.delete("/:community_list_idx/team/:team_list_idx/access",
    checkIdx("team_list_idx"),
    checkLogin,
    checkIsCommunityAdminRole(),
    checkIsYourCommunity(),
    checkIsTeam,
    communityTeamAccessDeny
)

// 커뮤니티 팀 추방
router.delete("/:community_list_idx/team/:team_list_idx/kick",
    checkIdx("team_list_idx"),
    checkLogin,
    checkIsCommunityAdminRole(),
    checkIsYourCommunity(),
    checkIsTeam,
    communityTeamKick
)



module.exports = router