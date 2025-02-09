"use client";

import { useState } from "react";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { notification } from "~~/utils/scaffold-eth";
import axios from "axios";

const pinataApiKey = "695a571181bfcd8467a0";
const pinataSecretApiKey = "931b3f0c15ab01177928b66451bd46bed162486c10382d63b9ff45cdaaef75f5";

const NFTFragmentationPage = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fragments, setFragments] = useState<string[]>([]);
  const [fragmentNames, setFragmentNames] = useState<string[]>([]);
  const [fragmentDescriptions, setFragmentDescriptions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { writeContractAsync } = useScaffoldWriteContract("YourCollectible");

  /**
   * 上传图片到 IPFS
   * @param {Blob} blob 图片的 Blob 数据
   * @returns {string} 返回图片的 IPFS URL
   */
  const uploadImageToIPFS = async (blob: Blob) => {
    const formData = new FormData();
    formData.append("file", blob);

    const response = await axios.post("https://api.pinata.cloud/pinning/pinFileToIPFS", formData, {
      headers: {
        pinata_api_key: pinataApiKey,
        pinata_secret_api_key: pinataSecretApiKey,
        "Content-Type": "multipart/form-data",
      },
    });

    return `https://gateway.pinata.cloud/ipfs/${response.data.IpfsHash}`;
  };

  /**
   * 上传元数据到 IPFS
   * @param {Object} metadata NFT 元数据
   * @returns {string} 返回元数据的 IPFS URL
   */
  const uploadMetadataToIPFS = async (metadata: object) => {
    const response = await axios.post("https://api.pinata.cloud/pinning/pinJSONToIPFS", metadata, {
      headers: {
        pinata_api_key: pinataApiKey,
        pinata_secret_api_key: pinataSecretApiKey,
      },
    });

    return `${response.data.IpfsHash}`;
  };

  /**
   * 分割图片
   * @param {File} file 图片文件
   * @param {number} rows 行数
   * @param {number} cols 列数
   * @returns {Promise<Blob[]>} 返回图片碎片的 Blob 数据
   */
  const splitImage = (file: File, rows: number, cols: number): Promise<Blob[]> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = URL.createObjectURL(file);

      img.onload = () => {
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        if (!context) {
          reject("Canvas context not available");
          return;
        }

        const fragmentWidth = img.width / cols;
        const fragmentHeight = img.height / rows;
        const fragments: Blob[] = [];

        for (let row = 0; row < rows; row++) {
          for (let col = 0; col < cols; col++) {
            canvas.width = fragmentWidth;
            canvas.height = fragmentHeight;
            context.drawImage(
              img,
              col * fragmentWidth,
              row * fragmentHeight,
              fragmentWidth,
              fragmentHeight,
              0,
              0,
              fragmentWidth,
              fragmentHeight
            );

            canvas.toBlob((blob) => {
              if (blob) fragments.push(blob);
              if (fragments.length === rows * cols) resolve(fragments);
            }, "image/png");
          }
        }
      };

      img.onerror = (err) => reject(err);
    });
  };

  /**
   * 文件选择处理
   */
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setSelectedFile(file);
    setFragments([]);
    setFragmentNames([]);
    setFragmentDescriptions([]);
  };

  /**
   * 生成碎片
   */
  const handleGenerateFragments = async () => {
    if (!selectedFile) {
      notification.error("请选择一张图片！");
      return;
    }

    setIsLoading(true);
    try {
      const generatedFragments = await splitImage(selectedFile, 3, 2); // 分割成 3x2
      setFragments(generatedFragments);
      setFragmentNames(generatedFragments.map((_, index) => `碎片 #${index + 1}`));
      setFragmentDescriptions(generatedFragments.map((_, index) => `碎片 ${index + 1} of the AKU`));
      notification.success("图片分割成功！");
    } catch (error) {
      console.error(error);
      notification.error("图片分割失败，请重试！");
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 批量铸造 NFT
   */
  const handleMintNFTs = async () => {
    if (fragments.length === 0) {
      notification.error("请先分割图片！");
      return;
    }

    setIsLoading(true);
    try {
      notification.loading("正在上传碎片到 IPFS...");
      const uploadedUrls = await Promise.all(
        fragments.map((fragment) => uploadImageToIPFS(fragment))
      );

      const metadataUrls = await Promise.all(
        uploadedUrls.map((imageUrl, index) => {
          const metadata = {
            name: fragmentNames[index],
            description: fragmentDescriptions[index],
            image: imageUrl,
          };
          return uploadMetadataToIPFS(metadata);
        })
      );

      notification.success("碎片上传成功，开始铸造 NFT...");

      await writeContractAsync({
        functionName: "mintBatch",
        args: [metadataUrls, metadataUrls.length],
      });

      notification.success("NFT 铸造成功！");
    } catch (error) {
      console.error(error);
      notification.error("NFT 铸造失败，请重试！");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-purple-900 p-8">
      <div className="max-w-4xl mx-auto bg-gray-800 rounded-lg shadow-lg p-8">
        <h1 className="text-4xl font-bold text-center text-white mb-6">NFT 碎片化铸造</h1>

        <div className="mb-6">
          <h3 className="text-xl text-white mb-4">上传图片</h3>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="w-full text-gray-300 bg-gray-700 rounded-lg p-2"
          />
        </div>

        {selectedFile && (
          <div className="mb-6">
            <h3 className="text-xl text-white mb-4">预览</h3>
            <img
              src={URL.createObjectURL(selectedFile)}
              alt="Selected"
              className="w-full rounded-lg"
            />
          </div>
        )}

        <div className="flex justify-between mb-6">
          <button
            onClick={handleGenerateFragments}
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg shadow-md"
          >
            {isLoading ? "生成中..." : "生成碎片"}
          </button>

          <button
            onClick={handleMintNFTs}
            disabled={isLoading || fragments.length === 0}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg shadow-md"
          >
            {isLoading ? "铸造中..." : "铸造 NFT"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default NFTFragmentationPage;
