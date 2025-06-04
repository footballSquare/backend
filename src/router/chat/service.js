const client = require("../../database/postgreSQL")
const customError = require("../../util/customError")

const {
    getTeamChatSQL
} = require("./sql")

const getTeamChat = async (req,res,next) => {
    const {page} = req.query
    const {
        my_team_list_idx
    } = req.decoded
    
    try{
        if(!my_team_list_idx) throw customError(404,"소속 팀이 없습니다.")
        const result = await client.query(getTeamChatSQL, [
            my_team_list_idx,
            page
        ])
        res.status(200).send({ chat : result.rows })
    } catch(e){
        next(e)
    }
}

module.exports = {
    getTeamChat
}