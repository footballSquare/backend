const regColor = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;

const regMatchDuration = /^(30 minutes|1 hour|1 hour 30 minutes|2 hours)$/;
const regMatchDatetime =
  /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01]) ([01]\d|2[0-3]):(00|30):00$/;

const regTeamName = /^[가-힣a-zA-Z0-9\s()\[\]\-_]{1,20}$/; // 영어 한글만 가능, 최대 20글자

const regMatchName = /^.{1,30}$/;

const regTeamShortName = /^[A-Za-z]{3}$/; // 영문 3글자만 가능 (1글자, 2글자 불가)
const regTeamAnnouncement = /^.{1,500}$/s; // 최대 500글자까지 가능

const regChampionshipName = /^.{1,30}$/; // 한글, 영어만 가능, 공백 허용 최대 30글자
const regChampionshipDescription = /^.{1,500}$/s; // 최대 500글자까지 가능
const regChampionshipAwardName = /^.{1,10}$/; // 최대 50글자까지 가능

const regChampionshipPeriod = /^\d{4}-\d{2}-\d{2}$/;

// 커뮤니티 공지 길이 제한
const regCommunityNotice = /^.{1,1000}$/s;

// 게시판 제목: 최대 50글자 (1~50자 허용)
const regBoardTitle = /^.{1,50}$/;

// 게시판 내용: TEXT 데이터 타입 (길이 제한 없음, 최소 1자 이상)
const regBoardContent = /^.{1,1000}$/s;

// 댓글 내용: 최대 100글자 (1~100자 허용)
const regCommentContent = /^.{1,100}$/s;

// 계정 관련 regex
const regId = /^[A-Za-z0-9]{5,20}$/;
const regPw = /^.{5,20}$/;
const regIdx = /^[0-9]+$/;
// const regId = /^[A-Za-z0-9]{8,20}$/;
// const regPw = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])[A-Za-z\d!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]{8,20}$/;
const regPhone = /^01[016789]\d{7,8}$/;
const regNickname = /^[A-Za-z0-9가-힣]{2,10}$/;
const regPlatform = /^(pc|xbox|playstation)$/;
const regMessage = /^.{0,50}$/;
const regDiscordTag = /^.{0,40}$/;

module.exports = {
  regColor,
  regMatchDuration,
  regMatchDatetime,
  regTeamName,
  regTeamShortName,
  regTeamAnnouncement,
  regChampionshipName,
  regChampionshipDescription,
  regChampionshipAwardName,
  regChampionshipPeriod,
  regBoardTitle,
  regBoardContent,
  regCommentContent,
  regIdx,
  regId,
  regPw,
  regNickname,
  regPlatform,
  regMessage,
  regDiscordTag,
  regCommunityNotice,
  regPhone,
  regMatchName,
};
