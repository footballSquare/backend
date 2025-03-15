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
    getCommunity
)

// 커뮤니티 운영진 목록 가져오기
router.get("/:community_list_idx/staff",
    checkIdx("community_list_idx"),
    getCommunityStaff
)

// 커뮤니티 소속 팀 목록 가져오기
router.get("/:community_list_idx/participation_team",
    checkIdx("community_list_idx"),
    getCommunityTeam
)

// 커뮤니티 소속 진행 대회 목록 보기
router.get("/:community_list_idx/championship",
    checkIdx("community_list_idx"),
    getCommunityChampionship
)

// 대회 만들기
router.post("/:community_list_idx/championship",
    checkIdx("community_list_idx"),
    checkRegInput(regChampionshipName,"championship_list_name"),
    checkRegInput(regChampionshipDescription,"championship_list_description"),
    checkRegInput(regColor,"championship_list_color"),
    checkRegInput(regChampionshipPeriod,"championship_list_start_date"),
    checkRegInput(regChampionshipPeriod,"championship_list_end_date"),
    checkIdx("participation_team_idxs"),
    checkRegInput(regChampionshipAwardName,"championship_award_name"),
    postChampioship
)


// 커뮤니티 운영진 가입 승인
router.post("/:community_list_idx/staff/:player_list_idx/access",
    checkIdx("community_list_idx"),
    checkIdx("player_list_idx"),
    communityStaffAccess
)

// 커뮤니티 운영진 가입 거절
router.delete("/:community_list_idx/staff/:player_list_idx/access",
    checkIdx("community_list_idx"),
    checkIdx("player_list_idx"),
    communityStaffAccessDeny
)

// 커뮤니티 운영진 추방
router.delete("/staff/:player_list_idx/kick",
    checkIdx("player_list_idx"),
    kickCommunityStaff
)

// 커뮤니티 운영진 가입 신청
router.post("/:community_list_idx/staff/application",
    checkIdx("community_list_idx"),
    communityStaffApplication
)

// 커뮤니티 운영진 가입 신청 목록 보기
router.get("/:community_list_idx/staff/application",
    checkIdx("community_list_idx"),
    getCommunityStaffApplication
)

// 커뮤니티 팀 가입 신청 목록 보기
router.get("/:community_list_idx/team/application",
    checkIdx("community_list_idx"),
    getCommunityTeamApplication
)

// 커뮤니티 팀 가입 신청
router.post("/:community_list_idx/team/application",
    checkIdx("community_list_idx"),
    communityTeamApplication
)

// 커뮤니티 팀 가입 신청 승인
router.post("/team/:team_list_idx/access",
    checkIdx("team_list_idx"),
    communityTeamAccess
)

// 커뮤니티 팀 가입 신청 거절
router.delete("/team/:team_list_idx/access",
    checkIdx("team_list_idx"),
    communityTeamAccessDeny
)

// 커뮤니티 팀 추방
router.delete("/team/:team_list_idx/kick",
    checkIdx("team_list_idx"),
    communityTeamKick
)



module.exports = router