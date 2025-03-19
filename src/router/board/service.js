const client = require("../../database/postgreSQL")
const customError = require("../../util/customError")

const { 
    COMMUNITY_ROLE,
    MATCH_TYPE,
    MATCH_PARTICIPATION_TYPE,
    MATCH_FORMATION,
    MATCH_ATTRIBUTE,
    MATCH_DURATION,
    CHAMPIONSHIP_TYPE, 
    CHAMPIONSHIP_STATUS,
    TEAM_ROLE,
    COMMON_STATUS,
    BOARD_CATEGORY
} = require("../../constant/constantIndex")

const {deleteFileFromS3} = require("../../database/s3Config/s3Deleter")


const {
    getBoardListSQL,
    increaseViewCountSQL,
    getBoardSQL,
    postBoardSQL,
    putBoardSQL,
    deleteBoardSQL,
    likeIncreaseSQL,
    boardLikeSQL,
    likeDecreaseSQL,
    boardLikeDeleteSQL,
    postCommentSQL,
    putCommentSQL,
    deleteCommentSQL
} = require("./sql")

// 게시글 목록 가져오기
const getBoardList = async (req,res,next) => {
    const {category,page} = req.query

    try{
        const result = await client.query(getBoardListSQL, [
            category,
            page
        ]);

        res.status(200).send({
            board_list : result.rows
        })
    } catch(e){
        next(e)
    }
}

// 게시글 상세 보기
const getBoard = async (req,res,next) => {
    const {board_list_idx} = req.params

    try{
        // 조회수 증가
        await client.query(
            increaseViewCountSQL,
            [board_list_idx]
        );
        const result = await client.query(getBoardSQL, [
            board_list_idx
        ]);

        res.status(200).send({
            board : result.rows[0]
        })
    } catch(e){
        next(e)
    }
}

// 게시글 작성하기
const postBoard = async (req,res,next) => {
    const {category} = req.query
    const {
        player_list_idx,
        board_list_title,
        board_list_content
    } = req.body

    const new_img_url = req.fileUrl

    try{
        await client.query(postBoardSQL, [
            category,
            board_list_title,
            board_list_content,
            player_list_idx,  
            new_img_url
        ]);

        res.status(200).send({})
    } catch(e){
        next(e)
    }
}

// 게시글 수정하기
const putBoard = async (req,res,next) => {
    const {board_list_idx} = req.params
    const {
        board_list_title,
        board_list_content
    } = req.body

    const new_img_url = req.fileUrl

    try {
        // 1️⃣ 기존 팀 배너 URL 가져오기
        const { rows } = await client.query(
            `SELECT board_list_img FROM board.list WHERE board_list_idx = $1`,
            [board_list_idx]
        );
        console.log(rows)
        const board_list_img = rows[0].board_list_img[0];

        // 2️⃣ 기존 배너가 존재하면 S3에서 삭제
        if (board_list_img && board_list_img !== null && board_list_img !== "null") {
            await deleteFileFromS3(board_list_img);
        }

        // 3️⃣ 새로운 배너 URL을 DB에 업데이트
        await client.query(
            putBoardSQL,
            [
                board_list_idx,
                board_list_title,
                board_list_content,
                new_img_url
            ]
        );

        res.status(200).send({});
    } catch(e){
        next(e)
    }
}

// 게시글 삭제하기
const deleteBoard = async (req,res,next) => {
    const {board_list_idx} = req.params

    try {
        await client.query("BEGIN");

        // 1️⃣ 기존 게시글의 이미지 가져오기
        const { rows } = await client.query(
            `SELECT board_list_img FROM board.list WHERE board_list_idx = $1`,
            [board_list_idx]
        );
        const board_list_img = rows[0]?.board_list_img;

        // 2️⃣ 이미지가 존재하면 S3에서 삭제
        if (board_list_img && board_list_img.length > 0) {
            await deleteFileFromS3(board_list_img[0]); // JSONB 배열에서 첫 번째 이미지 삭제
        }

        // 3️⃣ 게시글 삭제
        await client.query(deleteBoardSQL, [board_list_idx]);

        res.status(200).send({})
    } catch(e){
        next(e)
    }
}

// 게시글 좋아요 
const boardLike = async (req,res,next) => {
    const {board_list_idx} = req.params
    const {
        player_list_idx
    } = req.body

    try{
        await client.query("BEGIN");
        await client.query(likeIncreaseSQL,[
            board_list_idx
        ])
        await client.query(boardLikeSQL, [
            board_list_idx,
            player_list_idx
        ]);
        await client.query("COMMIT");
        res.status(200).send({})
    } catch(e){
        await client.query("ROLLBACK");
        next(e)
    }
}

// 게시글 좋아요 삭제 
const boardLikeDelete = async (req,res,next) => {
    const {board_list_idx} = req.params
    const {
        player_list_idx
    } = req.body

    try{
        await client.query("BEGIN");
        await client.query(likeDecreaseSQL,[
            board_list_idx
        ])
        await client.query(boardLikeDeleteSQL, [
            board_list_idx,
            player_list_idx
        ]);
        await client.query("COMMIT");
        res.status(200).send({})
    } catch(e){
        await client.query("ROLLBACK");
        next(e)
    }
}


// 댓글 작성하기
const postComment = async (req,res,next) => {
    const {board_list_idx} = req.params
    const {
        player_list_idx,
        board_comment_content
    } = req.body

    try{
        await client.query(postCommentSQL, [
            board_list_idx,
            player_list_idx,
            board_comment_content
        ]);

        res.status(200).send({})
    } catch(e){
        next(e)
    }
}

// 댓글 수정하기
const putComment = async (req,res,next) => {
    const {board_comment_idx} = req.params
    const {
        board_comment_content
    } = req.body

    try{
        await client.query(putCommentSQL, [
            board_comment_idx,
            board_comment_content
        ]);

        res.status(200).send({})
    } catch(e){
        next(e)
    }
}

// 댓글 삭제하기
const deleteComment =async (req,res,next) => {
    const {board_comment_idx} = req.params

    try{
        await client.query(deleteCommentSQL, [
            board_comment_idx
        ]);

        res.status(200).send({})
    } catch(e){
        next(e)
    }
}


module.exports = {
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
}