const client = require("../../database/postgreSQL")
const customError = require("../../util/customError")

const {
    getCommunitySQL,
    getCommunityStaffSQL,
    communityStaffAccessSQL,
    communityStaffAccessDenySQL,
    kickCommunityStaffSQL,
    communityStaffApplicationSQL,
    getCommunityStaffApplicationSQL
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
            player_list_idx   
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

module.exports = {
    getCommunity,
    getCommunityStaff,
    communityStaffAccess,
    communityStaffAccessDeny,
    kickCommunityStaff,
    communityStaffApplication,
    getCommunityStaffApplication
}