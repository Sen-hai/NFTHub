"use client";

import { useEffect, useState } from "react";
import { Address } from "~~/components/scaffold-eth";
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth";

// 处理 tokenUri 获取元数据
const fetchNftMetadata = async (tokenUri: string): Promise<any> => {
  try {
    const response = await fetch(tokenUri);
  return await response.json();
  } catch (error) {
    console.error("解析 tokenUri 时出错:", error);
    return null;
  }
};

const NftDetail = ({ params }: { params: { id: string } }) => {
  const { id } = params;

  // NFT 数据状态
  const [nftData, setNftData] = useState<any | null>(null);

  // 交易历史状态
  const [tradeHistory, setTradeHistory] = useState<any[]>([]);

  // 从智能合约读取数据
  const { data: tradeHistoryData } = useScaffoldReadContract({
    contractName: "YourCollectible",
    functionName: "getTradeHistory",
    args: [BigInt(id)],
  });

  const { data: nftDataFromContract } = useScaffoldReadContract({
    contractName: "YourCollectible",
    functionName: "getNftItem",
    args: [BigInt(id)],
  });

  // 获取 NFT 数据并处理元数据
  useEffect(() => {
    const fetchNftDetails = async () => {
      if (!nftDataFromContract) return;

      const metadata = await fetchNftMetadata(nftDataFromContract.tokenUri);
      
      setNftData({
        id: nftDataFromContract.tokenId,
        owner: nftDataFromContract.seller,
        price: nftDataFromContract.price,
        isListed: nftDataFromContract.isListed,
        expirationTime: nftDataFromContract.expirationTime,
        name: metadata?.name || "未命名",
        description: metadata?.description || "无描述",
        image: metadata?.image || "",
      });
    };

    fetchNftDetails();
  }, [nftDataFromContract]);

  // 处理交易历史数据
  useEffect(() => {
    if (tradeHistoryData) {
      setTradeHistory(tradeHistoryData);
    }
  }, [tradeHistoryData]);

  // 交易记录为空时显示
  if (!nftData) {
    return (
      <div className="text-center">
        <p>加载NFT数据失败</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row items-start justify-between flex-wrap pt-10 min-h-screen">
      {/* 左侧：NFT 详细信息 */}
      <div className="w-full md:w-1/3 px-4 mb-8">
        <img
          src={nftData.image}
          alt={nftData.name}
          className="w-full h-auto rounded-lg mb-4"
        />
        <h2 className="text-2xl font-semibold">名称：{nftData.name}</h2>
        <h3 className="mt-2 font-semibold">描述：{nftData.description}</h3>
        <div className="mt-2 flex items-center ">
          <span className="font-bold mr-2">卖家:</span> <Address address={nftData.owner} />
        </div>
      </div>

      {/* 右侧：交易历史记录 */}
      <div className="w-full md:w-2/3 px-4 mb-8">
        <h3 className="text-center text-2xl font-semibold mb-4">交易历史</h3>
        <div className="space-y-6">
          {!tradeHistory || tradeHistory.length === 0 ? (
            <div className="text-center text-gray-500 py-10">
              无交易记录
            </div>
          ) : (
            tradeHistory.map((event, index) => (
              <div
                key={index}
                className="p-4 border-2 border-gray-200 rounded-lg hover:border-indigo-600 transition-all duration-200"
              >
                <div className="font-bold text-gray-800">交易 #{index + 1}</div>
                <div className="mt-2 flex items-center">
                  <span className="font-semibold mr-2">卖家:</span> <Address address={event.from} />
                </div>
                <div className="mt-2 flex items-center">
                  <span className="font-semibold mr-2">买家:</span> <Address address={event.to} />
                </div>
                <div className="mt-2">
                  <span className="font-semibold">价格:</span> {(Number(event.price) / 10 ** 18).toFixed(2)} ETH
                </div>
                <div className="mt-2">
                  <span className="font-semibold">版税:</span> {(Number(event.royalty) / 10 ** 18).toFixed(2)} ETH
                </div>
                <div className="mt-2">
                  <span className="font-semibold">交易时间:</span>{" "}
                  {new Date(Number(event.timestamp) * 1000).toLocaleString()}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default NftDetail;
