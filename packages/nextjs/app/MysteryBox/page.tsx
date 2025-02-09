"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { RainbowKitCustomConnectButton } from "~~/components/scaffold-eth";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { notification } from "~~/utils/scaffold-eth";
import { addToIPFS } from "~~/utils/simpleNFT/ipfs-fetch";
import nftsMetadata from "~~/utils/simpleNFT/nftsMetadata";

const BlindBoxPage = () => {
  const { address: connectedAddress, isConnected, isConnecting } = useAccount();
  const { writeContractAsync } = useScaffoldWriteContract("YourCollectible");

  const [isModalOpen, setIsModalOpen] = useState(false); // 控制模态框显示
  const [isOpening, setIsOpening] = useState(false); // 控制盲盒动画
  const [mintedNFT, setMintedNFT] = useState<any>(null); // 存储铸造的 NFT

  // 打开模态框
  const openModal = () => {
    setIsModalOpen(true);
  };

  // 关闭模态框
  const closeModal = () => {
    setIsModalOpen(false);
  };

  // 支付和铸造
  const handlePayAndMint = async () => {
    if (!connectedAddress) return;

    closeModal(); // 关闭模态框
    setIsOpening(true); // 开启盲盒动画
    const randomIndex = Math.floor(Math.random() * nftsMetadata.length);
    const selectedNFT = nftsMetadata[randomIndex];

    const notificationId = notification.loading("正在抽取盲盒...");
    try {
      // 上传 NFT 元数据到 IPFS
      const uploadedItem = await addToIPFS(selectedNFT);
      notification.remove(notificationId);
      const weiValue = BigInt(3) * BigInt(10 ** 18); // 3 ETH 转为 Wei
      console.log("支付 3 ETH :", weiValue);
      // 支付 3 ETH
      await writeContractAsync({
        functionName: "pay",
        value: weiValue, // 转换为 Wei 单位
      });
      notification.success("支付成功！");

      // 铸造 NFT
      await writeContractAsync({
        functionName: "mintItem",
        args: [connectedAddress, uploadedItem.IpfsHash, 0],
      });

      notification.success("NFT 铸造成功！");
      setMintedNFT(selectedNFT); // 保存抽到的 NFT
    } catch (error) {
      notification.error("支付或铸造失败！");
      console.error(error);
    } finally {
      setIsOpening(false); // 关闭盲盒动画
    }
  };

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen bg-black text-white">
      <h1 className="text-5xl font-extrabold mb-6 text-yellow-400 animate-pulse">🎁 神秘盲盒 🎁</h1>

      {!isConnected || isConnecting ? (
        <RainbowKitCustomConnectButton />
      ) : (
        <>
          {/* 盲盒按钮 */}
          <div
            className={`relative gift-box cursor-pointer ${isOpening ? "animate-spin" : "hover:scale-110"}`}
            onClick={openModal} // 打开模态框
          >
            <div className="box"></div>
            <div className="lid"></div>
          </div>
          <p className="text-lg mt-4 text-gray-300">点击盲盒抽取你的 NFT！</p>

          {/* 显示铸造的 NFT */}
          {mintedNFT && (
            <div className="flex flex-col items-center mt-8">
              <h2 className="text-3xl font-bold mb-2 text-yellow-300">{mintedNFT.name}</h2>
              <img src={mintedNFT.image} alt={mintedNFT.name} className="w-64 h-64 rounded-lg shadow-2xl mb-4" />
              <p>{mintedNFT.description}</p>
            </div>
          )}
        </>
      )}

      {/* 模态框 */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-gray-800 text-white rounded-lg p-6 shadow-lg w-96">
            <h2 className="text-2xl font-bold mb-4">确认购买盲盒</h2>
            <p className="mb-6">
              您将支付 <strong>3 ETH</strong> 以购买一个神秘盲盒。
            </p>
            <div className="flex justify-end space-x-4">
              <button className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded" onClick={closeModal}>
                取消
              </button>
              <button
                className="bg-yellow-500 hover:bg-yellow-600 text-black px-4 py-2 rounded font-bold"
                onClick={handlePayAndMint}
              >
                确认支付
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .gift-box {
          width: 150px;
          height: 150px;
          background: linear-gradient(135deg, #f39c12, #e67e22);
          border-radius: 10px;
          box-shadow: 0 0 30px #ff5733, 0 0 60px #ff5733;
          position: relative;
          transition: transform 0.5s ease-in-out;
        }
        .gift-box .lid {
          width: 100%;
          height: 30px;
          background: #f1c40f;
          position: absolute;
          top: -30px;
          left: 0;
          border-radius: 10px 10px 0 0;
        }
      `}</style>
    </div>
  );
};

export default BlindBoxPage;
