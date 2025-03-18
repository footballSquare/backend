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
    getBoard,
    postBoard,
    putBoard,
    deleteBoard,
    boardLike,
    boardLikeDelete,
    postComment,
    putComment,
    deleteComment
} = require("./service")

// 게시글 목록 가져오기
router.get("/",
    getBoardList
)

// 게시글 상세 보기
router.get("/:board_list_idx",
    getBoard
)

// 게시글 작성하기
router.post("/",
    uploadFileToS3("board"),
    postBoard
)

// 게시글 수정하기
router.put("/:board_list_idx",
    uploadFileToS3("board"),
    putBoard
)

// 게시글 삭제하기
router.delete("/:board_list_idx",
    deleteBoard
)

// 게시글 좋아요
router.post("/:board_list_idx/like",
    boardLike
)

// 게시글 좋아요 삭제
router.delete("/:board_list_idx/like",
    boardLikeDelete
)

// 댓글 작성
router.post("/:board_list_idx/comment",
    postComment
)

// 댓글 수정
router.put("/comment/:board_comment_idx",
    putComment
)

// 댓글 삭제
router.delete("/comment/:board_comment_idx",
    deleteComment
)

module.exports = router