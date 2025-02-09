import Image from "next/image";
import type { NextPage } from "next";

const Home: NextPage = () => {
  return (
    <div className="relative min-h-screen flex items-center justify-center bg-black">
      {/* 背景图片 */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/static/picture/hero-bg.jpg"
          alt="背景图片"
          layout="fill"
          objectFit="cover"
          quality={100}
          className="top-0"
        />
      </div>
      {/* 内容 */}
      <div className="relative z-10 text-center text-white">
        <h1 className="text-6xl font-bold mb-4">Azuki NFT 花园</h1>
        <p className="text-xl mb-4">Azuki 起始于一个包含 10,000 个 NFT 的集合</p>
        <p className="text-xl mb-6">我们共同崛起，我们共同建设，我们共同成长</p>
        <a
          href="#"
          className="inline-block bg-gradient-to-r from-purple-600 to-pink-500 text-white py-3 px-8 rounded-full text-xl font-bold shadow-lg hover:shadow-xl transition-transform transform hover:scale-105"
        >
          在 Opensea 上查看
        </a>
      </div>
      {/* 左侧角色 */}
      <div className="absolute bottom-0 left-0 z-10">
        <Image
          src="/static/picture/hero-img.png"
          alt="左侧角色"
          width={600} // 增大宽度
          height={900} // 增大高度
          objectFit="contain"
        />
      </div>
      {/* 右侧角色 */}
      <div className="absolute bottom-0 right-0 z-10">
        <Image
          src="/static/picture/hero-img-2.png"
          alt="右侧角色"
          width={600} // 增大宽度
          height={900} // 增大高度
          objectFit="contain"
        />
      </div>
    </div>
  );
};

export default Home;
