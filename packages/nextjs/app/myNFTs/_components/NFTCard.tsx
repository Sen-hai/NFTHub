import { useState } from "react";
import Swal from "sweetalert2"; // 引入 SweetAlert2
import { Address } from "~~/components/scaffold-eth";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth";

export const NFTCard = ({ nft }: { nft: any }) => {
  const [salePrice, setSalePrice] = useState(""); // 上架价格
  const [expirationTime, setExpirationTime] = useState(""); // 截止时间
  const { writeContractAsync } = useScaffoldWriteContract("YourCollectible");

  const handlePlaceOnSale = async () => {
    try {
      // 处理 salePrice
      const inputPrice = parseFloat(salePrice);
      if (inputPrice <= 0) {
        alert("上架价格必须大于0。");
        return;
      }

      // 处理 expirationTime
      let durationInSeconds = 0;
      if (expirationTime) {
        const selectedTime = new Date(expirationTime).getTime() / 1000; // 转为秒
        const currentTime = Math.floor(Date.now() / 1000); // 当前时间秒
        if (isNaN(selectedTime)) {
          alert("无效的截止时间！");
          return;
        }

        durationInSeconds = selectedTime - currentTime;
        console.log("durationInSeconds:", durationInSeconds);
        localStorage.setItem("durationInSeconds", durationInSeconds.toString());
        if (durationInSeconds <= 0) {
          alert("截止时间必须晚于当前时间！");
          return;
        }
      }

      // 使用 SweetAlert2 弹框确认
      const royaltyAmount = Number(inputPrice * 0.05);
      const result = await Swal.fire({
        title: "确认上架",
        html: `<p>该NFT上架后将收取 <strong>${royaltyAmount.toFixed(2)} ETH</strong> 的版税。</p><p>是否继续？</p>`,
        icon: "info",
        showCancelButton: true,
        confirmButtonText: "确认",
        cancelButtonText: "取消",
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        reverseButtons: true,
      });

      if (!result.isConfirmed) {
        return; // 用户取消操作
      }

      // 调用合约方法
      await writeContractAsync({
        functionName: "placeNftOnSale",
        args: [BigInt(nft.id.toString()), inputPrice, durationInSeconds],
      });

      await Swal.fire({
        title: "上架成功!",
        text: "您的 NFT 已成功上架，等待买家购买。",
        icon: "success",
        confirmButtonText: "确定",
        confirmButtonColor: "#3085d6", // 可自定义按钮颜色
      });
    } catch (err) {
      console.error("上架失败:", err);
      // 使用 SweetAlert2 弹框显示错误信息
      await Swal.fire({
        title: "上架失败",
        text: `发生了错误: ${err.message}`,
        icon: "error",
        confirmButtonText: '确定',
        confirmButtonColor: '#d33', // 可自定义按钮颜色
      });
    }
  };

  const createAuction = async () => {
    // 弹出模态框，收集拍卖的起始价格和结束时间
    Swal.fire({
      title: "设置拍卖起始价格与结束时间",
      html: `
        <input type="number" id="startingBid" class="swal2-input" placeholder="输入起始价格 (ETH)" value="${salePrice}" />
        <input type="datetime-local" id="auctionEndTime" class="swal2-input" placeholder="选择结束时间" value="${expirationTime}" />
      `,
      focusConfirm: false,
      preConfirm: () => {
        const startingBid = Number((document.getElementById("startingBid") as HTMLInputElement).value);
        const auctionEndTime = (document.getElementById("auctionEndTime") as HTMLInputElement).value;
        if (!startingBid || !auctionEndTime) {
          Swal.showValidationMessage("请输入完整的起始价格和结束时间！");
          return;
        }

        console.log("auctionEndTime222222222", auctionEndTime);

        const selectedEndTime = new Date(auctionEndTime).getTime() / 1000; // 转为秒
        const currentTime = Math.floor(Date.now() / 1000); // 当前时间秒
        console.log("selectedEndTime3333333333", selectedEndTime - currentTime);
        const realtime = Number(selectedEndTime - currentTime);
        if (selectedEndTime <= currentTime) {
          Swal.showValidationMessage("结束时间必须晚于当前时间！");
          return;
        }
        const startingBid1 = Number(startingBid * 10 ** 18);
        return { startingBid1, realtime };
      },
    }).then((result) => {
      if (result.isConfirmed) {
        const { startingBid1, realtime } = result.value;

        // 调用合约方法创建拍卖
        writeContractAsync({
          functionName: "createAuction",
          args: [BigInt(nft.id.toString()), startingBid1, realtime], // 将结束时间转换为秒
        })
          .then(() => {
            Swal.fire({
              title: "拍卖创建成功",
              text: "您的NFT已成功发起拍卖。",
              icon: "success",
              confirmButtonText: "确定",
              confirmButtonColor: "#3085d6",
            });
          })
          .catch((err) => {
            console.error("创建拍卖失败:", err);
            Swal.fire({
              title: "创建拍卖失败",
              text: `发生了错误: ${err.message}`,
              icon: "error",
              confirmButtonText: "确定",
              confirmButtonColor: "#d33",
            });
          });
      }
    });
  };

  // 弹出模态框，获取用户输入的上架价格和截止时间
  const handleOpenModal = () => {
    Swal.fire({
      title: "设置上架价格与截止时间 \n 可不设置截止时间",
      html: `
        <input type="number" id="price" class="swal2-input" placeholder="输入上架价格 (ETH)" value="${salePrice}" />
        <input type="datetime-local" id="expirationTime" class="swal2-input" placeholder="选择截止时间" value="${expirationTime}" />
      `,
      focusConfirm: false,
      preConfirm: () => {
        const price = Number((document.getElementById("price") as HTMLInputElement).value);
        const time = (document.getElementById("expirationTime") as HTMLInputElement).value;
        if (!price) {
          Swal.showValidationMessage("请输入正确的价格！");
          return;
        }
        setSalePrice(price);
        setExpirationTime(time);
        return { price, time };
      }
    }).then((result) => {
      if (result.isConfirmed) {
        handlePlaceOnSale(); // 在用户确认后调用上架方法
      }
    });
  };

  const endAuction = async () => {
    const result = await Swal.fire({
      title: "确认操作",
      text: "确定要结束该拍卖吗？",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "确认",
      cancelButtonText: "取消",
    });

    if (result.isConfirmed) {
      await writeContractAsync({
        functionName: "endAuction",
        args: [BigInt(nft.id.toString())],
      });
      Swal.fire("操作成功", "拍卖已结束！", "success");
    }
  };


  return (
    <div className="card card-compact bg-base-100 shadow-lg w-[320px] h-[450px] shadow-secondary">
      <figure className="relative">
        {/* eslint-disable-next-line */}
        <img src={nft.image} alt="NFT Image" className="h-60 min-w-full" />
        <figcaption className="glass absolute bottom-4 left-4 p-4 w-25 rounded-xl">
          <span className="text-white"># {nft.id}</span>
        </figcaption>
      </figure>
      <div className="card-body space-y-3">
        <div className="flex items-center h-[20px] justify-center">
          <p className="text-xl font-semibold">{nft.name}</p>
          <div className="flex flex-wrap space-x-2 mt-1">
            {nft.attributes?.map((attr, index) => (
              <span key={index} className="badge badge-primary py-3">
                {attr.value}
              </span>
            ))}
          </div>
        </div>
        <div className="flex flex-col justify-center h-[25px] mt-1">
          <p className="text-lg">{nft.description}</p>
        </div>
        <div className="flex space-x-3 h-[20px] items-center mt-1">
          <span className="text-lg font-semibold">Owner :</span>
          <Address address={nft.owner} />
        </div>

        <div className="card-actions flex justify-between items-center space-x-2">
          <button
            className="btn btn-primary btn-md px-4 tracking-wide"
            onClick={handleOpenModal}
          >
            上架
          </button>
          <button
            className="btn btn-primary btn-md px-4 tracking-wide"
            onClick={createAuction}
          >
            发起拍卖
          </button>
          <button
            className="btn btn-primary btn-md px-4 tracking-wide"
            onClick={endAuction}
          >
            结束拍卖
          </button>
        </div>


      </div>
    </div>
  );
};
