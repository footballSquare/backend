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
    checkMatchAttribute,
    checkChampionshipType
} = require("../../middleware/checkInput")

const {
    uploadFileToS3
} =require("../../middleware/useS3")

const {
    getBoardList,
    postBoard
} = require("./service")

// 게시글 목록 가져오기
router.get("/",
    getBoardList
)

// 게시글 상세 보기
router.get("/:board_list_idx",
    
)

// 게시글 작성하기
router.post("/",
    uploadFileToS3("board"),
    postBoard
)

// 게시글 수정하기
router.put("/:board_list_idx",
    
)

// 게시글 삭제하기
router.delete("/:board_list_idx",
    
)

// 게시글 좋아요
router.post("/:board_list_idx/like",
    
)

// 게시글 좋아요 삭제
router.delete("/:board_list_idx/like",
    
)

// 댓글 작성
router.post("/:board_list_idx/commet",
    
)

// 댓글 수정
router.put("/:board_list_idx/commet",
    
)

// 댓글 삭제
router.delete("/:board_list_idx/commet",
    
)

module.exports = router