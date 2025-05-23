const customError = require("../util/customError");

const {
  regColor,
  regMatchDuration,
  regMatchDatetime,
  regTeamName,
  regTeamShortName,
  regTeamAnnouncement,
  regChampionshipName,
  regChampionshipDescription,
  regChampionshipPeriod,
} = require("../constant/regx");

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
  CHAMPIONSHIP_STATUS,
  MATCH_POSITION,
  BOARD_CATEGORY,
} = require("../constant/constantIndex");

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
        if (!value.every((item) => reg.test(item))) {
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
    const value =
      req.body[input] ??
      req.params[input] ??
      req.query[input] ??
      req.decoded?.[input];
    try {
      if (value === null || value === undefined) {
        throw customError(400, `${input} 양식 오류`);
      }

      if (Array.isArray(value)) {
        console.log(`🚀 배열 입력 확인: ${JSON.stringify(value)}`);

        const invalidValues = value.filter((item) =>
          Number.isNaN(Number(item))
        );

        if (invalidValues.length > 0) {
          console.log(
            `❌ 유효하지 않은 값들: ${JSON.stringify(invalidValues)}`
          );
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
      if (page < 0 || Number.isNaN(Number(page)) || !page)
        throw customError(400, `page 양식 오류`);
      next();
    } catch (e) {
      next(e);
    }
  };
};

// 매치 포메이션 체크
const checkMatchFormation = () => {
  return (req, res, next) => {
    const value =
      req.body.match_formation_idx ??
      req.params.match_formation_idx ??
      req.query.match_formation_idx;
    try {
      if (
        value === undefined ||
        !Object.values(MATCH_FORMATION).map(Number).includes(value)
      )
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
    const value =
      req.body.match_match_participation_type ??
      req.params.match_match_participation_type ??
      req.query.match_match_participation_type;
    try {
      if (
        value === undefined ||
        !Object.values(MATCH_PARTICIPATION_TYPE).map(Number).includes(value)
      )
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
    const value =
      req.body.match_type_idx ??
      req.params.match_type_idx ??
      req.query.match_type_idx;
    try {
      if (
        value === undefined ||
        !Object.values(MATCH_TYPE).map(Number).includes(value)
      )
        throw customError(400, `match_type_idx 양식 오류`);
      next();
    } catch (e) {
      next(e);
    }
  };
};

// 매치 속성 체크
const checkMatchAttribute = () => {
  return (req, res, next) => {
    const value =
      req.body.match_match_attribute ??
      req.params.match_match_attribute ??
      req.query.match_match_attribute;
    try {
      if (
        value === undefined ||
        !Object.values(MATCH_ATTRIBUTE).map(Number).includes(value)
      )
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
    const value =
      req.body.championship_type_idx ??
      req.params.championship_type_idx ??
      req.query.championship_type_idx;
    try {
      if (
        value === undefined ||
        !Object.values(CHAMPIONSHIP_TYPE).map(Number).includes(value)
      )
        throw customError(400, `championship_type_idx 양식 오류`);
      next();
    } catch (e) {
      next(e);
    }
  };
};

// 매치 포지션 체크
const checkPosition = () => {
  return (req, res, next) => {
    let value =
      req.body.match_position_idx ??
      req.params.match_position_idx ??
      req.query.match_position_idx;
    value = Number(value);
    try {
      if (
        value == null ||
        isNaN(value) ||
        !Object.values(MATCH_POSITION).includes(value)
      )
        throw customError(400, `포메이션에 존재하지 않는 포지션`);
      next();
    } catch (e) {
      next(e);
    }
  };
};

// 게시판 카테고리 체크
const checkCategory = () => {
  return (req, res, next) => {
    let value = req.body.category ?? req.params.category ?? req.query.category;

    try {
      // undefined 또는 null 체크
      if (value == null) {
        throw customError(400, `category 값이 없습니다.`);
      }

      // 숫자로 변환 (숫자가 아닐 경우 NaN 처리됨)
      value = Number(value);

      // NaN(숫자로 변환할 수 없는 값)인지 체크
      if (isNaN(value)) {
        throw customError(400, `category 값이 올바르지 않습니다.`);
      }

      // BOARD_CATEGORY에 존재하는 값인지 확인
      if (!Object.values(BOARD_CATEGORY).includes(value)) {
        throw customError(400, `category 값이 올바르지 않습니다.`);
      }

      next();
    } catch (e) {
      next(e);
    }
  };
};

// 현재 시각보다 빠른 시각에 매치를 생성할 수 없다.
const checkMatchStartTimeValid = () => {
  return (req, res, next) => {
    const { match_match_start_time } = req.body;

    try {
      const inputKST = new Date(match_match_start_time);
      const inputUTC = new Date(inputKST.getTime() - 9 * 60 * 60 * 1000);

      const nowUTC = new Date(); // 현재 시간은 UTC 기준

      if (inputUTC < nowUTC) {
        throw customError(
          400,
          "매치 시작 시간이 현재 시각보다 과거일 수 없습니다."
        );
      }

      next();
    } catch (e) {
      next(e);
    }
  };
};

const checkRegInputs = (regs, checks) => {
  return (req, res, next) => {
    try {
      if (
        !Array.isArray(regs) ||
        !Array.isArray(checks) ||
        regs.length !== checks.length
      ) {
        throw customError(
          500,
          "regs와 checks의 배열 길이가 일치하지 않습니다."
        );
      }

      for (let i = 0; i < checks.length; i++) {
        const key = checks[i];
        const reg = regs[i];

        const value = req.body[key] ?? req.params[key] ?? req.query[key];

        if (value === undefined || value === null || value === "") {
          throw customError(400, `${key} 값이 없습니다.`);
        }

        if (Array.isArray(value)) {
          if (!value.every((item) => reg.test(item))) {
            throw customError(400, `${key} 배열 내 요소의 양식 오류`);
          }
        } else {
          if (!reg.test(value)) {
            throw customError(400, `${key} 양식 오류`);
          }
        }
      }

      next();
    } catch (e) {
      next(e);
    }
  };
};

// 매치 길이 체크
const checkMatchDuration = () => {
  return (req, res, next) => {
    try {
      const duration = req.body.match_match_duration;

      if (!duration || typeof duration !== "object") {
        throw customError(404, "duration 형식이 올바르지 않습니다.");
      }

      const { hours = 0, minutes = 0 } = duration;
      const totalMinutes = hours * 60 + minutes;

      const validDurations = [30, 60, 90, 120];
      if (!validDurations.includes(totalMinutes)) {
        throw customError(
          404,
          "유효하지 않은 duration 값입니다. (30, 60, 90, 120분만 허용됨)"
        );
      }

      next();
    } catch (e) {
      next(e);
    }
  };
};

const validateAwardForm = (req, res, next) => {
  try {
    const { championship_award_name } = req.body;
    const files = req.files;

    if (!files) {
      return res
        .status(400)
        .json({ message: "우승 트로피 이미지가 존재하지 않습니다." });
    }

    // 문자열 하나만 올 경우, championship_award_name은 string
    const awardNames = Array.isArray(championship_award_name)
      ? championship_award_name
      : [championship_award_name];

    if (files.length !== awardNames.length + 1) {
      return res.status(400).json({
        message: `파일 수가 올바르지 않습니다. 상 이름 ${
          awardNames.length
        }개 + 트로피 이미지 1개 = 총 ${
          awardNames.length + 1
        }개의 파일이 필요합니다.`,
      });
    }

    next();
  } catch (e) {
    next(e);
  }
};

module.exports = {
  checkRegInput,
  checkRegInputs,
  checkIdx,
  checkPage,
  checkMatchFormation,
  checkMatchParticipationType,
  checkMatchType,
  checkMatchAttribute,
  checkChampionshipType,
  checkPosition,
  checkCategory,
  checkMatchStartTimeValid,
  checkMatchDuration,
  validateAwardForm,
};
