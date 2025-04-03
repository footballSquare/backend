const client = require("../../database/postgreSQL")
const customError = require("../../util/customError")

const { TEAM_ROLE } =require("../../constant/constantIndex")

const {deleteFileFromS3} = require("../../database/s3Config/s3Deleter")

const {
    getTeamListSQL,
    postTeamSQL,
    changeTeamDataSQL,
    checkTeamNameSQL,
    checkTeamShortNameSQL,
    deleteTeamSQL,
    postTeamManagerSQL,
    getTeamSQL,
    getMemberSQL,
    insertTeamMemberSQL,
    teamMemberDenySQL,
    deleteTeamMemeberSQL,
    changeMemberRoleSQL,
    kickMemberSQL,
    teamApplicationSQL,
    teamApplicationListSQL,
    changeTeamEmblemSQL
} = require("./sql")

// 팀 목록 가져오기
const getTeamList = async (req,res,next) => {
    const {page} = req.query
    
    try{
        const result = await client.query(getTeamListSQL, [
            page
        ])
        res.status(200).send({ member : result.rows })
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
    } = req.body

    const {
        my_player_list_idx
    } = req.decoded

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
        console.log(teamListIdx);

        // 팀장 등록
        await client.query(postTeamManagerSQL,[
            teamListIdx, 
            my_player_list_idx,
            TEAM_ROLE.LEADER
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
        await client.query(changeTeamDataSQL, [
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

// 팀명 중복 확인하기
const checkTeamName = async (req,res,next) => {
    const {
        team_list_name
    } = req.params

    try{
        const result = await client.query(checkTeamNameSQL, [
            team_list_name
        ])

        if (result.rowCount > 0) {
            throw customError(409, `중복 팀명`);
        }
        res.status(200).send({})
    } catch(e){
        next(e)
    }
}

// 팀 약칭 중복 확인하기
const checkTeamShortName = async (req,res,next) => {
    const {
        team_list_short_name
    } = req.params

    try{
        const result = await client.query(checkTeamShortNameSQL, [
            team_list_short_name
        ])

        if (result.rowCount > 0) {
            throw customError(409, `중복 팀 약칭`);
        }
        res.status(200).send({})
    } catch(e){
        next(e)
    }
}

// 팀 엠블렘 변경하기
const changeTeamEmblem = async (req,res,next) => {
    const { team_list_idx } = req.params;
    const new_img_url = req.fileUrl; // 업로드된 S3 파일 URL

    try {
        // 1️⃣ 기존 팀 엠블렘 URL 가져오기
        const { rows } = await client.query(
            `SELECT team_list_emblem FROM team.list WHERE team_list_idx = $1`,
            [team_list_idx]
        );
        
        const old_img_url = rows[0].team_list_emblem;
        console.log(old_img_url)

        // 2️⃣ 기존 엠블렘이 존재하면 삭제
        if (old_img_url) {
            await deleteFileFromS3(old_img_url);
        }

        // 3️⃣ 새로운 엠블렘 URL을 DB에 업데이트
        await client.query(
            changeTeamEmblemSQL,
            [team_list_idx, new_img_url]
        );

        res.status(200).send({});
    } catch (e) {
        next(e);
    }
};


// 팀 배너 변경하기 
const changeTeamBanner = async (req, res, next) => {
    const { team_list_idx } = req.params;
    const new_banner_url = req.fileUrl; // 업로드된 S3 파일 URL

    try {
        // 1️⃣ 기존 팀 배너 URL 가져오기
        const { rows } = await client.query(
            `SELECT team_list_banner FROM team.list WHERE team_list_idx = $1`,
            [team_list_idx]
        );
        const old_banner_url = rows[0].team_list_banner;
        // 2️⃣ 기존 배너가 존재하면 S3에서 삭제
        if (old_banner_url) {
            await deleteFileFromS3(old_banner_url);
        }

        // 3️⃣ 새로운 배너 URL을 DB에 업데이트
        await client.query(
            `UPDATE team.list SET team_list_banner = $2 WHERE team_list_idx = $1`,
            [team_list_idx, new_banner_url]
        );

        res.status(200).send({});
    } catch (e) {
        next(e);
    }
};

// 팀 해체하기
const deleteTeam = async (req,res,next) => {
    const {team_list_idx} = req.params
    const {} = req.body

    try{
        await client.query(deleteTeamSQL, [
            team_list_idx
        ])
        res.status(200).send({})
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
            player_list_idx,
            TEAM_ROLE.MEMBER
        ]);
        
        // 먼저 대기자에서 삭제
        await client.query(deleteTeamMemeberSQL, [
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

// 멤버 역할 변경
const changeMemberRole = async (req,res,next) => {
    const {team_list_idx,player_list_idx,team_role_idx} = req.params
    const {} = req.body

    try{
        await client.query(changeMemberRoleSQL, [
            team_list_idx,
            player_list_idx,
            team_role_idx
        ])
        res.status(200).send({})
    } catch(e){
        next(e)
    }
}


// 멤버 추방하기
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
    const { my_player_list_idx } = req.decoded

    console.log(my_player_list_idx)

    try{
        await client.query(teamApplicationSQL, [
            team_list_idx,
            my_player_list_idx
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

// 팀 탈퇴하기
const teamLeave = async (req,res,next) => {
    const {team_list_idx} = req.params
    const { my_player_list_idx } = req.decoded

    try{
        await client.query(kickMemberSQL, [
            team_list_idx,
            my_player_list_idx
        ])
        res.status(200).send({})
    } catch(e){
        next(e)
    }
}



module.exports = {
    getTeamList,
    postTeam,
    getTeam,
    getMember,
    deleteTeam,
    teamMemberApproval,
    teamMemberDeny,
    changeMemberRole,
    kickMember,
    teamApplication,
    teamApplicationList,
    changeTeamData,
    checkTeamName,
    checkTeamShortName,
    teamLeave,
    changeTeamEmblem,
    changeTeamBanner
}