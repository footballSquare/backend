const client = require("../../database/postgreSQL")
const customError = require("../../util/customError")

const { COMMUNITY_ROLE } = require("../../constant/constantIndex")

const {
    getCommunitySQL,
    getCommunityStaffSQL,
    getCommunityTeamSQL,
    communityStaffAccessSQL,
    communityStaffAccessDenySQL,
    kickCommunityStaffSQL,
    communityStaffApplicationSQL,
    getCommunityStaffApplicationSQL,
    getCommunityTeamApplicationSQL,
    communityTeamApplicationSQL,
    communityTeamAccessSQL,
    communityTeamAccessDenySQL,
    communityTeamKickSQL
} = require("./sql")

// 커뮤니티 정보 보기
const getCommunity = async (req,res,next) => {
    const {community_list_idx} = req.params

    try{
        const result = await client.query(getCommunitySQL, [
            community_list_idx
        ])
        res.status(200).send({ community : result.rows })
    } catch(e){
        next(e)
    }
}

// 커뮤니티 운영진 목록 보기
const getCommunityStaff = async (req,res,next) => {
    const {community_list_idx} = req.params

    try{
        const result = await client.query(getCommunityStaffSQL, [
            community_list_idx
        ])
        res.status(200).send({ community_staff : result.rows })
    } catch(e){
        next(e)
    }
}

// 커뮤니티 소속 팀 목록 보기
const getCommunityTeam = async (req,res,next) => {
    const {community_list_idx} = req.params
    const {page} = req.query

    try{
        const result = await client.query(getCommunityTeamSQL, [
            community_list_idx,
            page
        ])
        res.status(200).send({ participation_team : result.rows })
    } catch(e){
        next(e)
    }
}

// 운영진 가입 승인
const communityStaffAccess = async (req,res,next) => {
    const {community_list_idx,player_list_idx} = req.params

    try{
        await client.query("BEGIN");

        await client.query(communityStaffAccessDenySQL, [
            community_list_idx,
            player_list_idx
        ])

        await client.query(communityStaffAccessSQL,[
            community_list_idx,
            player_list_idx,
            COMMUNITY_ROLE.STAFF
        ])

        await client.query("COMMIT");
        res.status(200).send({})
    } catch(e){
        await client.query("ROLLBACK");
        next(e)
    }
}

// 운영진 가입 거절
const communityStaffAccessDeny = async (req,res,next) => {
    const {community_list_idx,player_list_idx} = req.params

    try{
        await client.query(communityStaffAccessDenySQL, [
            community_list_idx,
            player_list_idx
        ])
        res.status(200).send({})
    } catch(e){
        next(e)
    }
}

// 커뮤니티 운영진 추방
const kickCommunityStaff = async (req,res,next) => {
    const {player_list_idx} = req.params

    try{
        await client.query(kickCommunityStaffSQL, [
            player_list_idx
        ])
        res.status(200).send({})
    } catch(e){
        next(e)
    }
}

// 커뮤니티 운영진 가입 신청
const communityStaffApplication = async (req,res,next) => {
    const {community_list_idx} = req.params
    const {player_list_idx} = req.body

    try{
        await client.query(communityStaffApplicationSQL, [
            community_list_idx,
            player_list_idx
        ])
        res.status(200).send({})
    } catch(e){
        next(e)
    }
}

// 커뮤니티 운영진 가입 신청 목록 보기 
const getCommunityStaffApplication = async (req,res,next) => {
    const {community_list_idx} = req.params

    try{
        const result = await client.query(getCommunityStaffApplicationSQL, [
            community_list_idx
        ])
        res.status(200).send({ access_list : result.rows})
    } catch(e){
        next(e)
    }
}

// 커뮤니티 팀 가입 신청 목록 보기
const getCommunityTeamApplication = async (req,res,next) => {
    const {community_list_idx} = req.params

    try{
        const result = await client.query(getCommunityTeamApplicationSQL, [
            community_list_idx
        ])
        res.status(200).send({ team_list : result.rows })
    } catch(e){
        next(e)
    }
}

// 커뮤니티 팀 가입 신청
const communityTeamApplication = async (req,res,next) => {
    const {community_list_idx} = req.params
    const {team_list_idx} = req.body

    try{
        await client.query(communityTeamApplicationSQL, [
            community_list_idx,
            team_list_idx
        ])
        res.status(200).send({})
    } catch(e){
        next(e)
    }
}

// 커뮤니티 팀 가입 신청 승인
const communityTeamAccess = async (req,res,next) => {
    const {team_list_idx} = req.params
    const {community_list_idx} = req.body

    console.log(team_list_idx)

    try{
        await client.query("BEGIN");
        await client.query(communityTeamAccessDenySQL, [
            community_list_idx,
            team_list_idx
        ])

        await client.query(communityTeamAccessSQL, [
            community_list_idx,
            team_list_idx
        ])

        await client.query("COMMIT");
        res.status(200).send({})
    } catch(e){
        await client.query("ROLLBACK");
        next(e)
    }
}

// 커뮤니티 팀 가입 신청 거절
const communityTeamAccessDeny = async (req,res,next) => {
    const {team_list_idx} = req.params
    const {community_list_idx} = req.body

    try{
        await client.query(communityTeamAccessDenySQL, [
            community_list_idx,
            team_list_idx
        ])
        res.status(200).send({})
    } catch(e){
        next(e)
    }
}

// 커뮤니티 추방
const communityTeamKick = async (req,res,next) => {
    const {team_list_idx} = req.params
    const {community_list_idx} = req.body

    try{
        await client.query(communityTeamKickSQL, [
            community_list_idx,
            team_list_idx
        ])
        res.status(200).send({})
    } catch(e){
        next(e)
    }
}
module.exports = {
    getCommunity,
    getCommunityStaff,
    getCommunityTeam,
    communityStaffAccess,
    communityStaffAccessDeny,
    kickCommunityStaff,
    communityStaffApplication,
    getCommunityStaffApplication,
    getCommunityTeamApplication,
    communityTeamApplication,
    communityTeamAccess,
    communityTeamAccessDeny,
    communityTeamKick
}