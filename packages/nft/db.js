import { createConnection } from 'mysql2';

// 创建并连接数据库
const db = createConnection({
  host: 'localhost',
  user: '',
  password: '',  // 替换为您自己的数据库密码
  database: '',     // 替换为您的数据库名称
});

db.connect((err) => {
  if (err) {
    console.error('数据库连接失败: ', err);
    return;
  }
  console.log('数据库连接成功');
});

// 导出 db 实例
// 导出数据库连接
export { db };
