import { BrowserProvider, Contract, JsonRpcProvider, formatEther, parseEther } from "https://cdn.jsdelivr.net/npm/ethers@6.17.0/+esm";

const SEPOLIA_CHAIN_ID = "0xaa36a7";
const RPC_URL = "https://ethereum-sepolia-rpc.publicnode.com";
const NFT_ADDRESS = "0xeAC3D7eD26B6f7588e6992C5D3A8580c831bbC39";
const MARKET_ADDRESS = "0x6deAe138b3Ef2E33F78fFf76f8b9ac48198b8b70";
const MAX_ITEMS = 12;
const IPFS_GATEWAY = "https://ipfs.io/ipfs/";

const nftAbi = [
    "function mint(string uri) payable returns (uint256)", "function mintPrice() view returns (uint256)",
    "function totalSupply() view returns (uint256)", "function ownerOf(uint256) view returns (address)",
    "function tokenURI(uint256) view returns (string)", "function approve(address to,uint256 tokenId)",
];
const marketAbi = [
    "function listingCounter() view returns (uint256)", "function auctionCounter() view returns (uint256)",
    "function platformFee() view returns (uint256)", "function listNFT(address nftContract,uint256 tokenId,uint256 price)",
    "function createAuction(address nftContract,uint256 tokenId,uint256 startPrice,uint256 durationHours)",
    "function buyNFT(uint256 listingId) payable", "function placeBid(uint256 auctionId) payable",
    "function withdrawBid(uint256 auctionId)", "function endAuction(uint256 auctionId)",
    "function listings(uint256) view returns (address seller,address nftContract,uint256 tokenId,uint256 price,bool active)",
    "function auctions(uint256) view returns (address seller,address nftContract,uint256 tokenId,uint256 startPrice,uint256 highestBid,address highestBidder,uint256 endTime,bool active)",
];

const readProvider = new JsonRpcProvider(RPC_URL);
const readNft = new Contract(NFT_ADDRESS, nftAbi, readProvider);
const readMarket = new Contract(MARKET_ADDRESS, marketAbi, readProvider);
let account = null;
let walletProvider = null;
const metadataCache = new Map();

const $ = (id) => document.getElementById(id);
const short = (address) => `${address.slice(0, 6)}...${address.slice(-4)}`;
const eth = (amount) => `${Number(formatEther(amount)).toLocaleString(undefined, { maximumFractionDigits: 5 })} ETH`;
const setStatus = (message, isError = false) => { const status = $("status"); status.textContent = message; status.classList.toggle("error", isError); };

$("nftAddress").textContent = short(NFT_ADDRESS);
$("marketAddress").textContent = short(MARKET_ADDRESS);
$("etherscanLink").href = `https://sepolia.etherscan.io/address/${MARKET_ADDRESS}`;

async function connectWallet() {
    if (!window.ethereum) throw new Error("未检测到 MetaMask。请安装扩展后刷新页面。");
    walletProvider = new BrowserProvider(window.ethereum);
    const network = await walletProvider.getNetwork();
    if (network.chainId !== 11155111n) {
        await window.ethereum.request({ method: "wallet_switchEthereumChain", params: [{ chainId: SEPOLIA_CHAIN_ID }] });
    }
    account = await (await walletProvider.getSigner()).getAddress();
    $("connectButton").textContent = short(account);
    $("balanceValue").textContent = eth(await walletProvider.getBalance(account));
    $("walletLabel").textContent = "已连接";
    setStatus("钱包已连接，交易会由 MetaMask 请求确认。");
}

async function signerContracts() {
    if (!account) await connectWallet();
    const signer = await walletProvider.getSigner();
    return { nft: new Contract(NFT_ADDRESS, nftAbi, signer), market: new Contract(MARKET_ADDRESS, marketAbi, signer) };
}

async function send(label, transaction) {
    setStatus(`${label}：等待钱包确认...`);
    const tx = await transaction;
    setStatus(`${label}：已提交 ${short(tx.hash)}，等待区块确认...`);
    await tx.wait();
    setStatus(`${label}：交易已确认。`);
    await refresh();
}

function actionButton(label, handler, className = "") {
    const button = document.createElement("button"); button.textContent = label; button.className = className; button.addEventListener("click", () => handler().catch((error) => setStatus(error.shortMessage || error.message, true))); return button;
}

function ipfsToHttp(uri) {
    if (!uri?.startsWith("ipfs://")) return uri;
    return `${IPFS_GATEWAY}${uri.slice(7).replace(/^ipfs\//, "")}`;
}

async function getMetadata(tokenId) {
    if (metadataCache.has(tokenId)) return metadataCache.get(tokenId);
    const metadataPromise = (async () => {
        try {
            const tokenUri = await readNft.tokenURI(tokenId);
            const response = await fetch(ipfsToHttp(tokenUri));
            if (!response.ok) throw new Error("Metadata unavailable");
            const metadata = await response.json();
            return { name: metadata.name, image: ipfsToHttp(metadata.image) };
        } catch {
            return {};
        }
    })();
    metadataCache.set(tokenId, metadataPromise);
    return metadataPromise;
}

function card(title, price, meta, actions, metadata = {}) {
    const element = document.createElement("article"); element.className = "asset-card";
    if (metadata.image) {
        const preview = document.createElement("a"); preview.className = "asset-preview"; preview.href = metadata.image; preview.target = "_blank"; preview.rel = "noreferrer";
        const image = document.createElement("img"); image.src = metadata.image; image.alt = metadata.name || title; image.loading = "lazy";
        image.addEventListener("error", () => preview.remove());
        preview.append(image); element.append(preview);
    }
    const header = document.createElement("header"); const heading = document.createElement("h4"); const amount = document.createElement("span");
    heading.textContent = metadata.name || title; amount.className = "price"; amount.textContent = price; header.append(heading, amount);
    const description = document.createElement("p"); description.textContent = meta;
    const footer = document.createElement("footer"); actions.forEach((item) => footer.append(item));
    element.append(header, description, footer); return element;
}

async function refresh() {
    try {
        setStatus("正在刷新 Sepolia 链上数据...");
        const [supply, mintPrice, fee, listingCounter, auctionCounter] = await Promise.all([
            readNft.totalSupply(), readNft.mintPrice(), readMarket.platformFee(), readMarket.listingCounter(), readMarket.auctionCounter(),
        ]);
        $("supplyValue").textContent = supply.toString(); $("mintPriceValue").textContent = eth(mintPrice); $("feeValue").textContent = `${Number(fee) / 100}%`;
        if (account && walletProvider) $("balanceValue").textContent = eth(await walletProvider.getBalance(account));
        await Promise.all([renderListings(listingCounter), renderAuctions(auctionCounter)]);
        setStatus(`已同步：${listingCounter} 个历史挂单，${auctionCounter} 场历史拍卖。`);
    } catch (error) { setStatus(`读取链上数据失败：${error.shortMessage || error.message}`, true); }
}

async function renderListings(counter) {
    const container = $("listings"); container.replaceChildren(); const latest = [];
    for (let id = counter; id > 0n && latest.length < MAX_ITEMS; id--) latest.push(id);
    const records = await Promise.all(latest.map(async (id) => ({ id, data: await readMarket.listings(id) })));
    const active = records.filter(({ data }) => data.active);
    $("listingCount").textContent = active.length.toString();
    if (!active.length) { container.innerHTML = '<p class="empty">暂无进行中的固定价格挂单</p>'; return; }
    const cards = await Promise.all(active.map(async ({ id, data }) => card(`Totoro #${data.tokenId}`, eth(data.price), `卖家 ${short(data.seller)} · 挂单 #${id}`, [
        actionButton("以此价格购买", async () => { const { market } = await signerContracts(); await send("购买 NFT", market.buyNFT(id, { value: data.price })); }),
    ], await getMetadata(data.tokenId))));
    cards.forEach((item) => container.append(item));
}

async function renderAuctions(counter) {
    const container = $("auctions"); container.replaceChildren(); const latest = [];
    for (let id = counter; id > 0n && latest.length < MAX_ITEMS; id--) latest.push(id);
    const records = await Promise.all(latest.map(async (id) => ({ id, data: await readMarket.auctions(id) })));
    const active = records.filter(({ data }) => data.active);
    $("auctionCount").textContent = active.length.toString();
    if (!active.length) { container.innerHTML = '<p class="empty">暂无进行中的拍卖</p>'; return; }
    const now = BigInt(Math.floor(Date.now() / 1000));
    const cards = await Promise.all(active.map(async ({ id, data }) => {
        const minimum = data.highestBid === 0n ? data.startPrice : data.highestBid + (data.highestBid * 5n / 100n);
        const ended = now >= data.endTime;
        const actions = ended ? [
            actionButton("结算拍卖", async () => { const { market } = await signerContracts(); await send("结算拍卖", market.endAuction(id)); }),
        ] : [
            actionButton(`出价 ${eth(minimum)}`, async () => { const { market } = await signerContracts(); await send("提交出价", market.placeBid(id, { value: minimum })); }),
            actionButton("提取退款", async () => { const { market } = await signerContracts(); await send("提取退款", market.withdrawBid(id)); }, "quiet"),
        ];
        const seconds = data.endTime > now ? data.endTime - now : 0n;
        const time = ended ? "已到期，可结算" : `${Math.ceil(Number(seconds) / 3600)} 小时后结束`;
        return card(`拍卖 Totoro #${data.tokenId}`, data.highestBid === 0n ? `起拍 ${eth(data.startPrice)}` : `最高 ${eth(data.highestBid)}`, `拍卖 #${id} · ${time}`, actions, await getMetadata(data.tokenId));
    }));
    cards.forEach((item) => container.append(item));
}

$("connectButton").addEventListener("click", () => connectWallet().then(refresh).catch((error) => setStatus(error.shortMessage || error.message, true)));
$("refreshButton").addEventListener("click", refresh);
$("mintForm").addEventListener("submit", async (event) => { event.preventDefault(); try { const { nft } = await signerContracts(); await send("铸造 NFT", nft.mint($("mintUri").value, { value: await readNft.mintPrice() })); } catch (error) { setStatus(error.shortMessage || error.message, true); } });
$("listForm").addEventListener("submit", async (event) => { event.preventDefault(); try { const tokenId = BigInt($("listTokenId").value); const { nft, market } = await signerContracts(); await send("授权市场", nft.approve(MARKET_ADDRESS, tokenId)); await send("创建挂单", market.listNFT(NFT_ADDRESS, tokenId, parseEther($("listPrice").value))); } catch (error) { setStatus(error.shortMessage || error.message, true); } });
$("auctionForm").addEventListener("submit", async (event) => { event.preventDefault(); try { const tokenId = BigInt($("auctionTokenId").value); const { nft, market } = await signerContracts(); await send("授权市场", nft.approve(MARKET_ADDRESS, tokenId)); await send("创建拍卖", market.createAuction(NFT_ADDRESS, tokenId, parseEther($("auctionPrice").value), BigInt($("auctionDuration").value))); } catch (error) { setStatus(error.shortMessage || error.message, true); } });
window.ethereum?.on("accountsChanged", () => { account = null; $("connectButton").textContent = "连接钱包"; $("balanceValue").textContent = "未连接"; $("walletLabel").textContent = "等待 MetaMask"; });
window.ethereum?.on("chainChanged", () => window.location.reload());
refresh();