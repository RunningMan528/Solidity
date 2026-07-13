import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("TotoroNFTModule",(m) => {
    const totoroNFT = m.contract("TotoroNFT");

    return {totoroNFT};
});