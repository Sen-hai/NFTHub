// SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Royalty.sol"; // 用于版税支持
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract YourCollectible is
	ERC721,
	ERC721Enumerable,
	ERC721URIStorage,
	ERC721Royalty,
	Ownable,
	ReentrancyGuard
{
	using Counters for Counters.Counter;

	Counters.Counter public tokenIdCounter; // 用于自动生成Token ID
	uint256 public totalFeesCollected; // 累计收取的上架费用

	// 定义NFT项的结构体
	struct NftItem {
		uint256 tokenId;
		uint256 price;
		address payable seller;
		bool isListed;
		string tokenUri;
		uint256 expirationTime; //上架到期时间（UNIX 时间戳）
	}

	// 定义拍卖结构体
	struct Auction {
		uint256 tokenId;
		address payable seller;
		uint256 startingBid;
		uint256 currentBid;
		address payable highestBidder;
		uint256 endTime;
		bool isActive;
	}

	struct TradeHistory {
		address from; // 卖家地址
		address to; // 买家地址
		uint256 price; // 交易价格
		uint256 royalty; // 支付的版税金额
		uint256 timestamp; // 交易时间戳
	}

	// 用于映射Token ID到NftItem
	mapping(uint256 => NftItem) private _idToNftItem;
	// 用于映射Token ID到拍卖信息
	mapping(uint256 => Auction) private _idToAuction;
	// An array to keep track of all auctioned tokens
	uint256[] private _auctionedTokenIds;

	// 用于记录Token URI是否被使用过，避免重复
	mapping(string => bool) private _usedTokenURIs;
	// 列出所有的Token ID
	uint256[] private _listedTokenIds;
	// 用于记录Token ID到已列出索引的映射
	mapping(uint256 => uint256) private _tokenIdToListedIndex;
	// 交易时的上架费率（以千分之一计算）
	uint256 public listingFeePercentage = 250; // 2.5%
	uint256 public constant MAX_LISTING_FEE_PERCENTAGE = 1000; // 最高10%
	// 用于记录每个Token ID的交易历史记录
	mapping(uint256 => TradeHistory[]) private _tradeHistories;

	// 定义事件
	event NftListed(
		uint256 indexed tokenId,
		address indexed seller,
		uint256 price
	);
	event NftUnlisted(uint256 indexed tokenId, address indexed seller);
	event NftPurchased(
		uint256 indexed tokenId,
		address indexed buyer,
		uint256 price
	);
	event AuctionCreated(
		uint256 indexed tokenId,
		address indexed seller,
		uint256 startingBid,
		uint256 endTime
	);
	event BidPlaced(
		uint256 indexed tokenId,
		address indexed bidder,
		uint256 bidAmount
	);
	event AuctionEnded(
		uint256 indexed tokenId,
		address indexed highestBidder,
		uint256 highestBid
	);
	event ListingFeePercentageUpdated(uint256 newListingFeePercentage);
	event FeesWithdrawn(address indexed owner, uint256 amount);
	event FeesReceived(address indexed sender, uint256 amount);
	event RoyaltySet(
		uint256 indexed tokenId,
		address indexed receiver,
		uint96 feeNumerator
	);

	// 定义事件
	event PaymentReceived(address indexed sender, uint256 amount);

	// 构造函数，初始化NFT名称和符号
	constructor() ERC721("YourCollectible", "ZJP") {}

	// 设置基础URI，返回所有tokenURI的基本路径
	function _baseURI() internal pure override returns (string memory) {
		return "";
	}

	// Merkle Root 存储
	bytes32 public merkleRoot;
	// 记录每个地址是否已经领取过空投
	mapping(address => bool) public hasClaimed;

	// 允许管理者设置Merkle Root, 用户验证空投
	function setMerkleRoot(bytes32 _merkleRoot) external onlyOwner {
		merkleRoot = _merkleRoot;
	}

	// 空投函数，允许用户领取NFT
	function claimNFT(
		bytes32[] calldata merkleProof,
		uint256 tokenId
	) external {
		require(
			!hasClaimed[msg.sender],
			"You have already claimed your airdrop"
		);

		// 构建叶子节点
		bytes32 leaf = keccak256(abi.encodePacked(msg.sender, tokenId));

		// 验证 Merkle 树
		require(
			MerkleProof.verify(merkleProof, merkleRoot, leaf),
			"Invalid Merkle proof"
		);

		// 领取空投
		hasClaimed[msg.sender] = true;
		_safeTransfer(address(this), msg.sender, tokenId, "");
	}

	/**
	 * @dev 铸造新的NFT并设置版税，铸造者为版税接收者
	 * @param to 接收者地址
	 * @param uri NFT的元数据URI
	 * @param feeNumerator 版税比例（百分比的千分之一），如500表示5%
	 * @return tokenId 新铸造的NFT的Token ID
	 */
	function mintItem(
		address to,
		string memory uri,
		uint96 feeNumerator
	) public returns (uint256) {
		tokenIdCounter.increment();
		uint256 tokenId = tokenIdCounter.current();
		_safeMint(to, tokenId);
		_setTokenURI(tokenId, uri);

		// 铸造者作为版税接收者
		_setTokenRoyalty(tokenId, msg.sender, feeNumerator);
		emit RoyaltySet(tokenId, msg.sender, feeNumerator);

		// 拼接完整的 tokenURI
		string memory completeTokenURI = string(
			abi.encodePacked(_baseURI(), uri)
		);

		_idToNftItem[tokenId] = NftItem({
			tokenId: tokenId,
			price: 0,
			seller: payable(address(0)),
			isListed: false,
			tokenUri: completeTokenURI,
			expirationTime: 0 // 默认值
		});

		emit NftUnlisted(tokenId, address(0));
		return tokenId;
	}

	/**
	 * @dev 批量铸造NFT，将铸造的NFT分配给合约自身
	 * @param uris NFT的元数据URI数组
	 * @param quantity 铸造数量
	 * @return mintedTokenIds 新铸造的NFT的Token ID数组
	 */
	function mintBatchForAirdrop(
		string[] memory uris,
		uint256 quantity
	) public returns (uint256[] memory) {
		require(
			uris.length == quantity,
			"URI length must be equal to quantity"
		);
		require(quantity > 0, "Quantity must be greater than 0");
		require(quantity <= 20, "Exceeded max batch size of 20"); // 限制批量铸造最大数量

		uint256[] memory mintedTokenIds = new uint256[](quantity);

		for (uint256 i = 0; i < quantity; i++) {
			tokenIdCounter.increment();
			uint256 tokenId = tokenIdCounter.current();

			// 将NFT铸造到合约地址
			_mint(address(this), tokenId);

			// 设置每个NFT的元数据URI
			_setTokenURI(tokenId, uris[i]);

			// 记录NFT的元数据信息
			_idToNftItem[tokenId] = NftItem({
				tokenId: tokenId,
				price: 0,
				seller: payable(address(0)),
				isListed: false,
				tokenUri: uris[i],
				expirationTime: 0 // 默认值
			});

			// 将Token ID添加到结果数组中
			mintedTokenIds[i] = tokenId;
		}

		return mintedTokenIds;
	}

	/**
	 * @dev 批量铸造NFT，将铸造的NFT分配给铸造者
	 * @param uris NFT的元数据URI数组
	 * @param quantity 铸造数量
	 * @return mintedTokenIds 新铸造的NFT的Token ID数组
	 */
	function mintBatch(
		string[] memory uris,
		uint256 quantity
	) public returns (uint256[] memory) {
		require(
			uris.length == quantity,
			"URI length must be equal to quantity"
		);
		require(quantity > 0, "Quantity must be greater than 0");
		require(quantity <= 20, "Exceeded max batch size of 20"); // 限制批量铸造最大数量

		uint256[] memory mintedTokenIds = new uint256[](quantity);

		for (uint256 i = 0; i < quantity; i++) {
			tokenIdCounter.increment();
			uint256 tokenId = tokenIdCounter.current();

			// 将NFT铸造到铸造者地址
			_mint(msg.sender, tokenId);

			// 设置每个NFT的元数据URI
			_setTokenURI(tokenId, uris[i]);

			// 记录NFT的元数据信息
			_idToNftItem[tokenId] = NftItem({
				tokenId: tokenId,
				price: 0,
				seller: payable(msg.sender), // 设置铸造者为卖家
				isListed: false,
				tokenUri: uris[i],
				expirationTime: 0 // 默认值
			});

			// 将Token ID添加到结果数组中
			mintedTokenIds[i] = tokenId;
		}

		return mintedTokenIds;
	}

	/**
	 * @dev 上架NFT，设置价格并记录卖家信息
	 * @param tokenId NFT的Token ID
	 * @param price 上架的价格
	 * @param duration 上架持续时间（秒），0 表示无限期
	 */
	function placeNftOnSale(
		uint256 tokenId,
		uint256 price,
		uint256 duration
	) public {
		require(
			ownerOf(tokenId) == msg.sender,
			"Only the owner can list the NFT"
		);
		require(!_idToNftItem[tokenId].isListed, "NFT is already listed");
		require(price > 0, "Price must be greater than zero");

		uint256 expirationTime = duration == 0 ? 0 : block.timestamp + duration;

		_idToNftItem[tokenId].price = price;
		_idToNftItem[tokenId].seller = payable(msg.sender);
		_idToNftItem[tokenId].isListed = true;
		_idToNftItem[tokenId].expirationTime = expirationTime;

		_listedTokenIds.push(tokenId);
		_tokenIdToListedIndex[tokenId] = _listedTokenIds.length - 1;

		emit NftListed(tokenId, msg.sender, price);
	}

	/**
	 * @dev 创建拍卖
	 * @param tokenId NFT的Token ID
	 * @param startingBid 拍卖的起始价格
	 * @param duration 拍卖持续时间（秒）
	 */
	function createAuction(
		uint256 tokenId,
		uint256 startingBid,
		uint256 duration
	) public {
		require(
			ownerOf(tokenId) == msg.sender,
			"Only the owner can create an auction"
		);
		require(!_idToAuction[tokenId].isActive, "Auction is already active");
		require(startingBid > 0, "Starting bid must be greater than zero");

		uint256 endTime = block.timestamp + duration;

		_idToAuction[tokenId] = Auction({
			tokenId: tokenId,
			seller: payable(msg.sender),
			startingBid: startingBid,
			currentBid: 0,
			highestBidder: payable(address(0)),
			endTime: endTime,
			isActive: true
		});

		// Add the token ID to the auctioned list
		_auctionedTokenIds.push(tokenId);

		emit AuctionCreated(tokenId, msg.sender, startingBid, endTime);
	}

	/**
	 * @dev 出价
	 * @param tokenId NFT的Token ID
	 */
	function placeBid(uint256 tokenId) public payable {
		Auction storage auction = _idToAuction[tokenId];
		require(auction.isActive, "Auction is not active");
		require(block.timestamp < auction.endTime, "Auction has ended");
		require(
			msg.value > auction.currentBid,
			"Bid must be higher than current bid"
		);

		// 退还之前的最高出价者
		if (auction.highestBidder != address(0)) {
			auction.highestBidder.transfer(auction.currentBid);
		}

		auction.currentBid = msg.value;
		auction.highestBidder = payable(msg.sender);

		emit BidPlaced(tokenId, msg.sender, msg.value);
	}

	/**
	 * @dev 结束拍卖
	 *
	 * @param tokenId NFT的Token ID
	 */
	function endAuction(uint256 tokenId) public nonReentrant {
		Auction storage auction = _idToAuction[tokenId];

		// 检查拍卖是否仍在进行中
		require(auction.isActive, "Auction has already ended");

		// 拍卖到期后，标记为非活动状态
		auction.isActive = false;

		if (auction.highestBidder != address(0)) {
			// 转移NFT给最高出价者
			_transfer(auction.seller, auction.highestBidder, tokenId);

			// 向卖家支付拍卖所得金额
			uint256 finalAmount = auction.currentBid;

			// 向卖家转账
			(bool sellerPaid, ) = auction.seller.call{ value: finalAmount }("");
			require(sellerPaid, "Seller payment failed");

			emit AuctionEnded(
				tokenId,
				auction.highestBidder,
				auction.currentBid
			);
		} else {
			// 没有有效的出价者，拍卖失败，卖家保留NFT
			emit AuctionEnded(tokenId, address(0), 0);
		}
	}

	// 获取所有正在进行的拍卖NFT
	function getOngoingAuctions() external view returns (Auction[] memory) {
		uint256 totalAuctions = 0;

		// 统计所有正在进行的拍卖
		for (uint256 i = 0; i < _auctionedTokenIds.length; i++) {
			uint256 tokenId = _auctionedTokenIds[i];
			Auction storage auction = _idToAuction[tokenId];
			if (auction.isActive && block.timestamp < auction.endTime) {
				totalAuctions++;
			}
		}

		// 创建一个数组来保存正在进行的拍卖NFT
		Auction[] memory ongoingAuctions = new Auction[](totalAuctions);
		uint256 index = 0;

		// 将符合条件的拍卖加入数组
		for (uint256 i = 0; i < _auctionedTokenIds.length; i++) {
			uint256 tokenId = _auctionedTokenIds[i];
			Auction storage auction = _idToAuction[tokenId];
			if (auction.isActive && block.timestamp < auction.endTime) {
				ongoingAuctions[index] = auction;
				index++;
			}
		}

		return ongoingAuctions;
	}

	/**
	 * @dev 获取NFT的当前出价
	 * @param tokenId NFT的Token ID
	 */
	function getCurrentBid(uint256 tokenId) public view returns (uint256) {
		return _idToAuction[tokenId].currentBid;
	}

	/**
	 * @dev 获取NFT的最高出价者
	 * @param tokenId NFT的Token ID
	 */
	function getHighestBidder(uint256 tokenId) public view returns (address) {
		return _idToAuction[tokenId].highestBidder;
	}

	/**
	 * @dev 从市场中撤下NFT
	 * @param tokenId NFT的Token ID
	 */
	function unlistNft(uint256 tokenId) public {
		require(
			ownerOf(tokenId) == msg.sender,
			"Only the owner can unlist the NFT"
		);
		require(_idToNftItem[tokenId].isListed, "NFT is not listed");

		_removeListedToken(tokenId);
		_idToNftItem[tokenId].isListed = false;

		emit NftUnlisted(tokenId, msg.sender);
	}

	/**
	 * @dev 购买NFT并支付版税
	 * @param tokenId NFT的Token ID
	 */
	function purchaseNft(uint256 tokenId) public payable nonReentrant {
		NftItem storage item = _idToNftItem[tokenId];
		require(item.isListed, "NFT is not listed for sale");
		require(msg.value >= item.price, "Insufficient payment");

		require(item.isListed, "NFT is not listed for sale");
		if (item.expirationTime != 0 && block.timestamp > item.expirationTime) {
			_removeListedToken(tokenId);
			item.isListed = false;
			revert("NFT listing has expired");
		}

		address seller = item.seller;
		_removeListedToken(tokenId);
		item.isListed = false;

		// 获取版税信息
		(address royaltyReceiver, uint256 royaltyAmount) = royaltyInfo(
			tokenId,
			msg.value
		);

		// 计算交易费用
		uint256 listingFee = (msg.value * listingFeePercentage) / 10000;
		totalFeesCollected += listingFee;

		// 向卖家和版税接收者支付
		payable(seller).transfer(msg.value - listingFee - royaltyAmount);
		payable(royaltyReceiver).transfer(royaltyAmount);

		_transfer(seller, msg.sender, tokenId);

		// 记录交易历史
		_tradeHistories[tokenId].push(
			TradeHistory({
				from: seller,
				to: msg.sender,
				price: msg.value,
				royalty: royaltyAmount,
				timestamp: block.timestamp
			})
		);

		emit NftPurchased(tokenId, msg.sender, msg.value);
	}

	/**
	 * @dev 查询指定 tokenId 的交易历史
	 * @param tokenId NFT的Token ID
	 * @return TradeHistory[] 交易历史的数组
	 */
	function getTradeHistory(
		uint256 tokenId
	) public view returns (TradeHistory[] memory) {
		return _tradeHistories[tokenId];
	}

	/**
	 * @dev 更新上架费比例
	 * @param newListingFeePercentage 新的上架费率（百分比的千分之一）
	 */
	function updateListingFeePercentage(
		uint256 newListingFeePercentage
	) public onlyOwner {
		require(
			newListingFeePercentage <= MAX_LISTING_FEE_PERCENTAGE,
			"Listing fee is too high"
		);
		listingFeePercentage = newListingFeePercentage;
		emit ListingFeePercentageUpdated(newListingFeePercentage);
	}

	/**
	 * @dev 提取收集的上架费用
	 */
	function withdrawFees() public onlyOwner {
		uint256 amount = totalFeesCollected;
		totalFeesCollected = 0;
		payable(owner()).transfer(amount);
		emit FeesWithdrawn(owner(), amount);
	}

	/**
	 * @dev 获取所有上架的NFT
	 * @return An array of NftItem structs
	 */
	function getAllListedNfts() external view returns (NftItem[] memory) {
		uint256 totalListed = _listedTokenIds.length;
		NftItem[] memory items = new NftItem[](totalListed);
		uint256 count = 0;

		for (uint256 i = 0; i < totalListed; i++) {
			uint256 tokenId = _listedTokenIds[i];
			NftItem storage item = _idToNftItem[tokenId];
			if (
				item.isListed &&
				(item.expirationTime == 0 ||
					block.timestamp <= item.expirationTime)
			) {
				items[count] = item;
				count++;
			}
		}

		// 缩减数组大小到有效数量
		assembly {
			mstore(items, count)
		}

		return items;
	}

	/**
	 * @dev 获取NftItem信息
	 * @param tokenId 要查询的NFT的Token ID
	 * @return NftItem结构体
	 */
	function getNftItem(uint256 tokenId) public view returns (NftItem memory) {
		return _idToNftItem[tokenId];
	}

	function _removeListedToken(uint256 tokenId) private {
		require(_listedTokenIds.length > 0, "No tokens listed");
		uint256 index = _tokenIdToListedIndex[tokenId];
		uint256 lastTokenId = _listedTokenIds[_listedTokenIds.length - 1];
		_listedTokenIds[index] = lastTokenId;
		_tokenIdToListedIndex[lastTokenId] = index;
		_listedTokenIds.pop();
	}

	// 重写OpenZeppelin的钩子函数
	function _beforeTokenTransfer(
		address from,
		address to,
		uint256 firstTokenId,
		uint256 batchSize
	) internal override(ERC721, ERC721Enumerable) {
		super._beforeTokenTransfer(from, to, firstTokenId, batchSize);
	}

	function supportsInterface(
		bytes4 interfaceId
	)
		public
		view
		override(ERC721, ERC721Enumerable, ERC721URIStorage, ERC721Royalty)
		returns (bool)
	{
		return super.supportsInterface(interfaceId);
	}

	function _burn(
		uint256 tokenId
	) internal override(ERC721, ERC721URIStorage, ERC721Royalty) {
		super._burn(tokenId);
	}

	function tokenURI(
		uint256 tokenId
	) public view override(ERC721, ERC721URIStorage) returns (string memory) {
		return super.tokenURI(tokenId);
	}

	// 支付 ETH 给合约
	function pay() public payable {
		// 触发事件
		emit PaymentReceived(msg.sender, msg.value);
	}
}
