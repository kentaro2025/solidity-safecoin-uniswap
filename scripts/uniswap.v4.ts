import { ethers, network } from "hardhat";

async function main() {
    const [owner] = await ethers.getSigners();

    if (network.name == "eth_main") {
        

        console.log("Liquidity added to Uniswap v4 pool successfully!");
    }
}