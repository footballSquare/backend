const router = require("express").Router()

const { multerMiddleware } = require("../../database/s3Config/multerMiddleware")

const {
    s3Uploader,
    s3UploaderOptional
} = require("../../middleware/s3UpLoader")

const { 
    checkLogin, 
    optionalLogin 
} = require("../../middleware/checkLogin")

const {
    checkIsPostOwner,
    checkAlreadyLiked,
    checkLikeExists,
    checkIsCommentOwner
} = require("../../middleware/checkCondition")

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
    regBoardTitle,
    regBoardContent,
    regCommentContent
} = require("../../constant/regx")

const {
    checkRegInput,
    checkIdx,
    checkPage,
    checkMatchFormation,
    checkMatchParticipationType,
    checkMatchType,
    checkMatchAttribute,
    checkChampionshipType,
    checkCategory
} = require("../../middleware/checkInput")

const {
    checkIsTeam,
    checkIsMatch,
    checkIsCommunity,
    checkIsChampionship,
    checkIsChampionshipMatch,
    checkIsFormation,
    checkIsPlayer,
    checkIsBoard,
    checkIsComment
} = require("../../middleware/checkData")

const {
    checkHasTeamOrCommunity
} = require("../../middleware/checkRole")

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
    checkPage(),
    checkCategory(),
    getBoardList
)

// 게시글 상세 보기
router.get("/:board_list_idx",
    checkIdx("board_list_idx"),
    optionalLogin,
    checkIsBoard,
    getBoard
)

// 게시글 작성하기
router.post("/",
    multerMiddleware,
    checkCategory(),
    checkRegInput(regBoardTitle,"board_list_title"),
    checkRegInput(regBoardContent,"board_list_content"),
    checkLogin,
    checkHasTeamOrCommunity(),
    s3UploaderOptional("board"),
    postBoard
)

// 게시글 수정하기
router.put("/:board_list_idx",
    multerMiddleware,
    checkIdx("board_list_idx"),
    checkRegInput(regBoardTitle,"board_list_title"),
    checkRegInput(regBoardContent,"board_list_content"),
    checkLogin,
    checkIsPostOwner(),
    checkIsBoard,
    s3UploaderOptional("board"),
    putBoard
)

// 게시글 삭제하기
router.delete("/:board_list_idx",
    checkIdx("board_list_idx"),
    checkLogin,
    checkIsPostOwner(),
    checkIsBoard,
    deleteBoard
)

// 게시글 좋아요
router.post("/:board_list_idx/like",
    checkIdx("board_list_idx"),
    checkLogin,
    checkAlreadyLiked(),
    checkIsBoard,
    boardLike
)

// 게시글 좋아요 삭제
router.delete("/:board_list_idx/like",
    checkIdx("board_list_idx"),
    checkLogin,
    checkLikeExists(),
    checkIsBoard,
    boardLikeDelete
)

// 댓글 작성
router.post("/:board_list_idx/comment",
    checkIdx("board_list_idx"),
    checkRegInput(regCommentContent,"board_comment_content"),
    checkLogin,
    checkIsBoard,
    postComment
)

// 댓글 수정
router.put("/comment/:board_comment_idx",
    checkIdx("board_comment_idx"),
    checkRegInput(regCommentContent,"board_comment_content"),
    checkLogin,
    checkIsComment,
    checkIsCommentOwner,
    putComment
)

// 댓글 삭제
router.delete("/comment/:board_comment_idx",
    checkIdx("board_comment_idx"),
    checkIsComment,
    checkIsCommentOwner,
    deleteComment
)

module.exports = router