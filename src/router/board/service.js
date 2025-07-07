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

        const board_list = result.rows.map(row => {
            const createdAtUTC = new Date(row.board_list_created_at);
            const updatedAtUTC = new Date(row.board_list_updated_at);

            return {
                ...row,
                board_list_created_at: new Date(createdAtUTC.getTime() + 9 * 60 * 60 * 1000),
                board_list_updated_at: new Date(updatedAtUTC.getTime() + 9 * 60 * 60 * 1000)
            };
        });

        res.status(200).send({ board_list });
    } catch(e){
        next(e)
    }
}

// 게시글 상세 보기
const getBoard = async (req,res,next) => {
    const {board_list_idx} = req.params
    const {my_player_list_idx} = req.decoded || null

    try{
        // 조회수 증가
        await client.query(
            increaseViewCountSQL,
            [board_list_idx]
        );
        const result = await client.query(getBoardSQL, [
            board_list_idx,
            my_player_list_idx
        ]);

        const wrapper = result.rows[0];     // ✅ 여기에 board가 들어있음
        const board = wrapper.board;

        const createdAt = new Date(board.board_list_created_at);
        const updatedAt = new Date(board.board_list_updated_at);

        board.board_list_created_at = new Date(createdAt.getTime() + 9 * 60 * 60 * 1000);
        board.board_list_updated_at = new Date(updatedAt.getTime() + 9 * 60 * 60 * 1000);

        res.status(200).send({
            board: wrapper
        })
    } catch(e){
        next(e)
    }
}

// 게시글 작성하기
const postBoard = async (req,res,next) => {
    const {category} = req.query
    const {
        board_list_title,
        board_list_content
    } = req.body

    const { my_player_list_idx } = req.decoded

    const new_img_url = req.fileUrl

    const utcNow = new Date();
    const kstNowDate = new Date(utcNow.getTime() + 9 * 60 * 60 * 1000); // KST 보정

    try{
        const result = await client.query(postBoardSQL, [
            category,
            board_list_title,
            board_list_content,
            my_player_list_idx,  
            new_img_url,
            kstNowDate,
            kstNowDate
        ]);

        res.status(200).send(result.rows[0])
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
        const { rows } = await client.query(
            `SELECT board_list_img FROM board.list WHERE board_list_idx = $1`,
            [board_list_idx]
        );
        const board_list_img = rows[0].board_list_img[0];

        if (board_list_img && board_list_img !== null && board_list_img !== "null") {
            await deleteFileFromS3(board_list_img);
        }

        const utcNow = new Date();
        const kstNowDate = new Date(utcNow.getTime() + 9 * 60 * 60 * 1000); // KST 보정

        await client.query(
            putBoardSQL,
            [
                board_list_idx,
                board_list_title,
                board_list_content,
                new_img_url,
                kstNowDate
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
        await client.query("COMMIT");
        res.status(200).send({})
    } catch(e){
        next(e)
    }
}

// 게시글 좋아요 
const boardLike = async (req,res,next) => {
    const {board_list_idx} = req.params
    const {
        my_player_list_idx
    } = req.decoded

    try{
        await client.query("BEGIN");
        await client.query(likeIncreaseSQL,[
            board_list_idx
        ])
        await client.query(boardLikeSQL, [
            board_list_idx,
            my_player_list_idx
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
        my_player_list_idx
    } = req.decoded

    try{
        await client.query("BEGIN");
        await client.query(likeDecreaseSQL,[
            board_list_idx
        ])
        await client.query(boardLikeDeleteSQL, [
            board_list_idx,
            my_player_list_idx
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
        board_comment_content
    } = req.body

    const {
        my_player_list_idx
    } = req.decoded
    const now = new Date();
    const kstNow = new Date(now.getTime() + 9 * 60 * 60 * 1000);

    try{
        const result = await client.query(postCommentSQL, [
            board_list_idx,
            my_player_list_idx,
            board_comment_content,
            kstNow.toISOString(),
            kstNow.toISOString()
        ]);

        res.status(200).send(result.rows[0])
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
    const now = new Date();
    const kstNow = new Date(now.getTime() + 9 * 60 * 60 * 1000);

    try{
        await client.query(putCommentSQL, [
            board_comment_idx,
            board_comment_content,
            kstNow.toISOString()
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