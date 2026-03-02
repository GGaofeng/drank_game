/**
 * MySQL 连接预留
 * 需要时：npm install mysql2 dotenv，取消下方注释并在 .env 中配置
 */
// const mysql = require('mysql2/promise');
// require('dotenv').config();

// const pool = mysql.createPool({
//   host: process.env.MYSQL_HOST || 'localhost',
//   port: process.env.MYSQL_PORT || 3306,
//   user: process.env.MYSQL_USER,
//   password: process.env.MYSQL_PASSWORD,
//   database: process.env.MYSQL_DATABASE || 'drink_game',
//   waitForConnections: true,
//   connectionLimit: 10,
//   queueLimit: 0,
// });

// module.exports = { pool };

module.exports = null;
