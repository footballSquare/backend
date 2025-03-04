const client = require("../../database/postgreSQL")
const customError = require("../../util/customError")

const {
    getOpenMatchDataSQL,
    postOpenMatchSQL,
    postTeamMatchSQL,
    deleteMatchSQL
} = require("./sql")


// 공개 매치 가져오기
const getOpenMatchData = async (req,res,next) => {
    const {page} = req.query
    try{
        const result = await client.query(getOpenMatchDataSQL, [10, page])
        res.status(200).send({ match : result.rows })
    } catch(e){
        next(e)
    }
}

// 공방 매치 생성
const postOpenMatch = async (req,res,next) => {

    const {
        player_list_idx,
        match_formation_idx,
        match_match_participation_type,
        match_type_idx,
        match_match_attribute,
        match_match_start_time,
        match_match_duration
    } = req.body

    try{
        await client.query(postOpenMatchSQL, [
            player_list_idx,
            match_formation_idx,
            match_match_participation_type,
            match_type_idx,
            match_match_attribute,
            match_match_start_time,
            match_match_duration
        ])
        res.status(200).send({})
    } catch(e){
        next(e)
    }
}

const postTeamMatch = async (req,res,next) => {
    const {team_list_idx} = req.params
    const {
        player_list_idx,
        match_formation_idx,
        match_match_participation_type,
        match_type_idx,
        match_match_attribute,
        match_match_start_time,
        match_match_duration
    } = req.body

    try{
        await client.query(postTeamMatchSQL, [
            team_list_idx,
            player_list_idx,
            match_formation_idx,
            match_match_participation_type,
            match_type_idx,
            match_match_attribute,
            match_match_start_time,
            match_match_duration
        ])
        res.status(200).send({})
    } catch(e){
        next(e)
    }
}

// 매치 삭제하기
const deleteMatch = async (req,res,next) => {
    const {match_match_idx} = req.params

    try{
        await client.query(deleteMatchSQL, [match_match_idx])
        res.status(200).send({})
    } catch(e){
        next(e)
    }
}

module.exports = {
    getOpenMatchData,
    postOpenMatch,
    postTeamMatch,
    deleteMatch}
