"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth";

const AirdropPage = () => {
  const { address: userAddress, isConnected } = useAccount();
  const { writeContractAsync } = useScaffoldWriteContract("YourCollectible");

  const [tokenId, setTokenId] = useState<string>(""); // 用户输入的 tokenId
  const [merkleProof, setMerkleProof] = useState<string>(""); // 用户输入的 Merkle Proof 数组
  const [status, setStatus] = useState<string>(""); // 显示空投状态

  const claimNFT = async () => {
    if (!isConnected) {
      setStatus("请连接您的钱包以领取空投！");
      return;
    }

    if (!merkleProof || merkleProof.trim() === "") {
      setStatus("请输入有效的 Merkle Proof 数组！");
      return;
    }

    if (!tokenId || isNaN(Number(tokenId))) {
      setStatus("请输入有效的 Token ID！");
      return;
    }

    try {
      setStatus("正在请求合约进行空投领取...");

      // 将用户输入的 Merkle Proof 字符串转换为数组，处理样式为 ["0x...","0x..."] 的输入
      const proofArray = JSON.parse(
        merkleProof
          .replace(/“/g, '"') // 替换中文双引号为英文双引号
          .replace(/”/g, '"') // 替换中文双引号为英文双引号
          .trim()
      );

      // 验证解析后的数据是否为有效数组
      if (!Array.isArray(proofArray) || proofArray.some((proof) => typeof proof !== "string" || proof.length !== 66 || !proof.startsWith("0x"))) {
        setStatus("无效的 Merkle Proof 数组，请检查格式！");
        return;
      }

      await writeContractAsync({
        functionName: "claimNFT",
        args: [proofArray, Number(tokenId)],
      });

      setStatus("空投领取成功！");
    } catch (error: any) {
      console.error("领取空投失败:", error);
      setStatus(
        `空投领取失败，请检查输入或稍后重试。${error.message || error}`
      );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-purple-900 p-8">
      <div className="max-w-3xl mx-auto bg-gray-800 rounded-lg shadow-lg p-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-purple-600 via-transparent to-blue-600 opacity-30 blur-3xl pointer-events-none"></div>

        <h1 className="text-4xl font-bold text-center mb-6 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
          NFT 空投领取
        </h1>
        <p className="text-center text-gray-400 mb-8">
          输入您的 Token ID 和 Merkle Proof 数组领取 NFT
        </p>

        <div className="mb-6">
          <h3 className="text-xl text-white mb-4">Token ID</h3>
          <input
            type="text"
            value={tokenId}
            onChange={(e) => setTokenId(e.target.value)}
            placeholder="输入您的 Token ID"
            className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="mb-6">
          <h3 className="text-xl text-white mb-4">Merkle Proof 数组</h3>
          <textarea
            value={merkleProof}
            onChange={(e) => setMerkleProof(e.target.value)}
            placeholder='输入 Merkle Proof 数组，例如：["0xabe8...", "0x1a2a..."]'
            className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 h-24 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex justify-between items-center mb-6">
          <button
            onClick={claimNFT}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg shadow-md transition-transform transform hover:scale-105"
          >
            领取空投
          </button>
        </div>

        {status && (
          <div className="bg-gray-900 text-gray-300 rounded-lg p-4 shadow-md mt-6">
            <p>{status}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AirdropPage;
