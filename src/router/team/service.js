const client = require("../../database/postgreSQL")
const customError = require("../../util/customError")

const {
    getTeamListSQL,
    postTeamSQL,
    postTeamManagerSQL,
    getTeamSQL,
    getMemberSQL,
    insertTeamMemberSQL,
    teamMemberDenySQL,
    kickMemberSQL,
    teamApplicationSQL,
    teamApplicationListSQL,
    changeTeamDataSQL
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

// 팀 정보 수정하기
const changeTeamData = async (req,res,next) => {
    const {team_list_idx} = req.params
    const {
        team_list_name,
        team_list_short_name,
        team_list_color,
        team_list_announcement,
        common_status_idx
    } = req.body

    try{
        result = await client.query(changeTeamDataSQL, [
            team_list_idx,
            team_list_name,
            team_list_short_name,
            team_list_color,
            team_list_announcement,
            common_status_idx
        ])
        res.status(200).send({})
    } catch(e){
        next(e)
    }
}

// 팀 엠블렘 변경하기
// const changeTeamEmblem = async (req,res,next) => {
// }

// 팀 멤버 목록 가져오기
const getMember = async (req,res,next) => {
    const {team_list_idx} = req.params
    const {page} = req.query
    
    try{
        const result = await client.query(getMemberSQL, [
            team_list_idx,
            page
        ])
        res.status(200).send({ member : result.rows })
    } catch(e){
        next(e)
    }
}

// 팀 멤버 가입 승인
const teamMemberApproval = async (req,res,next) => {
    const {team_list_idx,player_list_idx} = req.params
    const {} = req.body

    try{
        await client.query("BEGIN");

        // 그 다음 팀에 추가
        await client.query(insertTeamMemberSQL, [
            team_list_idx,
            player_list_idx
        ]);
        
        // 먼저 대기자에서 삭제
        await client.query(teamMemberDenySQL, [
            team_list_idx,
            player_list_idx
        ]);

        await client.query("COMMIT");
        res.status(200).send({})
    } catch(e){
        await client.query("ROLLBACK"); 
        next(e)
    }
}


// 팀 멤버 가입 거절
const teamMemberDeny = async (req,res,next) => {
    const {team_list_idx,player_list_idx} = req.params
    const {} = req.body

    try{
        await client.query(teamMemberDenySQL, [
            team_list_idx,
            player_list_idx
        ])
        res.status(200).send({})
    } catch(e){
        next(e)
    }
}

const kickMember = async (req,res,next) => {
    const {team_list_idx,player_list_idx} = req.params
    const {} = req.body

    try{
        await client.query(kickMemberSQL, [
            team_list_idx,
            player_list_idx
        ])
        res.status(200).send({})
    } catch(e){
        next(e)
    }
}

// 팀 가입 신청
const teamApplication = async (req,res,next) => {
    const {team_list_idx} = req.params
    const {player_list_idx} = req.body

    try{
        await client.query(teamApplicationSQL, [
            team_list_idx,
            player_list_idx
        ])
        res.status(200).send({})
    } catch(e){
        next(e)
    }
}

// 팀 가입 신청 목록 보기 
const teamApplicationList = async (req,res,next) => {
    const {team_list_idx} = req.params

    try{
        const result = await client.query(teamApplicationListSQL, [
            team_list_idx
        ])
        res.status(200).send({ access_list : result.rows })
    } catch(e){
        next(e)
    }
}



module.exports = {
    getTeamList,
    postTeam,
    getTeam,
    getMember,
    teamMemberApproval,
    teamMemberDeny,
    kickMember,
    teamApplication,
    teamApplicationList,
    changeTeamData,
    // changeTeamEmblem
}