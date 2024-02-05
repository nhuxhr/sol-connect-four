import { Cluster as SolanaCluster } from "@solana/web3.js";

type Cluster = SolanaCluster | "localnet" | "custom";

const encodeURL = (baseUrl: string, searchParams: Record<string, string>) => {
  const url = new URL(baseUrl);
  url.search = new URLSearchParams(searchParams).toString();
  return url.toString();
};

export function getExplorerLink(
  type: "transaction" | "tx" | "address" | "block",
  value: string,
  cluster: Cluster = process.env.NEXT_PUBLIC_CLUSTER as Cluster
) {
  const searchParams: Record<string, string> = {};

  if (cluster !== "mainnet-beta") {
    if (["localnet", "custom"].includes(cluster)) {
      searchParams["cluster"] = "custom";
      searchParams["customUrl"] = "http://localhost:8899";
    } else {
      searchParams["cluster"] = cluster;
    }
  }

  let baseUrl: string = "";
  if (type === "address") {
    baseUrl = `https://explorer.solana.com/address/${value}`;
  }
  if (type === "transaction" || type === "tx") {
    baseUrl = `https://explorer.solana.com/tx/${value}`;
  }
  if (type === "block") {
    baseUrl = `https://explorer.solana.com/block/${value}`;
  }

  return encodeURL(baseUrl, searchParams);
}
