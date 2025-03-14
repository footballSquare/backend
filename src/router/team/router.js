const router = require("express").Router()

const {uploadFileToS3} =
require("../../middleware/useS3")

const {

} = require("../../middleware/checkInput")

const {
    getTeamList,
    postTeam,
    getTeam,
    getMember,
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

// 팀 정보 수정하기
router.put("/:team_list_idx",
    changeTeamData
)

// 팀명 중복 확인하기
router.get("/check_name",
    checkTeamName
)

// 팀 약칭 중복 확인하기
router.get("/check_short_name",
    checkTeamShortName
)

// 팀 엠블렘 수정하기
router.put("/:team_list_idx/emblem",
    uploadFileToS3("team"),
    changeTeamEmblem
)

// 팀 배너 수정하기
router.put("/:team_list_idx/banner",
    uploadFileToS3("team"),
    changeTeamBanner
)

// 팀 해체하기
router.delete("/:team_list_idx",
    deleteTeam
)


// 팀 멤버 가입 승인
router.post("/:team_list_idx/member/:player_list_idx/access",
    teamMemberApproval
)

// 팀 멤버 가입 거절
router.delete("/:team_list_idx/member/:player_list_idx/access",
    teamMemberDeny
)

// 멤버 역할 변경
router.put("/:team_list_idx/member/:player_list_idx/role/:team_role_idx",
    changeMemberRole
)

// 팀 멤버 추방
router.delete("/:team_list_idx/member/:player_list_idx/kick",
    kickMember
)

// 팀 가입 신청 하기
router.put("/:team_list_idx/application",
    teamApplication
)

// 팀 가입 신청 인원 목록 보기
router.get("/:team_list_idx/application/list",
    teamApplicationList
)

// 팀 탈퇴하기
router.delete("/:team_list_idx/leave",
    teamLeave
)



module.exports = router
