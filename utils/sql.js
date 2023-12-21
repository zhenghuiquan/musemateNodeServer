import pkg from 'pg';
const { Pool } = pkg;
import moment from "moment-timezone"

var env = process.env.NODE_ENV == "production"

const pool = new Pool({
  user: env ? "" : "postgres",
  host: env ? "" : "dn.arbtv.top",
  database: env ? "" : 'social_dn',
  password: "1234qwer..",
  port: 5432,
})

export default {
  query: async (value, condition, tables, callback) => {
    const client = await pool.connect();
    try {
      const result = await client.query(`SELECT ${value} FROM ${tables} WHERE ${condition}`);
      callback(result.rows);
    } finally {
      // 释放客户端到池中
      client.release();
    }
  },
  queryAll: async (tables, callback) => {
    const client = await pool.connect();
    try {
      const result = await client.query(`SELECT * FROM ${tables}`);
      callback(result.rows);
    } finally {
      // 释放客户端到池中
      client.release();
    }
  },
  queryRepeat: async (value, tables, callback) => {
    const client = await pool.connect();
    try {
      const result = await client.query(`SELECT DISTINCT ${value} FROM ${tables}`);
      callback(result.rows);
    } finally {
      // 释放客户端到池中
      client.release();
    }
  },
  insert: async (table, data, callback) => {
    const client = await pool.connect();

    try {
      let tableHead = "";
      let tableValue = "";
      for (let i in data) {
        tableHead = tableHead + ',' + i;
        if (typeof data[i] == 'string') {
          tableValue = tableValue + ',\'' + data[i] + '\'';
        } else {
          tableValue = tableValue + ',' + data[i];
        }
      }
      tableHead = tableHead.slice(1)
      tableValue = tableValue.slice(1)
      const result = await client.query(`INSERT INTO ${table} (${tableHead}) VALUES (${tableValue});`);
      callback()
    } finally {
      // 释放客户端到池中
      client.release();
    }
  },
  update: async (value, condition, tables, callback) => {
    const client = await pool.connect();
    try {
      const result = await client.query(`UPDATE ${tables} SET ${value} WHERE ${condition};`);
      callback(result.rows);
    } finally {
      // 释放客户端到池中
      client.release();
    }
  },
  rank: async (num, callback) => {
    const client = await pool.connect();
    try {
      const result = await client.query(`SELECT * FROM game_system_rank WHERE start_time >= $1 AND start_time <= $2 ORDER BY integral DESC, start_time ASC LIMIT ${num}`, [moment().startOf('day').valueOf(), moment().endOf('day').valueOf()]);
      callback(result.rows)
    } finally {
      // 释放客户端到池中
      client.release();
    }
  }
}