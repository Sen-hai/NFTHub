
# 🎨 NFT 平台功能清单

| 编号 | 功能模块         | 核心功能描述                                                                                     |
|------|------------------|--------------------------------------------------------------------------------------------------|
| 1    | **用户认证**     | ✅ 支持 MetaMask 等主流钱包一键注册/登录                                                         |
| 2    | **NFT铸造**      | 🖼️ 用户可创建含名称、描述、多维度属性的NFT<br>📌 自动将资源文件上传至 IPFS 永久存储               |
| 3    | **作品管理**     | ⬆️ 灵活上下架机制<br>🛡️ 支持批量操作与状态实时同步                                               |
| 4    | **NFT发现**      | 🔍 多维筛选引擎（分类/价格/稀有度）<br>🎯 智能推荐算法+热门排行                                   |
| 5    | **NFT详情**      | 📊 可视化交易图谱<br>🕰️ 所有权变更历史追溯<br>📝 用户评论互动区                                   |
| 6    | **即时交易**     | 💸 智能合约自动撮合交易<br>🔐 资金第三方托管机制                                                  |
| 7    | **版税系统**     | 👑 创作者永久版权收益<br>⚖️ 自定义转售分成比例（5%-15%）                                          |
| 8    | **数据中枢**     | 🗃️ 链上链下数据双向同步<br>📈 用户行为分析与元数据归档                                            |
| 9    | **拍卖系统**     | ⏳ 倒计时动态竞价机制<br>🔔 出价预警通知<br>🎉 智能胜出者判定                                      |
| 10   | **碎片化方案**   | ✂️ NFT权益分割功能<br>📦 支持ERC-1155标准份额交易<br>💹 流动性池自动做市                           |
| 11   | **盲盒系统**     | 🎲 随机NFT生成协议<br>🔮 稀有度梯度配置<br>🎁 支持预售/限时发售模式                                |
| 12   | **空投管理**     | ✈️ 批量地址精准投放<br>🎯 可配置空投策略（随机/白名单/持有者奖励）<br>📊 空投效果分析仪表盘        |

---

**部署问题可联系**
senhai6@qq.com

### 🌟 特色亮点
- **多链兼容**：支持 Ethereum/Polygon/BSC 等主流公链
- **Gas优化**：采用 Layer2 解决方案降低交易成本
- **跨平台**：响应式设计适配 Web/iOS/Android
- **DAO治理**：持币者投票决定平台演进方向




🎫 Create a simple NFT:

👷‍♀️ You'll compile and deploy your first smart contracts. Then, you'll use a template React app full of important Ethereum components and hooks. Finally, you'll deploy an NFT to a public network to share with friends! 🚀




## Checkpoint 0: 📦 Environment 📚

Before you begin, you need to install the following tools:

- [Node (>= v18.17)](https://nodejs.org/en/download/)
- Yarn ([v1](https://classic.yarnpkg.com/en/docs/install/) or [v2+](https://yarnpkg.com/getting-started/install))
- [Git](https://git-scm.com/downloads)

Then download the challenge to your computer and install dependencies by running:

```sh
yarn install
```

> in the same terminal, start your local network (a local instance of a blockchain):

```sh
yarn chain
```

> in a second terminal window, 🛰 deploy your contract (locally):

```sh
yarn deploy
```

> in a third terminal window, start your 📱 frontend:

```sh
yarn start
```

📱 Open [http://localhost:3000](http://localhost:3000) to see the app.

---

## Checkpoint 1: ⛽️ Gas & Wallets 👛

> ⛽️ You'll need to get some funds from the faucet for gas.



> 🦊 At first, **don't** connect MetaMask. If you are already connected, click **Disconnect**:


> 🔥 We'll use burner wallets on localhost.

> 👛 Explore how burner wallets work in 🏗 Scaffold-ETH 2 by opening a new incognito window and navigate to http://localhost:3000. You'll notice it has a new wallet address in the top right. Copy the incognito browser's address and send localhost test funds to it from your first browser (using the **Faucet** button in the bottom left):



> 👨🏻‍🚒 When you close the incognito window, the account is gone forever. Burner wallets are great for local development but you'll move to more permanent wallets when you interact with public networks.

---

## Checkpoint 2: 🖨 Minting

> ✏️ Mint some NFTs! Click the **MINT NFT** button in the `My NFTs` tab.

👛 Open an incognito window and navigate to http://localhost:3000

🎟 Transfer an NFT to the incognito window address using the UI:


👛 Try to mint an NFT from the incognito window.

> Can you mint an NFT with no funds in this address? You might need to grab funds from the faucet to pay for the gas!

🕵🏻‍♂️ Inspect the `Debug Contracts` tab to figure out what address is the owner of YourCollectible?

🔏 You can also check out your smart contract `YourCollectible.sol` in `packages/hardhat/contracts`.

💼 Take a quick look at your deploy script `00_deploy_your_contract.js` in `packages/hardhat/deploy`.

📝 If you want to edit the frontend, navigate to `packages/nextjs/app` and open the specific page you want to modify. For instance: `/myNFTs/page.tsx`. For guidance on [routing](https://nextjs.org/docs/app/building-your-application/routing/defining-routes) and configuring [pages/layouts](https://nextjs.org/docs/app/building-your-application/routing/pages-and-layouts) checkout the Next.js documentation.

---

## Checkpoint 3: 💾 Deploy your contract! 🛰

🛰 Ready to deploy to a public testnet?!?

> Change the defaultNetwork in `packages/hardhat/hardhat.config.ts` to `sepolia`.


🔐 Generate a deployer address with `yarn generate`. This creates a unique deployer address and saves the mnemonic locally.

> This local account will deploy your contracts, allowing you to avoid entering a personal private key.


👩‍🚀 Use `yarn account` to view your deployer account balances.


⛽️ You will need to send ETH to your deployer address with your wallet, or get it from a public faucet of your chosen network.



> ⚔️ Side Quest: Keep a 🧑‍🎤 [punkwallet.io](https://punkwallet.io) on your phone's home screen and keep it loaded with testnet eth. 🧙‍♂️ You'll look like a wizard when you can fund your deployer address from your phone in seconds.

🚀 Deploy your NFT smart contract with `yarn deploy`.

> 💬 Hint: You can set the `defaultNetwork` in `hardhat.config.ts` to `sepolia` **OR** you can `yarn deploy --network sepolia`.

---

## Checkpoint 4: 🚢 Ship your frontend! 🚁

> ✏️ Edit your frontend config in `packages/nextjs/scaffold.config.ts` to change the `targetNetwork` to `chains.sepolia` :

> You should see the correct network in the frontend (http://localhost:3000):


> 🦊 Since we have deployed to a public testnet, you will now need to connect using a wallet you own or use a burner wallet. By default 🔥 `burner wallets` are only available on `hardhat` . You can enable them on every chain by setting `onlyLocalBurnerWallet: false` in your frontend config (`scaffold.config.ts` in `packages/nextjs/`)



🚀 Deploy your NextJS App

```shell
yarn vercel
```

> Follow the steps to deploy to Vercel. Once you log in (email, github, etc), the default options should work. It'll give you a public URL.

> If you want to redeploy to the same production URL you can run `yarn vercel --prod`. If you omit the `--prod` flag it will deploy it to a preview/test URL.

⚠️ Run the automated testing function to make sure your app passes

```shell
yarn test
```





For production-grade applications, it's recommended to obtain your own API keys (to prevent rate limiting issues). You can configure these at:

- 🔷`ALCHEMY_API_KEY` variable in `packages/hardhat/.env` and `packages/nextjs/.env.local`. You can create API keys from the [Alchemy dashboard](https://dashboard.alchemy.com/).

- 📃`ETHERSCAN_API_KEY` variable in `packages/hardhat/.env` with your generated API key. You can get your key [here](https://etherscan.io/myapikey).

> 💬 Hint: It's recommended to store env's for nextjs in Vercel/system env config for live apps and use .env.local for local testing.

---

## Checkpoint 5: 📜 Contract Verification

You can verify your smart contract on Etherscan by running (`yarn verify --network network_name`) :

```shell
yarn verify --network sepolia
```


