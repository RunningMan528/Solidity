const required = (value: string | undefined, name: string): string => {
  if (!value) {
    throw new Error(`缺少环境变量: ${name}`);
  }

  return value;
};

const chainIdValue = required(
  process.env.NEXT_PUBLIC_CHAIN_ID,
  "NEXT_PUBLIC_CHAIN_ID",
);

export const chainConfig = {
  chainId: BigInt(chainIdValue),
  chainIdHex: `0x${BigInt(chainIdValue).toString(16)}`,
  chainName: required(
    process.env.NEXT_PUBLIC_CHAIN_NAME,
    "NEXT_PUBLIC_CHAIN_NAME",
  ),
  rpcUrl: required(
    process.env.NEXT_PUBLIC_RPC_URL,
    "NEXT_PUBLIC_RPC_URL",
  ),
  blockExplorerUrl: required(
    process.env.NEXT_PUBLIC_BLOCK_EXPLORER_URL,
    "NEXT_PUBLIC_BLOCK_EXPLORER_URL",
  ),
  factoryAddress: required(
    process.env.NEXT_PUBLIC_FACTORY_ADDRESS,
    "NEXT_PUBLIC_FACTORY_ADDRESS",
  ),
  etherscanApiUrl: process.env.NEXT_PUBLIC_ETHERSCAN_API_URL ?? "",
  nativeCurrency: {
    name: "ETH",
    symbol: "ETH",
    decimals: 18,
  },
} as const;