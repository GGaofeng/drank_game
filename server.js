/**
 * 酒桌游戏 - Node 服务
 * 静态页面 + 预留 API，后续可接 MySQL
 */
const path = require('path');
const express = require('express');

const app = express();
const PORT = process.env.PORT || 6969;

// 静态资源（当前目录下的 index.html、css、js）
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// 首页由 index.html 提供，无需单独路由

// ---------- 预留 API（后续接 MySQL 时可在这里加）--------------
// 例如：自定义题库、战绩统计、房间等

// app.get('/api/questions', async (req, res) => { ... });
// app.post('/api/questions', async (req, res) => { ... });
// app.get('/api/stats', async (req, res) => { ... });

app.get('/api/health', (req, res) => {
  res.json({ ok: true, message: '今晚不回家 🍻' });
});

// ---------- 启动 ----------
app.listen(PORT, () => {
  console.log(`酒桌游戏已启动: http://localhost:${PORT}`);
  console.log('手机同网可访问: http://<本机IP>:' + PORT);
});
