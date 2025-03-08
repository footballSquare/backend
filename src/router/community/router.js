const router = require("express").Router()

const {
    getCommunity,
    getCommunityStaff,
    communityStaffAccess,
    communityStaffAccessDeny,
    kickCommunityStaff,
    communityStaffApplication,
    getCommunityStaffApplication
} = require("./service")

// 커뮤니티 정보 가져오기
router.get("/:community_list_idx",
    getCommunity
)

// 커뮤니티 운영진 목록 가져오기
router.get("/:community_list_idx/staff",
    getCommunityStaff
)

// 커뮤니티 운영진 가입 승인
router.post("/:community_list_idx/staff/:player_list_idx/access",
    communityStaffAccess
)

// 커뮤니티 운영진 가입 거절
router.delete("/:community_list_idx/staff/:player_list_idx/access",
    communityStaffAccessDeny
)

// 커뮤니티 운영진 추방
router.delete("/staff/:player_list_idx/kick",
    kickCommunityStaff
)

// 커뮤니티 운영진 가입 신청
router.post("/:community_list_idx/staff/application",
    communityStaffApplication
)

// 커뮤니티 운영진 가입 신청 목록 보기
router.get("/:community_list_idx/staff/application",
    getCommunityStaffApplication
)

module.exports = router