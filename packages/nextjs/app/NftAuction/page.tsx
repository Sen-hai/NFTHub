"use client";

import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { Address } from "~~/components/scaffold-eth";
import { useScaffoldReadContract, useScaffoldWriteContract, useScaffoldContract } from "~~/hooks/scaffold-eth";

export interface AuctionNFT {
  tokenId: number;
  uri: string;
  owner: string;
  currentBid: string;
  highestBidder: string;
  startingBid: string;
  name?: string;
  description?: string;
  image?: string;
  countdown?: string;  // 添加倒计时字段
}

const NftAuction = () => {
  const { address: connectedAddress } = useAccount();
  const [auctionNfts, setAuctionNfts] = useState<AuctionNFT[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [bidAmount, setBidAmount] = useState("");

  const { data: ongoingAuctions } = useScaffoldReadContract({
    contractName: "YourCollectible",
    functionName: "getOngoingAuctions",
    watch: true,
  });

  const { data: yourCollectibleContract } = useScaffoldContract({
    contractName: "YourCollectible",
  });

  const { writeContractAsync } = useScaffoldWriteContract("YourCollectible");

  // 获取 NFT 详情
  const fetchNftDetails = async (tokenId: number): Promise<AuctionNFT> => {
    try {
      const nftItem = await yourCollectibleContract.read.getNftItem([tokenId]);
      const ongoingAuctions = await yourCollectibleContract.read.getOngoingAuctions();
      console.log(ongoingAuctions);
      const auction = ongoingAuctions.find((auction) => auction.tokenId === BigInt(tokenId));

      if (!auction) throw new Error("拍卖信息未找到");

      const currentBid = auction.currentBid.toString();
      const highestBidder = auction.highestBidder;
      const startingBid = auction.startingBid.toString();

      const metadata = await getMetadataFromIPFS(nftItem.tokenUri);

      return {
        tokenId: Number(nftItem.tokenId),
        uri: nftItem.tokenUri,
        owner: auction.seller,
        currentBid,
        highestBidder,
        startingBid,
        name: metadata.name || "未命名",
        description: metadata.description || "无描述",
        image: metadata.image || "",
        countdown: calculateCountdown(Number(auction.endTime.toString())),  // 初始化倒计时
      };
    } catch (error) {
      console.error("获取 NFT 详情时出错:", error);
      return {} as AuctionNFT;
    }
  };

  // 从 IPFS 获取元数据
  const getMetadataFromIPFS = async (tokenUri: string) => {
    try {
      const response = await fetch(tokenUri);
      const metadata = await response.json();
      return metadata;
    } catch (error) {
      console.error("从 IPFS 获取元数据时出错:", error);
      return {};
    }
  };

  // 计算剩余时间的函数
  const calculateCountdown = (endTime: number): string => {
    const currentTime = Math.floor(Date.now() / 1000);
    const remainingTime = endTime - currentTime;

    if (remainingTime <= 0) {
      return "已结束";
    }

    const hours = Math.floor(remainingTime / 3600);
    const minutes = Math.floor((remainingTime % 3600) / 60);
    const seconds = remainingTime % 60;

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // 每秒更新倒计时
  const updateCountdown = (endTime: number, tokenId: number) => {
    return setInterval(() => {
      setAuctionNfts((prevState) =>
        prevState.map((nft) => {
          if (nft.tokenId === tokenId) {
            const updatedCountdown = calculateCountdown(endTime);
            return { ...nft, countdown: updatedCountdown };
          }
          return nft;
        })
      );
    }, 1000); // 每秒更新一次
  };

  useEffect(() => {
    // 在 fetchAuctionNfts 中插入数据时，检查是否已存在
    const fetchAuctionNfts = async () => {
      if (!ongoingAuctions) return;

      setIsLoading(true);
      const nftData: AuctionNFT[] = [];

      // 获取 NFT 数据并去重
      for (const nft of ongoingAuctions) {
        try {
          const currentTime = Math.floor(Date.now() / 1000);
          if (nft.endTime <= BigInt(currentTime)) continue;

          // 检查 NFT 是否已经存在
          const nftDetails = await fetchNftDetails(BigInt(nft.tokenId));

          if (!nftData.some((item) => item.tokenId === nftDetails.tokenId)) {
            nftData.push(nftDetails);
          }

          // 启动倒计时
          updateCountdown(Number(nft.endTime.toString()), Number(nft.tokenId));
        } catch (error) {
          console.error(error);
        }
      }

      setAuctionNfts(nftData.sort((a, b) => a.tokenId - b.tokenId));
      setIsLoading(false);
    };


    fetchAuctionNfts();
  }, [ongoingAuctions]);

  const handleBid = async (tokenId: number, price: string) => {
    try {
      const inputBid = Number(bidAmount * 10 ** 18);
      const transaction = await writeContractAsync({
        functionName: "placeBid",
        args: [BigInt(tokenId)],
        value: BigInt(inputBid),
      });
      alert("出价成功！");
      setBidAmount("");
    } catch (error: any) {
      console.error("出价失败:", error);
      alert("出价失败: " + error.message);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center mt-10">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  return (
    <div className="container mx-auto">
      <header className="my-4">
        <h1 className="text-3xl font-bold text-center"></h1>
      </header>
      {auctionNfts.length === 0 ? (
        <div className="flex justify-center items-center mt-10">
          <div className="text-2xl text-primary-content">暂无正在进行的拍卖</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {auctionNfts.map((nft, index) => (
            <div
              key={nft.tokenId || nft.uri || index}
              className="card card-compact bg-base-100 shadow-lg w-[300px] shadow-secondary rounded-xl overflow-hidden"
            >
              <figure className="relative">
                <img
                  src={nft.image}
                  alt="NFT Image"
                  className="w-full h-64 object-cover cursor-pointer"
                />
                <figcaption className="glass absolute bottom-4 left-4 p-3 rounded-xl bg-opacity-70">
                  <span className="text-white font-semibold text-lg">#{nft.tokenId}</span>
                </figcaption>
              </figure>
              <div className="card-body space-y-4 p-4">
                <div className="flex items-center justify-between">
                  <h2 className="card-title text-xl font-semibold text-gray-800 truncate">{nft.name}</h2>
                </div>
                <p className="text-gray-600 text-sm truncate">{nft.description}</p>
                <div className="flex flex-col space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-semibold">当前出价:</span>
                    <span>{nft.currentBid / 1e18} ETH</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-semibold">最高出价者:</span>
                    <Address address={nft.highestBidder} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-semibold">起拍价:</span>
                    <span>{nft.startingBid / 1e18} ETH</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-semibold">剩余时间:</span>
                    <span className="text-yellow-500">{nft.countdown}</span>
                  </div>
                </div>

                <div className="flex justify-between items-center mt-4">
                  <input
                    type="number"
                    className="input input-bordered w-full mt-4"
                    value={bidAmount}
                    onChange={(e) => setBidAmount(e.target.value)}
                    placeholder="输入您的出价"
                  />
                  <button
                    className="btn btn-primary mt-4"
                    onClick={() => handleBid(nft.tokenId, nft.currentBid)}
                    disabled={nft.owner === connectedAddress}
                  >
                    竞拍
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NftAuction;
