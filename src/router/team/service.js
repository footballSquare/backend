const client = require("../../database/postgreSQL")
const customError = require("../../util/customError")

const {
    getTeamListSQL,
    postTeamSQL,
    postTeamManagerSQL,
    getTeamSQL,
    getMemberSQL
} = require("./sql")

// 팀 목록 가져오기
const getTeamList = async (req,res,next) => {
    const {team_list_idx} = req.params
    const {page} = req.query
    
    try{
        const result = await client.query(getTeamListSQL, [
            page
        ])
        res.status(200).send({ member : result.rows[0] })
    } catch(e){
        next(e)
    }
}

// 팀 생성하기
const postTeam = async (req,res,next) => {

    const {
        team_list_name,
        team_list_short_name,
        team_list_color,
        team_list_announcement,
        common_status_idx,
        player_list_idx
    } = req.body

    try{
        await client.query('BEGIN');
        // 팀 생성
        const teamResult = await client.query(postTeamSQL,[
            team_list_name,
            team_list_short_name,
            team_list_color,
            team_list_announcement,
            common_status_idx
        ]);

        const teamListIdx = teamResult.rows[0].team_list_idx;

        // 팀장 등록
        await client.query(postTeamManagerSQL[
            teamListIdx, 
            player_list_idx
        ]);

        await client.query("COMMIT"); 

        res.status(200).send({ team_list_idx : teamListIdx })
    } catch(e){
        next(e)
    }
}

// 팀 페이지 상세 정보 보기
const getTeam = async (req,res,next) => {
    const {team_list_idx} = req.params
    
    try{
        const result = await client.query(getTeamSQL, [team_list_idx])
        res.status(200).send({ team : result.rows[0] })
    } catch(e){
        next(e)
    }
}

// 팀 멤버 목록 가져오기
const getMember = async (req,res,next) => {
    const {team_list_idx} = req.params
    const {page} = req.query
    
    try{
        const result = await client.query(getMemberSQL, [
            team_list_idx,
            page
        ])
        res.status(200).send({ member : result.rows[0] })
    } catch(e){
        next(e)
    }
}


module.exports = {
    getTeamList,
    postTeam,
    getTeam,
    getMember
}