const client = require("../../database/postgreSQL")
const customError = require("../../util/customError")
const {getOpenMatchDataSQL} = require("./sql")


const getOpenMatchData = async (req,res,next) => {
    try{
        const result = await client.query(getOpenMatchDataSQL)
        res.status(200).send({ match : result.rows })
    } catch(e){
        next(e)
    }
}

module.exports = {getOpenMatchData}