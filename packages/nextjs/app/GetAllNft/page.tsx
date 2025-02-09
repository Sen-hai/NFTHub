"use client";

import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { useRouter } from "next/navigation";
import { Address } from "~~/components/scaffold-eth";
import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";

// 定义 NFT 类型接口
export interface ListedNFT {
  id: number;
  uri: string;
  owner: string;
  price: string;
  isListed: boolean;
  expirationTime: BigInt; // 新增 expirationTime 字段
  category: string; // 新增类别字段
  name?: string;
  description?: string;
  image?: string;
  countdown?: { hours: number; minutes: number; seconds: number }; // 用于倒计时显示
}

// 获取 NFT 类别的函数
const fetchCategory = async (tokenId: string): Promise<string> => {
  try {
    const response = await fetch(`http://localhost:5000/get-nft/category/${tokenId}`);
    const data = await response.json();
    return data.category;
  } catch (error) {
    console.error("获取类别失败:", error);
    return "";
  }
};

const ListedNFTs = () => {
  const { address: connectedAddress } = useAccount();
  const router = useRouter();
  const [allListedNFTs, setAllListedNFTs] = useState<ListedNFT[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>(""); // 新增类别筛选状态
  const [priceFilter, setPriceFilter] = useState<number | "">(""); // 新增价格筛选状态
  const [priceInputError, setPriceInputError] = useState<string>(""); // 价格输入错误提示

  // 从合约中获取已上架的 NFT 数据
  const { data: listedNFTs } = useScaffoldReadContract({
    contractName: "YourCollectible",
    functionName: "getAllListedNfts",
    watch: true,
  });

  const { writeContractAsync } = useScaffoldWriteContract("YourCollectible");

  const handlePurchase = async (tokenId: number, price: string) => {
    try {
      const inputPrice = Number(Number(price) * 1e18);
      const transaction = await writeContractAsync({
        functionName: "purchaseNft",
        args: [BigInt(tokenId)],
        value: BigInt(inputPrice),
      });
      console.log("交易详情：", transaction);
    } catch (error: any) {
      console.error("购买失败:", error);
      alert("购买失败: " + error.message);
    }
  };

  const handleUnlist = async (tokenId: number) => {
    try {
      const transaction = await writeContractAsync({
        functionName: "unlistNft",
        args: [BigInt(tokenId)],
      });
      console.log("交易详情：", transaction);
    } catch (error: any) {
      console.error("撤回失败:", error);
    }
  };

  const fetchNftMetadata = async (tokenUri: string): Promise<any> => {
    try {
      const response = await fetch(tokenUri);
      return await response.json();
    } catch (error) {
      console.error("解析 tokenUri 时出错:", error);
      return null;
    }
  };

  const calculateTimeLeft = (expirationTime: BigInt) => {
    const currentTime = BigInt(Math.floor(Date.now() / 1000));
    const timeLeft = expirationTime > currentTime ? expirationTime - currentTime : BigInt(0);
    const hours = Number(timeLeft / BigInt(3600));
    const minutes = Number((timeLeft % BigInt(3600)) / BigInt(60));
    const seconds = Number(timeLeft % BigInt(60));
    return { hours, minutes, seconds };
  };

  const updateCountdowns = () => {
    setAllListedNFTs((prevNfts) =>
      prevNfts.map((nft) => {
        const timeLeft = calculateTimeLeft(nft.expirationTime);
        return { ...nft, countdown: timeLeft };
      })
    );
  };

  useEffect(() => {
    const fetchListedNFTs = async (): Promise<void> => {
      if (!listedNFTs) return;

      setIsLoading(true);
      const nftData: ListedNFT[] = [];

      for (const nft of listedNFTs) {
        try {
          const metadata = await fetchNftMetadata(nft.tokenUri);
          const category = await fetchCategory(nft.tokenId.toString()); // 获取类别

          nftData.push({
            id: parseInt(nft.tokenId.toString()),
            uri: nft.tokenUri,
            owner: nft.seller,
            price: nft.price.toString(),
            isListed: nft.isListed,
            expirationTime: nft.expirationTime,
            category, // 保存类别
            name: metadata?.name || "未命名",
            description: metadata?.description || "无描述",
            image: metadata?.image || "",
          });
        } catch (e) {
          console.error(e);
        }
      }

      setAllListedNFTs(nftData.sort((a, b) => a.id - b.id));
      updateCountdowns();
      setIsLoading(false);
    };

    fetchListedNFTs();
  }, [listedNFTs]);

  useEffect(() => {
    const interval = setInterval(() => {
      updateCountdowns();
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCategoryFilter(e.target.value);
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value);
    if (isNaN(value) || value < 0) {
      setPriceInputError("请输入有效的价格！");
    } else {
      setPriceInputError("");
      setPriceFilter(value);
    }
  };

  const filterNFTs = (nfts: ListedNFT[]) => {
    return nfts.filter((nft) => {
      const matchesCategory = categoryFilter ? nft.category === categoryFilter : true;
      const matchesPrice = priceFilter !== "" ? Number(nft.price) <= priceFilter : true;
      return matchesCategory && matchesPrice;
    });
  };

  const filteredNFTs = filterNFTs(allListedNFTs);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center mt-10">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  const handleImageClick = (id: number) => {
    router.push(`/GetAllNft/NftDetails/${id}`);
  };

  return (
    <div className="container mx-auto">
      <header className="my-4">
        <h1 className="text-3xl font-bold text-center"></h1>
      </header>

      {/* 筛选栏 */}
      <div className="flex justify-between items-center mb-4">
        <select
          value={categoryFilter}
          onChange={handleCategoryChange}
          className="select select-bordered w-40"
        >
          <option value="">选择类别</option>
          <option value="art">艺术</option>
          <option value="music">音乐</option>
          <option value="game">游戏</option>
          <option value="collectible">收藏品</option>
        </select>

        <div>
          <input
            type="number"
            placeholder="最高价格"
            value={priceFilter}
            onChange={handlePriceChange}
            className="input input-bordered w-40"
          />
          {priceInputError && <p className="text-red-500 text-sm mt-1">{priceInputError}</p>}
        </div>
      </div>

      {filteredNFTs.length === 0 ? (
        <div className="flex justify-center items-center mt-10">
          <div className="text-2xl text-primary-content">没有符合条件的 NFT</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredNFTs.map((nft) => (
            <div
              key={nft.id}
              className="card card-compact bg-base-100 shadow-lg w-[300px] shadow-secondary"
            >
              <figure className="relative">
                <img
                  src={nft.image}
                  alt="NFT Image"
                  className="h-60 min-w-full cursor-pointer"
                  onClick={() => handleImageClick(nft.id)}
                />
                <figcaption className="glass absolute bottom-4 left-4 p-4 w-25 rounded-xl">
                  <span className="text-white"># {nft.id}</span>
                </figcaption>
              </figure>
              <div className="card-body space-y-3">
                <div className="text-xl font-semibold">{nft.name}</div>
                <p className="text-xl font-semibold">{nft.description}</p>
                <div className="flex space-x-3 items-center mt-1">
                  <span className="text-lg font-semibold">下架时间 :</span>
                  {nft.expirationTime === BigInt(0) ? (
                    <span>无截止时间</span>
                  ) : (
                    <span>
                      {nft.countdown?.hours}小时 {nft.countdown?.minutes}分钟{" "}
                      {nft.countdown?.seconds}秒
                    </span>
                  )}
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xl font-semibold"> {nft.category}</span>
                  <span className="text-xl font-semibold">{nft.price} ETH</span>
                </div>
                <div className="flex space-x-2 mt-2">
                  {nft.owner === connectedAddress ? (
                    <button
                      className="btn btn-secondary flex-1"
                      onClick={() => handleUnlist(nft.id)}
                    >
                      下架
                    </button>
                  ) : (
                    <button
                      className="btn btn-primary flex-1"
                      onClick={() => handlePurchase(nft.id, nft.price)}
                    >
                      购买
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ListedNFTs;
