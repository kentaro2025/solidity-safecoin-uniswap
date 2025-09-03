import { ethers, network } from "hardhat";
import { expect } from "chai";
import UniswapV2FactoryABI from "@uniswap/v2-core/build/UniswapV2Factory.json";
import UniswapV2RouterABI from "@uniswap/v2-periphery/build/UniswapV2Router02.json";
import IUSDTERC20ABI from "../abi/IUSDTERC20.json";

describe("SafeToken Uniswap V2 Test", function () {
    let owner: any, account1: any, account2: any;
    let factory: any, router: any, token: any, usdt: any;
    let initflag: boolean = false;

    async function deployFixtures() {
        [owner, account1, account2] = await ethers.getSigners();

        // Assuming deployed contract addresses are available
        const FACTORY_ADDRESS = "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f"; // Uniswap V2 Factory
        const ROUTER_ADDRESS = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D"; // Uniswap V2 Router
        const WETH_ADDRESS = "0xC02aaa39b223FE8D0A0e5C4F27eAD9083C756Cc2"; // Wrapped Ether (WETH)
        const USDT_ADDRESS = "0xdAC17F958D2ee523a2206206994597C13D831ec7"; // Tether (USDT)
        const USDT_WHALE = "0x5754284f345afc66a98fbB0a0Afe71e0F007B949"; 

        // Get contract instances using their deployed addresses
        factory = new ethers.Contract(FACTORY_ADDRESS, UniswapV2FactoryABI.abi, owner);
        router = new ethers.Contract(ROUTER_ADDRESS, UniswapV2RouterABI.abi, owner);
        usdt = new ethers.Contract(USDT_ADDRESS, IUSDTERC20ABI, owner);

        // Deploy contract for SafeCoin
        const Token = await ethers.getContractFactory("SafeCoin");
        token = await Token.deploy("Safe Coin", "SAFE", 10000000);
        await token.waitForDeployment();

        // Impersonate USDT whale
        await network.provider.request({
            method: "hardhat_impersonateAccount",
            params: [USDT_WHALE],
        });
        const usdtWhaleSigner = await ethers.getSigner(USDT_WHALE);
        
        // Transfer 100000 USDT from whale to owner
        await usdt.connect(usdtWhaleSigner).transfer(owner.address, ethers.parseUnits("100000", 6));

        // Stop impersonation
        await network.provider.request({
            method: "hardhat_stopImpersonatingAccount",
            params: [USDT_WHALE],
        });

        return { factory, router, token, owner, account1, account2, usdt };
    }

    it("should deploy and add liquidity", async () => {
        const { factory, router, token, owner, usdt } = await deployFixtures();
        // Log balances for verification
        console.log("Owner USDT Balance:", ethers.formatUnits(await usdt.balanceOf(owner.address), 6));
        console.log("Owner SAFE Token Balance:", ethers.formatUnits(await token.balanceOf(owner.address), 18));
        console.log("Owner ETH Balance:", ethers.formatEther(await ethers.provider.getBalance(owner.address)));
        console.log("Factory:", factory.target);
        console.log("Router:", router.target);
        console.log("SAFE Token:", token.target);
        console.log("USDT token:", usdt.target);

        // Add liquidity to the Uniswap pool
        const tokenAmount = ethers.parseEther("50000");
        const usdtAmount = ethers.parseUnits("5000", 6);

        await token.approve(router.target, tokenAmount);
        await usdt.approve(router.target, 0); // Reset to zero
        await usdt.approve(router.target, usdtAmount);
        console.log("Approved SAFE:", ethers.formatEther(await token.allowance(owner.address, router.target)));
        console.log("Approved USDT:", ethers.formatUnits(await usdt.allowance(owner.address, router.target), 6));

        const tx = await router.addLiquidity(
            token.target, // Token address
            usdt.target,  // USDT address
            tokenAmount,
            usdtAmount,
            0,
            0,
            owner.address,
            Math.floor(Date.now() / 1000) + 36000  // Deadline (10 hours from now)
        );
        await tx.wait();

        // Retrieve the pair created on Uniswap
        const pair = await factory.getPair(token.target, usdt.target);
        console.log("Added Liquidity & Created Pair: ", pair);

        await token.unfreezeAccount(pair, true);
        console.log("Unfreezed Pair: ");
    });

    it("should perform token swaps", async () => {
        // Buys token using USDT
        let balance0 = await token.balanceOf(account1.address);
        const usdtAmount = ethers.parseUnits("100", 6);

        await usdt.transfer(account1.address, usdtAmount);
        await usdt.connect(account1).approve(router.target, usdtAmount);
        await router.connect(account1).swapExactTokensForTokens(
            usdtAmount,
            0,
            [usdt.target, token.target],
            account1.address,
            Math.floor(Date.now() / 1000) + 3600  // Deadline (1 hour from now)
        );
        let balance1 = await token.balanceOf(account1.address);
        console.log("Swap USDT to SAFE: SAFE-", ethers.formatEther(balance1));

        expect(balance1).to.be.gt(balance0);

        // Account 1 tries to sell token back to USDT
        await token.unfreezeAccount(account1.address, true);
        balance0 = await usdt.balanceOf(account1.address);
        let safeAmount = await token.transferableAmount(account1.address);
        await token.connect(account1).approve(router.target, safeAmount);
        await router.connect(account1).swapExactTokensForTokens(
            safeAmount,
            0,
            [token.target, usdt.target],
            account1.address,
            Math.floor(Date.now() / 1000) + 3600  // Deadline (1 hour from now)
        );
        balance1 = await usdt.balanceOf(account1.address);
        console.log("Swap SAFE to USDT: USDT-", ethers.formatUnits(balance1, 6));
        expect(balance0).to.be.lt(balance1);
    });

    it("should apply freeze cost for excluded sender and non-excluded recipient", async () => {
        // Buys token using USDT
        const usdtAmount = ethers.parseUnits("100", 6);

        await usdt.transfer(account2.address, usdtAmount);
        await usdt.connect(account2).approve(router.target, usdtAmount);
        await router.connect(account2).swapExactTokensForTokens(
            usdtAmount,
            0,
            [usdt.target, token.target],
            account2.address,
            Math.floor(Date.now() / 1000) + 3600  // Deadline (1 hour from now)
        );
        let balance1 = await token.balanceOf(account2.address);
        console.log("Swap USDT to SAFE: SAFE-", ethers.formatEther(balance1));

        // Check that the freeze cost was correctly added
        let freezeCost = await token.getFrozenCost(account2.address);
        console.log("Frozen Costs: SAFE-", ethers.formatEther(freezeCost));
        expect(freezeCost).to.be.gt(0);
    });
});
