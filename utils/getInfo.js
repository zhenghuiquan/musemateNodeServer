import pg from "./sql.js"
import moment from "moment-timezone"

export function getVerifyToken(token, callback) {
  pg.query('user_id', `key = '${token}'`, 'authtoken_token', (data) => {
    callback(data[0]["user_id"])
  })
}

export function getUserName(userId, callback) {
  pg.query('nickname', `user_id = '${userId}'`, 'user_system_userinfo', (data) => {
    callback(data[0]["nickname"])
  })
}

export function getuserHeader(userId, callback) {
  pg.query('avatar_img', `user_id = '${userId}'`, 'user_system_userinfo', (data) => {
    callback(data[0]["avatar_img"])
  })
}

export function getuserCoin(userId, callback) {
  pg.query('credit', `user_id = '${userId}'`, 'user_system_userinfo', (data) => {
    callback(data[0]["credit"])
  })
}

export function setUserCoin(userId, num, callback) {
  pg.update(`credit = ${num}`, `user_id = '${userId}'`, 'user_system_userinfo', () => {
    callback()
  })
}


export function gameDetail(data, callback) {
  pg.insert('game_system_rank', data, () => {
    callback();
  })
}

export function addCoinIncome(data) {
  pg.insert('user_system_userincome', {
    is_output: data.credit > 0 ? true : false,
    credit: Math.abs(data.credit),
    balance: data.balance,
    create_time: moment().format('YYYY-MM-DD HH:mm:ss.SSSZ'),
    user_id: data.user_id,
    detail: data.detail,
  }, () => {

  })
}

export function getGameDetail(detailId, callback) {
  pg.query('*', `detail_id = '${detailId}'`, 'game_system_rank', (data) => {
    callback(data[0])
  })
}

