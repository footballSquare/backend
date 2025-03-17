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


const {
    getBoardListSQL,
    postBoardSQL
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

// 게시글 작성하기
const postBoard = async (req,res,next) => {
    const {
        player_list_idx,
        board_list_title,
        board_list_content
    } = req.body

    const new_img_url = req.file.location

    try{
        await client.query(postBoardSQL, [
            BOARD_CATEGORY.FREE_BOARD,
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



module.exports = {
    getBoardList,
    postBoard
}