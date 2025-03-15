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

const {
  TEAM_ROLE,
  MATCH_PARTICIPATION_TYPE,
  MATCH_ATTRIBUTE,
  MATCH_TYPE,
  MATCH_FORMATION,
  MATCH_DURATION,
  COMMUNITY_ROLE,
  COMMUNINY_IDX,
  COMMON_STATUS,
  CHAMPIONSHIP_TYPE,
  CHAMPIONSHIP_STATUS
} = require("../constant/constantIndex")

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
      if (value === null || value === undefined) {
        throw customError(400, `${input} 양식 오류`);
      }

      if (Array.isArray(value)) {
        console.log(`🚀 배열 입력 확인: ${JSON.stringify(value)}`);

        const invalidValues = value.filter(item => Number.isNaN(Number(item)));

        if (invalidValues.length > 0) {
          console.log(`❌ 유효하지 않은 값들: ${JSON.stringify(invalidValues)}`);
          throw customError(400, `${input} 배열 내 숫자가 아닌 값 포함`);
        }
      } else {
        if (Number.isNaN(Number(value))) {
          throw customError(400, `${input} 양식 오류`);
        }
      }
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

// 매치 포메이션 체크
const checkMatchFormation = () => {
  return (req, res, next) => {
    const value = req.body.match_formation_idx ?? req.params.match_formation_idx ?? req.query.match_formation_idx;
    try {
      if (value === undefined || !Object.values(MATCH_FORMATION).map(Number).includes(value))
        throw customError(400, `match_formation_idx 양식 오류`);
      next();
    } catch (e) {
      next(e);
    }
  };
};

// 매치 참여 방식
const checkMatchParticipationType = () => {
  return (req, res, next) => {
    const value = req.body.match_match_participation_type ?? req.params.match_match_participation_type ?? req.query.match_match_participation_type;
    try {
      if (value === undefined || !Object.values(MATCH_PARTICIPATION_TYPE).map(Number).includes(value))
        throw customError(400, `match_match_participation_type 양식 오류`);
      next();
    } catch (e) {
      next(e);
    }
  };
};

// 매치 타입 체크
const checkMatchType = () => {
  return (req, res, next) => {
    const value = req.body.match_type_idx ?? req.params.match_type_idx ?? req.query.match_type_idx;
    try {
      if (value === undefined || !Object.values(MATCH_TYPE).map(Number).includes(value))
        throw customError(400, `match_type_idx 양식 오류`);
      next();
    } catch (e) {
      next(e);
    }
  };
};


// 매치 공개 여부 체크
const checkMatchAttribute = () => {
  return (req, res, next) => {
    const value = req.body.match_match_attribute ?? req.params.match_match_attribute ?? req.query.match_match_attribute;
    try {
      if (value === undefined || !Object.values(MATCH_ATTRIBUTE).map(Number).includes(value))
        throw customError(400, `match_match_attribute 양식 오류`);
      next();
    } catch (e) {
      next(e);
    }
  };
};

// 대회 매치 타입 체크
const checkChampionshipType = () => {
  return (req, res, next) => {
    const value = req.body.championship_type_idx ?? req.params.championship_type_idx ?? req.query.championship_type_idx;
    try {
      if (value === undefined || !Object.values(CHAMPIONSHIP_TYPE).map(Number).includes(value))
        throw customError(400, `championship_type_idx 양식 오류`);
      next();
    } catch (e) {
      next(e);
    }
  };
};

module.exports = {
  checkRegInput,
  checkIdx,
  checkPage,
  checkMatchFormation,
  checkMatchParticipationType,
  checkMatchType,
  checkMatchAttribute,
  checkChampionshipType
};
