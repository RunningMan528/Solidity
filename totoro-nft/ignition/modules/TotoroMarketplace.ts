import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("TotoroMarketplaceModule", (m) => {
    const feeRecipient = m.getParameter("feeRecipient");

    const totoroMarketplace = m.contract("TotoroMarketplace", [
        feeRecipient,
    ]);
    return { totoroMarketplace };
});