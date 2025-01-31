import express from 'express';
import bodyParser from 'body-parser';  // 使用默认导入
import cors from 'cors';  // 导入 cors
import { db } from './db.js';   // 导入 db.js 中的数据库连接
import createNftRouter from './routes/createNft.js';
import getNftRouter from './routes/getNft.js';


const app = express();
const port = 5000;

// 启用 CORS 中间件
app.use(cors());  // 允许所有来源的跨域请求

// 中间件：解析请求体中的 JSON 数据
app.use(bodyParser.json());

// 使用不同的路由模块，并将数据库连接传递给路由
app.use("/create-nft", createNftRouter(db));   // 创建NFT路由
app.use("/get-nft", getNftRouter(db));    // 获取NFT路由


// 启动服务器
app.listen(port, () => {
  console.log(`服务器正在监听 ${port} 端口`);
});
