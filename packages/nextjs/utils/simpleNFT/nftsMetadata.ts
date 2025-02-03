const nftsMetadata = [
  {
    description: "A cool warrior from the stars.",
    image: "https://haowallpaper.com/link/common/file/previewFileImg/2b7a2e1896e5d3d2b0226296304266232b7a2e1896e5d3d2b022629630426623",
    name: "Star Warrior",
    attributes: [
      { trait_type: "Eyes", value: "red glow" },
      { trait_type: "Stamina", value: 95 },
    ],
  },
  {
    description: "A unique zebra ready to shine.",
    image: "https://haowallpaper.com/link/common/file/previewFileImg/df10f21aabbea2f5847fe522848f4fe0",
    name: "Shiny Zebra",
    attributes: [
      { trait_type: "Eyes", value: "green" },
      { trait_type: "Stamina", value: 88 },
    ],
  },
  {
    description: "A strong beast with a sharp horn.",
    image: "https://haowallpaper.com/link/common/file/previewFileImg/15500232888258880",
    name: "Horned Beast",
    attributes: [
      { trait_type: "Eyes", value: "yellow" },
      { trait_type: "Stamina", value: 77 },
    ],
  },
  {
    description: "A predator from the deep sea.",
    image: "https://haowallpaper.com/link/common/file/previewFileImg/15500231519211840",
    name: "Sea Predator",
    attributes: [
      { trait_type: "Eyes", value: "white" },
      { trait_type: "Stamina", value: 66 },
    ],
  },
  {
    description: "A neon-colored flamingo.",
    image: "https://haowallpaper.com/link/common/file/previewFileImg/c2af406c29c648fbb35170bb6e6f9344", // 霓虹火烈鸟图片
    name: "Neon Flamingo",
    attributes: [
      { trait_type: "Eyes", value: "purple" },
      { trait_type: "Stamina", value: 55 },
    ],
  },
  {
    description: "A powerful monster ready to roar.",
    image: "https://haowallpaper.com/link/common/file/previewFileImg/e35d362371e88e8b85fcc73bdb936cf7", // 酷炫怪兽图片
    name: "Mega Monster",
    attributes: [
      { trait_type: "Eyes", value: "blue" },
      { trait_type: "Stamina", value: 99 },
    ],
  },
];

export type NFTMetaData = (typeof nftsMetadata)[number];
export default nftsMetadata;
