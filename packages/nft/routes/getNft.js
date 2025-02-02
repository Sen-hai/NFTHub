import express from 'express';

const router = express.Router();

// 创建 NFT 路由
const getNftRouter = (db) => {
    router.get('/category/:tokenId', (req, res) => {
        const { tokenId } = req.params;

        const query = `SELECT category FROM nfts WHERE tokenId = ?`;

        db.query(query, [tokenId], (err, result) => {
            if (err) {
                console.error('获取类别信息失败:', err);
                return res.status(500).json({ error: '获取类别信息失败' });
            }

            if (result.length > 0) {
                res.json({ category: result[0].category });
                console.log('类别信息:', result[0].category);
            } else {
                res.status(404).json({ error: 'NFT 未找到类别信息' });
            }
        });
    });

    return router;
};

export default getNftRouter;
