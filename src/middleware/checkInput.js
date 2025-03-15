const customError = require("../util/customError")

const {
    regColor,
    regMatchDuration,
    regMatchDatetime,
    regTeamName,
    regTeamShortName,
    regTeamAnnouncement,
    regChampionshipName,
    regChampionshipDescription,
    regChampionshipPeriod
} = require("../constant/regx")


// reg = 정규표현식, check = 들어올 key 값
// 정규표현식으로 검증할 미들웨어
const checkRegInput = (reg, check) => {
    return (req, res, next) => {
      const value = req.body[check] || req.params[check] || req.query[check];
  
      try {
        if (!value) {
            throw customError(400, `${check} 값이 없습니다.`);
        }

        // 배열일 경우 모든 요소를 검사
        if (Array.isArray(value)) {
            if (!value.every(item => reg.test(item))) {
                throw customError(400, `${check} 배열 내 요소의 양식 오류`);
            }
        } 
        // 문자열일 경우 단일 검증
        else if (!reg.test(value)) {
            throw customError(400, `${check} 양식 오류`);
        }

        next();
      } catch (e) {
        next(e);
      }
    };
};

// 숫자인지 아닌지 판단하는 미들웨어
const checkIdx = (input) => {
    return (req, res, next) => {
      const value = req.body[input] ?? req.params[input] ?? req.query[input] ?? req.decoded?.[input];
      
      try {
        if (Number.isNaN(Number(value)) || value === null || value === undefined)
          throw customError(400, `${input} 양식 오류`);
        next();
      } catch (e) {
        next(e);
      }
    };
};

// 페이지 체크
const checkPage = () => {
    return (req, res, next) => {
        const { page } = req.query;

        try {
        if (page < 0 || Number.isNaN(Number(page)) || !page) throw customError(400, `page 양식 오류`);
        next();
        } catch (e) {
        next(e);
        }
    };
}

module.exports = {
    checkRegInput,
    checkIdx,
    checkPage
};
