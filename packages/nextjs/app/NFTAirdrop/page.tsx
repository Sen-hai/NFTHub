"use client";

import { useState } from "react";
import { MerkleTree } from "merkletreejs";
import { isAddress } from "viem"; // 使用 wagmi 的地址验证函数
import { useScaffoldContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { notification } from "~~/utils/scaffold-eth";
import { addToIPFS } from "~~/utils/simpleNFT/ipfs-fetch";
import nftsMetadata from "~~/utils/simpleNFT/nftsMetadata";
import { soliditySha3 } from "web3-utils";

const MerkleTreePage = () => {
  const [addresses, setAddresses] = useState<string[]>([]);
  const [newAddress, setNewAddress] = useState<string>("");
  const [startTokenId, setStartTokenId] = useState<number | null>(null);
  const [merkleRoot, setMerkleRoot] = useState<string | null>(null);
  const [proofs, setProofs] = useState<Record<string, string[]> | null>(null);
  const [leaves, setLeaves] = useState<string[]>([]);
  const [step, setStep] = useState<number>(1);

  const { data: contractData } = useScaffoldContract({
    contractName: "YourCollectible",
  });
  const { writeContractAsync } = useScaffoldWriteContract("YourCollectible");

  const addAddress = () => {
    if (isAddress(newAddress)) {
      setAddresses([...addresses, newAddress]);
      setNewAddress("");
    } else {
      alert("请输入有效的以太坊地址");
    }
  };

  const mintBatchNFTs = async () => {
    if (!contractData?.address) {
      notification.error("合约地址未找到！");
      return;
    }

    if (addresses.length === 0) {
      notification.error("地址列表为空，无法铸造 NFT");
      return;
    }

    const notificationId = notification.loading("正在上传 NFT 元数据...");

    try {
      const selectedMetadata = nftsMetadata.slice(0, addresses.length);

      const uploadedUris = await Promise.all(
        selectedMetadata.map(async (meta) => {
          const uploadedItem = await addToIPFS(meta);
          return uploadedItem.IpfsHash;
        })
      );

      notification.remove(notificationId);
      notification.success("元数据上传成功！");

      await writeContractAsync({
        functionName: "mintBatchForAirdrop",
        args: [uploadedUris, uploadedUris.length],
      });

      notification.success("批量铸造成功！");
      setStep(4); // 跳到下一步
    } catch (error) {
      notification.remove(notificationId);
      console.error("批量铸造失败:", error);
      notification.error("批量铸造失败，请检查控制台获取详情。");
    }
  };

  const generateMerkleTree = async () => {
    if (addresses.length === 0) {
      alert("地址列表为空，无法生成 Merkle Tree");
      return;
    }
    if (startTokenId === null) {
      alert("请指定开始的 Token ID");
      return;
    }

    const generatedLeaves = addresses.map((addr, index) => {
      const tokenId = startTokenId + index;
      const leaf = soliditySha3(
        { type: "address", value: addr },
        { type: "uint256", value: tokenId }
      );
      return leaf;
    });
    setLeaves(generatedLeaves.filter((leaf): leaf is string => leaf !== null));

    const tree = new MerkleTree(generatedLeaves, soliditySha3, { sortPairs: true });
    const root = tree.getHexRoot();
    setMerkleRoot(root);

    await writeContractAsync({
      functionName: "setMerkleRoot",
      args: [root as `0x${string}`],
    });

    const generatedProofs: Record<string, string[]> = {};
    addresses.forEach((addr, index) => {
      const tokenId = startTokenId + index;
      const leaf = soliditySha3(
        { type: "address", value: addr },
        { type: "uint256", value: tokenId }
      ) as string;
      const proof = tree.getHexProof(leaf);
      generatedProofs[`${addr}-${tokenId}`] = proof;
    });
    setProofs(generatedProofs);
    setStep(5);
  };

  const reset = () => {
    setAddresses([]);
    setNewAddress("");
    setStartTokenId(null);
    setMerkleRoot(null);
    setProofs(null);
    setLeaves([]);
    setStep(1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-purple-900 p-8">
      <div className="max-w-4xl mx-auto bg-gray-800 rounded-lg shadow-lg p-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-purple-600 via-transparent to-blue-600 opacity-30 blur-3xl pointer-events-none"></div>

        <h1 className="text-4xl font-bold text-center mb-6 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
          空投管理与 Merkle Tree 生成
        </h1>
        <p className="text-center text-gray-400 mb-8">步骤 {step}/5</p>

        {step === 1 && (
          <div>
            <h3 className="text-2xl font-semibold text-white mb-4">1. 输入地址列表</h3>
            <div className="flex items-center space-x-4">
              <input
                type="text"
                value={newAddress}
                placeholder="输入以太坊地址"
                onChange={(e) => setNewAddress(e.target.value)}
                className="flex-1 bg-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <button
                onClick={addAddress}
                className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg shadow-md transform transition-transform hover:scale-105"
              >
                添加地址
              </button>
            </div>

            <ul className="mt-6 space-y-2">
              {addresses.map((addr, index) => (
                <li key={index} className="bg-gray-900 text-gray-300 p-3 rounded-md">
                  {addr}
                </li>
              ))}
            </ul>

            {addresses.length > 0 && (
              <div className="text-center mt-6">
                <button
                  onClick={() => setStep(2)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg shadow-md transition-transform transform hover:scale-110"
                >
                  下一步
                </button>
              </div>
            )}
          </div>
        )}

        {step === 2 && (
          <div>
            <h3 className="text-2xl font-semibold text-white mb-4">2. 输入起始 Token ID</h3>
            <input
              type="number"
              value={startTokenId ?? ""}
              placeholder="请输入开始的 Token ID"
              onChange={(e) => setStartTokenId(Number(e.target.value))}
              className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex justify-between mt-6">
              <button
                onClick={() => setStep(1)}
                className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg shadow-md transition-transform transform hover:scale-105"
              >
                上一步
              </button>
              <button
                onClick={() => setStep(3)}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg shadow-md transition-transform transform hover:scale-110"
              >
                下一步
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <h3 className="text-2xl font-semibold text-white mb-4">3. 批量铸造 NFT</h3>
            <button
              onClick={mintBatchNFTs}
              className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-blue-500 hover:to-purple-500 text-white px-6 py-2 rounded-lg shadow-md transition-transform transform hover:scale-110 w-full"
            >
              批量铸造 NFT
            </button>
          </div>
        )}

        {step === 4 && (
          <div>
            <h3 className="text-2xl font-semibold text-white mb-4">4. 生成 Merkle Tree</h3>
            <button
              onClick={generateMerkleTree}
              className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-blue-500 hover:to-purple-500 text-white px-6 py-2 rounded-lg shadow-md transition-transform transform hover:scale-110 w-full"
            >
              生成 Merkle Tree
            </button>
          </div>
        )}

        {step === 5 && (
          <div>
            {merkleRoot && (
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-white">Merkle Root</h3>
                <p className="bg-gray-900 text-green-400 rounded-lg p-4">{merkleRoot}</p>
              </div>
            )}

            {leaves && proofs && (
              <div>
                <h3 className="text-xl font-semibold text-white mb-4">叶子节点与 Merkle Proofs</h3>
                <div className="overflow-x-auto bg-gray-900 rounded-lg shadow-md p-4">
                  <table className="w-full text-gray-300">
                    <thead className="bg-gray-800 text-purple-400">
                      <tr>
                        <th className="px-4 py-2">地址和 Token ID</th>
                        <th className="px-4 py-2">哈希值</th>
                        <th className="px-4 py-2">Merkle Proof</th>
                      </tr>
                    </thead>
                    <tbody>
                      {addresses.map((addr, index) => {
                        const tokenId = startTokenId! + index;
                        const key = `${addr}-${tokenId}`;
                        return (
                          <tr key={index} className="hover:bg-gray-700">
                            <td className="px-4 py-2 whitespace-nowrap">{key}</td>
                            <td className="px-4 py-2 whitespace-nowrap">{leaves[index]}</td>
                            <td className="px-4 py-2 whitespace-nowrap">
                              <ul className="space-y-1">
                                {proofs[key].map((p, i) => (
                                  <li key={i} className="text-gray-400 truncate">
                                    {p}
                                  </li>
                                ))}
                              </ul>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MerkleTreePage;
