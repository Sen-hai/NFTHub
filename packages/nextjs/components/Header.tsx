"use client";

import React, { useCallback, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAccount } from "wagmi";
// 引入wagmi用于获取钱包地址
import {
  ArrowPathIcon,
  BackwardIcon,
  Bars3Icon,
  BoltSlashIcon,
  BookmarkIcon,
  BugAntIcon,
  BuildingStorefrontIcon,
  PhotoIcon,
  RectangleGroupIcon,
  ViewColumnsIcon,
  WalletIcon,
} from "@heroicons/react/24/outline";
import { FaucetButton, RainbowKitCustomConnectButton } from "~~/components/scaffold-eth";
import { useOutsideClick } from "~~/hooks/scaffold-eth";

type HeaderMenuLink = {
  label: string;
  href: string;
  icon?: React.ReactNode;
};

export const menuLinks: HeaderMenuLink[] = [
  {
    label: "个人中心",
    href: "/myNFTs",
    icon: <PhotoIcon className="h-4 w-4" />,
  },
  {
    label: "交易信息",
    href: "/transfers",
    icon: <ArrowPathIcon className="h-4 w-4" />,
  },
  {
    label: "Debug Contracts",
    href: "/debug",
    icon: <BugAntIcon className="h-4 w-4" />,
  },
  {
    label: "创建NFT",
    href: "/CreateNFT",
    icon: <WalletIcon className="h-4 w-4" />,
  },
  {
    label: "NFT 市场",
    href: "/GetAllNft",
    icon: <BookmarkIcon className="h-4 w-4" />,
  },
  {
    label: "拍卖中心",
    href: "/NftAuction",
    icon: <ViewColumnsIcon className="h-4 w-4" />,
  },
  {
    label: "盲盒",
    href: "/MysteryBox",
    icon: <BuildingStorefrontIcon className="h-4 w-4" />,
  },
  {
    label: "发布空投",
    href: "/NFTAirdrop",
    icon: <BackwardIcon className="h-4 w-4" />,
  },
  {
    label: "领取空投",
    href: "/ClaimAirdrop",
    icon: <RectangleGroupIcon className="h-4 w-4" />,
  },
  {
    label: "NFT 碎片化",
    href: "/NFTFragmentation",
    icon: <BoltSlashIcon className="h-4 w-4" />,
  },
];

export const HeaderMenuLinks = () => {
  const pathname = usePathname();
  const { address } = useAccount(); // 获取当前用户地址

  // 假设合约发布者地址是固定的，例如 "0x1234567890abcdef1234567890abcdef12345678"
  const contractOwnerAddress = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";

  return (
    <>
      {menuLinks.map(({ label, href, icon }) => {
        const isActive = pathname === href;

        // 如果当前菜单项是 "空投"，且当前地址不是合约发布者，则不显示
        if (label === "发布空投" && address !== contractOwnerAddress) {
          return null; // 隐藏 "空投" 菜单项
        }

        if (label === "领取空投" && address == contractOwnerAddress) {
          return null; // 隐藏 "空投" 菜单项
        }

        return (
          <li key={href}>
            <Link
              href={href}
              passHref
              className={`${
                isActive ? "bg-secondary shadow-md" : ""
              } hover:bg-secondary hover:shadow-md focus:!bg-secondary active:!text-neutral py-1.5 px-3 text-sm rounded-full gap-2 grid grid-flow-col`}
            >
              {icon}
              <span>{label}</span>
            </Link>
          </li>
        );
      })}
    </>
  );
};

/**
 * Site header
 */
export const Header = () => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const burgerMenuRef = useRef<HTMLDivElement>(null);
  useOutsideClick(
    burgerMenuRef,
    useCallback(() => setIsDrawerOpen(false), []),
  );

  return (
    <div className="sticky xl:static top-0 navbar bg-primary min-h-0 flex-shrink-0 justify-between z-20 shadow-md shadow-secondary px-0 sm:px-2">
      <div className="navbar-start w-auto xl:w-1/2">
        <div className="xl:hidden dropdown" ref={burgerMenuRef}>
          <label
            tabIndex={0}
            className={`ml-1 btn btn-ghost ${isDrawerOpen ? "hover:bg-secondary" : "hover:bg-transparent"}`}
            onClick={() => {
              setIsDrawerOpen(prevIsOpenState => !prevIsOpenState);
            }}
          >
            <Bars3Icon className="h-1/2" />
          </label>
          {isDrawerOpen && (
            <ul
              tabIndex={0}
              className="menu menu-compact dropdown-content mt-3 p-2 shadow bg-base-100 rounded-box w-52"
              onClick={() => {
                setIsDrawerOpen(false);
              }}
            >
              <HeaderMenuLinks />
            </ul>
          )}
        </div>
        <Link href="/" passHref className="hidden xl:flex items-center gap-1 ml-4 mr-6 shrink-0">
          <div className="flex relative w-10 h-10">
            <Image alt="SE2 logo" className="cursor-pointer" fill src="/static/picture/nft.svg" />
          </div>
        </Link>
        <ul className="hidden xl:flex xl:flex-nowrap menu menu-horizontal px-1 gap-2">
          <HeaderMenuLinks />
        </ul>
      </div>
      <div className="navbar-end flex-grow mr-4">
        <RainbowKitCustomConnectButton />
        <FaucetButton />
      </div>
    </div>
  );
};
