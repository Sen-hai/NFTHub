"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { ethers } from "ethers";
import { useAccount, usePublicClient } from "wagmi";
import Web3Modal from "web3modal";
import { useScaffoldContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";

const pinataApiKey = "";
const pinataSecretApiKey = "";

const CreateNft = () => {
  const publicClient = usePublicClient(); // Hook 必须在函数组件顶部定义
  const { address } = useAccount();
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [royalty, setRoyalty] = useState<number>();
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [category, setCategory] = useState<string>("art"); // 新增：NFT 分类

  useEffect(() => {
    const loadSigner = async () => {
      const web3Modal = new Web3Modal({
        network: "mainnet",
        cacheProvider: true,
      });
      const connection = await web3Modal.connect();
      const provider = new ethers.BrowserProvider(connection);
      const signer = await provider.getSigner();
      setSigner(signer);
    };
    loadSigner();
  }, []);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) setFile(file);
  };
  const { data: yourCollectibleContract } = useScaffoldContract({
    contractName: "YourCollectible",
  });

  const { writeContractAsync } = useScaffoldWriteContract("YourCollectible");

  const handleMintNft = async () => {
   
    if (!file || !signer) {
      alert("Please upload an image file and ensure your wallet is connected.");
      return;
    }

    // Step 1: 上传图片到 IPFS
    const formData = new FormData();
    formData.append("file", file);

    const response = await axios.post("https://api.pinata.cloud/pinning/pinFileToIPFS", formData, {
      headers: {
        pinata_api_key: pinataApiKey,
        pinata_secret_api_key: pinataSecretApiKey,
        "Content-Type": "multipart/form-data",
      },
    });

    const imageURI = `https://gateway.pinata.cloud/ipfs/${response.data.IpfsHash}`;

    // Step 2: 上传 NFT 元数据
    const metadata = { name, description, image: imageURI };
    const metadataResponse = await axios.post("https://api.pinata.cloud/pinning/pinJSONToIPFS", metadata, {
      headers: {
        pinata_api_key: pinataApiKey,
        pinata_secret_api_key: pinataSecretApiKey,
      },
    });

    const metadataURI = `${metadataResponse.data.IpfsHash}`;

    // Step 3: 铸造 NFT
    if (signer) {
      const mintTx = await writeContractAsync({
        functionName: "mintItem",
        args: [address, metadataURI, royalty],
      });

      console.log("-----mintx---", mintTx);
      // Step 2: 获取交易收据
      const receipt = await publicClient.getTransactionReceipt({
        hash: mintTx, // 使用交易哈希获取交易收据
      });

      console.log("Transaction receipt:", receipt); // 打印收据

      // Step 3: 从收据中获取 gasUsed
      const gasUsed = receipt.gasUsed.toString();
      console.log("Gas Used:", gasUsed);

      // 解析 NFT ID（假设从日志中提取）
      const nft_id = receipt.logs[0].topics[3]; // 示例：从事件日志中提取 NFT ID
      const numericId = parseInt(nft_id, 16);
      console.log("NFT ID:", numericId);

      // const newTokenId = await yourCollectibleContract.read.tokenIdCounter();
      // const tokenId = Number(newTokenId);
      console.log("铸造成功, Token ID:", numericId);

      console.log("category:", category);
      console.log("address:", address);
      console.log("cid:", metadataURI);
      console.log("royalty:", royalty);

      // Step 4: 创建 NFT 记录
      await axios
        .post("http://localhost:5000/create-nft", {
          tokenId: numericId, // 从合约中返回的 tokenId
          category, // 用户选择的 NFT 分类
          address,
          cid: metadataURI,
          royalty,
          gasused: gasUsed, // 传递实际的 gas 费用到后端
        })
        .then(response => {
          console.log("NFT creation response:", response.data);
          alert("NFT 创建成功!");
        })
        .catch(error => {
          console.error("Error creating NFT:", error);
          alert("NFT 创建失败");
        });
    } else {
      alert("Signer is not available.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br bg-base-300 border-gray-400 to-blue-500 p-6">
      <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full p-8">
        <h1 className="text-4xl font-extrabold text-center text-purple-600 mb-8">创造你的独一无二的 NFT</h1>
        <div className="space-y-6">
          <div className="flex flex-col items-center">
            <label
              htmlFor="file"
              className="cursor-pointer flex items-center justify-center w-full h-40 bg-base-300 rounded-lg border-2 border-dashed border-gray-400 hover:border-primary transition duration-300"
            >
              {file ? (
                <span className="text-gray-700 text-center">{file.name}</span>
              ) : (
                <span className="text-purple-600">点击上传图片</span>
              )}
            </label>
            <input id="file" type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
          </div>
          <input
            type="text"
            placeholder="NFT 名称"
            value={name}
            onChange={e => setName(e.target.value)}
            className="input input-bordered w-full focus:ring focus:ring-purple-400"
          />
          <textarea
            placeholder="NFT 描述"
            value={description}
            onChange={e => setDescription(e.target.value)}
            className="textarea textarea-bordered w-full focus:ring focus:ring-purple-400"
          />
          <input
            type="number"
            placeholder="版税比例 (例如: 500 表示 5%)"
            value={royalty}
            onChange={e => setRoyalty(parseInt(e.target.value))}
            className="input input-bordered w-full focus:ring focus:ring-purple-400"
          />
          <div>
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="select select-bordered w-full focus:ring focus:ring-purple-400"
            >
              <option value="art">艺术</option>
              <option value="music">音乐</option>
              <option value="game">游戏</option>
              <option value="collectible">收藏品</option>
              <option value="domain">域名</option>
              <option value="other">其他</option>
            </select>
          </div>
          <button
            onClick={handleMintNft}
            className="btn btn-gradient bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold w-full py-3 rounded-md hover:opacity-90 shadow-lg transform hover:scale-105 transition-transform"
          >
            创建 NFT
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateNft;
