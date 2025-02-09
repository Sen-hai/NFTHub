export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = JSON.stringify(body);
    const pinataJWT = process.env.PINATA_JWT;

    if (!pinataJWT) {
      throw new Error("PINATA_JWT 环境变量未设置！");
    }
//publicClient
    const response = await fetch("https://api.pinata.cloud/pinning/pinJSONToIPFS", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${pinataJWT}`,
        "Content-Type": "application/json",
      },
      body: data,
    });

    if (!response.ok) {
      throw new Error(`HTTP 错误！状态：${response.status}`);
    }

    const result = await response.json();

    // 返回 JSON 对象，使用正确的格式
    return new Response(JSON.stringify({ IpfsHash: result.IpfsHash }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("上传到 Pinata 时出错：", error);

    // 返回错误响应，使用正确的格式
    return new Response(JSON.stringify({ error: "上传到 Pinata 时出错" }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }
}
