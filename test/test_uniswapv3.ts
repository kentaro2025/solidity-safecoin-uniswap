import { ethers, network } from "hardhat";
import { expect } from "chai";
import UniswapV3FactoryABI from "@uniswap/v3-core/artifacts/contracts/UniswapV3Factory.sol/UniswapV3Factory.json";
import UniswapV3RouterABI from "@uniswap/v3-periphery/artifacts/contracts/SwapRouter.sol/SwapRouter.json";
import NonfungiblePositionManagerABI from "@uniswap/v3-periphery/artifacts/contracts/NonfungiblePositionManager.sol/NonfungiblePositionManager.json";
import IUSDTERC20ABI from "../abi/IUSDTERC20.json";

describe("SafeToken Uniswap V3 Test", function () {
    let owner: any, account1: any, account2: any;
    let factory: any, router: any, positionManager: any, token: any, usdt: any;

    before(async () => {
        [owner, account1, account2] = await ethers.getSigners();

        const FACTORY_ADDRESS = "0x1F98431c8aD98523631AE4a59f267346ea31F984"; // Uniswap V3 Factory
        const ROUTER_ADDRESS = "0xE592427A0AEce92De3Edee1F18E0157C05861564"; // Uniswap V3 Router
        const POSITION_MANAGER_ADDRESS = "0xC36442b4a4522E871399CD717aBDD847Ab11FE88"; // Nonfungible Position Manager
        const USDT_ADDRESS = "0xdAC17F958D2ee523a2206206994597C13D831ec7"; // Tether (USDT)
        const USDT_WHALE = "0x5754284f345afc66a98fbB0a0Afe71e0F007B949";

        factory = new ethers.Contract(FACTORY_ADDRESS, UniswapV3FactoryABI.abi, owner);
        router = new ethers.Contract(ROUTER_ADDRESS, UniswapV3RouterABI.abi, owner);
        positionManager = new ethers.Contract(POSITION_MANAGER_ADDRESS, NonfungiblePositionManagerABI.abi, owner);
        usdt = new ethers.Contract(USDT_ADDRESS, IUSDTERC20ABI, owner);

        const Token = await ethers.getContractFactory("SafeCoin");
        token = await Token.deploy("Safe Coin", "SAFE", 10000000);
        await token.waitForDeployment();

        await network.provider.request({ method: "hardhat_impersonateAccount", params: [USDT_WHALE] });
        const usdtWhaleSigner = await ethers.getSigner(USDT_WHALE);
        await usdt.connect(usdtWhaleSigner).transfer(owner.address, ethers.parseUnits("100000", 6));
        await network.provider.request({ method: "hardhat_stopImpersonatingAccount", params: [USDT_WHALE] });
    });

    it("should create pool and add liquidity", async () => {
        const feeTier = 3000; // 0.3% fee tier

        // Log balances for verification
        console.log("Owner USDT Balance:", ethers.formatUnits(await usdt.balanceOf(owner.address), 6));
        console.log("Owner SAFE Token Balance:", ethers.formatUnits(await token.balanceOf(owner.address), 18));
        console.log("Owner ETH Balance:", ethers.formatEther(await ethers.provider.getBalance(owner.address)));
        console.log("PositionManager:", positionManager.target);
        console.log("SAFE Token:", token.target);
        console.log("USDT token:", usdt.target);

        await token.approve(positionManager.target, ethers.parseEther("50000"));
        await usdt.approve(positionManager.target, 0); // Reset to zero
        await usdt.approve(positionManager.target, ethers.parseUnits("5000", 6));
        console.log("Approved SAFE:", ethers.formatEther(await token.allowance(owner.address, positionManager.target)));
        console.log("Approved USDT:", ethers.formatUnits(await usdt.allowance(owner.address, positionManager.target), 6));

        const tx = await positionManager.createAndInitializePoolIfNecessary(
            token.target,
            usdt.target,
            feeTier,
            ethers.parseUnits("1", 18) // Initial price ratio
        );
        await tx.wait();
        console.log("Pool Created & Added Liquidity: ");

        // Retrieve the pool created on Uniswap
        const poolAddress = await factory.getPool(token.target, usdt.target, feeTier);
        console.log("USDT/SAFE Pool Address:", poolAddress);

        await token.unfreezeAccount(poolAddress, true);
        await token.unfreezeAccount(account1.address, true);
    });

    it("should perform token swaps", async () => {
        let balance0 = await token.balanceOf(account1.address);
        const usdtAmount = ethers.parseUnits("100", 6);

        await usdt.transfer(account1.address, usdtAmount);
        await usdt.connect(account1).approve(router.target, 0);
        await usdt.connect(account1).approve(router.target, usdtAmount);

        await router.connect(account1).exactInputSingle({
            tokenIn: usdt.target,
            tokenOut: token.target,
            fee: 3000,
            recipient: account1.address,
            deadline: Math.floor(Date.now() / 1000) + 3600,
            amountIn: usdtAmount,
            amountOutMinimum: 0,
            sqrtPriceLimitX96: 0
        });
        let balance1 = await token.balanceOf(account1.address);
        console.log("Swap USDT to SAFE: SAFE-", ethers.formatEther(balance1));
        expect(balance1).to.be.gt(balance0);
    });
});
