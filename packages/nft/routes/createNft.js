import express from 'express';

const router = express.Router();

// 创建 NFT 路由
const createNftRouter = (db) => {
  router.post('/', (req, res) => {
    const { tokenId, category, address, cid, royalty, gasused } = req.body;
    console.log('前端返回数据:', req.body);
    const status = 'false';
    const leaseStatus = 'false';
    const price = 0;

    // 插入 NFT 数据到数据库
    const query = `
      INSERT INTO nfts (tokenId, category, address, cid, royalty, status, leaseStatus, price, gasused) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    db.query(query, [tokenId, category, address, cid, royalty, status, leaseStatus, price, gasused], (err, result) => {
      if (err) {
        res.status(500).json({ error: '插入 NFT 数据失败' });
        console.error('插入 NFT 数据失败:', err);
        return;
      }
      res.status(200).json({ message: 'NFT 创建成功' });
      console.log('NFT 创建成功:', query);
    });
  });

  return router;
};

export default createNftRouter;
