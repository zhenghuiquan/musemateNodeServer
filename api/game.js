import express, { query } from "express"
import bodyParseer from "body-parser"
import pg from "../utils/sql.js"
import errCode from "../utils/errCode.js";
import { getVerifyToken, getuserHeader, gameDetail, getuserCoin, setUserCoin, addCoinIncome, getGameDetail, getUserName } from "../utils/getInfo.js";
import { getMaxNum } from "../utils/index.js";
import { v1 as uuidV1 } from "uuid"
import {
  md5
} from '../utils/md5.js'
import moment from "moment-timezone"
import cron from "node-cron"
cron.schedule('0 0 * * *', () => {
  dailyRewardLogic();
});
async function dailyRewardLogic() {
  pg.query('SUM(spend_coin) AS total', `end_time >= ${moment().startOf('day').valueOf()} AND end_time < ${moment().endOf('day').valueOf()}`, 'game_system_rank', (data) => {
    let total = data[0]['total']
    pg.rank(10, (datas) => {
      let rote = [0.3, 0.2, 0.15, 0.066, 0.066, 0.066, 0.037, 0.037, 0.037, 0.037];
      for (let i = 0; i < datas.length; i++) {
        getuserCoin(datas[i]['user_id'], (coin) => {
          setUserCoin(datas[i]['user_id'], Number(coin) + Math.floor(total * rote[i]), () => { })
          addCoinIncome({
            credit: Math.floor(total * rote[i]),
            balance: Number(coin) + Math.floor(total * rote[i]),
            user_id: datas[i]['user_id'],
            detail: "Flight Challenge Ranking Rewards: " + Math.floor(total * rote[i]) + " gold coins"
          })
        })
      }
    })
  })
}

const app = express();
app.use(express.json())
app.use(bodyParseer.urlencoded({
  extended: false
}))
app.use(bodyParseer.json());

app.get('/user/info', (req, res) => {
  // req.headers
  if (req.header("token")) {
    getVerifyToken(req.header("token"), (userId) => {
      getuserHeader(userId, (head) => {
        pg.queryAll('game_system_rank', (data) => {
          let maxScore = 0;
          let hasTimes = 2;
          let dayMaxScore = null;
          let rank = 0;
          let jackpot = 0;
          let idList = [];
          let newArr = [];
          for (let i = 0; i < data.length; i++) {
            jackpot = jackpot + data[i]['spend_coin']
            if (!idList.includes(data[i]['user_id'])) {
              newArr.push(data[i]);
              idList.push(data[i]['user_id'])
            }
            if (data[i]['user_id'] == userId) {
              // 最大积分
              if (data[i]["integral"] > maxScore) {
                maxScore = data[i]["integral"]
              }
              // 免费次数
              if (data[i]['start_time'] >= new Date().setUTCHours(0, 0, 0, 0)) {
                if (data[i]['type'] == 1) {
                  hasTimes--;
                }
                if (dayMaxScore == null) {
                  dayMaxScore = data[i];
                } else {
                  if (data[i]['integral'] > dayMaxScore['integral']) {
                    dayMaxScore = data[i];
                  }
                }
              }
            }
          }
          newArr = newArr.sort((a, b) => b.integral - a.integral);
          for (let i = 0; i < newArr.length; i++) {
            if (newArr[i]['user_id'] == userId) {
              rank = i + 1;
            }
          }
          res.send({
            code: 200,
            result: {
              headUrl: head,
              maxScore: maxScore, // 最大积分
              times: hasTimes <= 0 ? 0 : hasTimes, // 免费次数
              buyCoin: 20,
              rank: rank, // 我的排名
              jackpot: jackpot // 奖池金币
            }
          })
        })
      })
    })
  } else {
    res.send(errCode[1000001])
  }
})

app.post("/fly/start", (req, res) => {
  if (req.header("token")) {
    getVerifyToken(req.header("token"), (userId) => {
      if (req.body.useType == 1) {
        getUserName(userId, (nickname) => {
          let detailId = uuidV1();
          gameDetail({
            user_id: userId,
            type: req.body.useType,
            spend_coin: req.body.useType == 1 ? 0 : 20,
            reset: 0,
            nickname: nickname,
            integral: 0,
            start_time: new Date().getTime(),
            end_time: 0,
            detail_id: detailId
          }, () => {
            res.send({
              code: 200,
              result: {
                log: {
                  detailId
                }
              }
            })
          });
        })
      } else {
        getuserCoin(userId, (coin) => {
          if (coin >= 20) {
            let detailId = uuidV1();
            let newCoin = coin - 20
            setUserCoin(userId, newCoin, () => {
              addCoinIncome({
                credit: -20,
                balance: newCoin,
                user_id: userId,
                detail: "Consumption of flight game challenge attempts: 20 gold coins"
              })
              getUserName(userId, (nickname) => {
                console.log("nickname")
                gameDetail({
                  user_id: userId,
                  type: req.body.useType,
                  spend_coin: req.body.useType == 1 ? 0 : 20,
                  reset: 0,
                  nickname: nickname,
                  integral: 0,
                  start_time: new Date().getTime(),
                  end_time: 0,
                  detail_id: detailId
                }, () => {
                  res.send({
                    code: 200,
                    result: {
                      log: {
                        detailId
                      }
                    }
                  })
                })
              })
            })
          } else {
            res.send(errCode[1000002])
          }
        })
      }
    })
  } else {
    res.send(errCode[1000001])
  }
})

app.post("/fly/again", (req, res) => {
  if (req.header("token")) {
    getVerifyToken(req.header("token"), (userId) => {
      if (req.body.detailId) {
        getGameDetail(req.body.detailId, (data) => {
          let spend_coin = (data['reset'] + 1) * 20;
          // 获取用户金额
          getuserCoin(userId, (coin) => {
            if (coin > spend_coin) {
              // 扣费
              let newCoin = coin - spend_coin;
              setUserCoin(userId, newCoin, () => {
                // 添加金币消耗记录
                addCoinIncome({
                  credit: -spend_coin,
                  balance: newCoin,
                  user_id: userId,
                  detail: `The cost of reviving in the flying game challenge: ${spend_coin} gold coins`
                })
                // 更改复活次数
                pg.update(`spend_coin = ${data['spend_coin'] + spend_coin},reset = ${data['reset'] + 1}`, `detail_id = '${req.body.detailId}'`, 'game_system_rank', () => {
                  res.send({
                    code: 200,
                    result: "",
                  })
                })
              })
            } else {
              res.send(errCode[1000002])
            }
          })
        })
      } else {
        res.send(errCode[1000003])
      }
    })
  } else {
    res.send(errCode[1000001])
  }
})

app.post("/fly/end", (req, res) => {
  if (req.header("token")) {
    getVerifyToken(req.header("token"), (userId) => {
      if (req.body.detailId) {
        if (md5("score=" + req.body.score) == req.body.sign) {
          getGameDetail(req.body.detailId, (datas) => {
            pg.update(`integral = ${req.body.score},end_time = ${new Date().getTime()}`, `detail_id = '${req.body.detailId}'`, "game_system_rank", () => {
              let maxScore = 0;
              pg.query(`MAX(integral) AS max_integral`, `user_id = '${userId}'`, 'game_system_rank', (maxdata) => {
                maxScore = maxdata[0]["max_integral"];
                let lastRank = 0;
                let lastScore = 0;
                pg.queryAll('game_system_rank', (data) => {
                  let arr = [];
                  let idList = [];
                  let newData = data.sort((a, b) => b.integral - a.integral);
                  for (let i = 0; i < newData.length; i++) {
                    if (!idList.includes(newData[i]['user_id'])) {
                      arr.push(newData[i])
                      idList.push(newData[i]['user_id'])
                    }
                  }
                  for (let i = 0; i < arr.length; i++) {
                    if (arr[i]['detail_id'] == req.body.detailId) {
                      lastRank = i == 0 ? 1 : i;
                      lastScore = i == 0 ? 0 : arr[i - 1]['integral'] - data["integral"]
                    }
                  }
                  res.send({
                    code: 200,
                    result: {
                      score: req.body.score,
                      maxScore: maxScore,
                      lastRank: lastRank,
                      lastScore: lastScore,
                      consumeCoin: (datas.reset + 1) * 20,
                    }
                  })
                })
              })
            })
          })
        } else {
          res.send(errCode[1000004])
        }
      } else {
        res.send(errCode[1000003])
      }
    })
  } else {
    res.send(errCode[1000001])
  }
})

app.get("/fly/list", (req, res) => {
  if (req.header("token")) {
    pg.queryAll('game_system_rank', (data) => {
      let newarr = [];
      let idList = [];
      let newData = data.sort((a, b) => b.integral - a.integral);
      for (let i = 0; i < newData.length; i++) {
        if (!idList.includes(newData[i]['user_id'])) {
          newarr.push({
            rank: i + 1,
            nickname: newData[i]['nickname'],
            maxScore: newData[i]['integral']
          })
          idList.push(newData[i]['user_id'])
        }
      }
      res.send({
        code: 200,
        result: newarr.slice(0, 50),
      })
    })
  } else {
    res.send(errCode[1000001])
  }
})

export default app