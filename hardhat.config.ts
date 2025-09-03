import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";

import "hardhat-contract-sizer"
import "hardhat-abi-exporter"
import "hardhat-gas-reporter"
import "solidity-coverage"

dotenv.config();

const config: HardhatUserConfig = {
  solidity: {
    compilers: [
      {
        version: "0.5.16",
        settings: {
          optimizer: {
            enabled: true,
            runs: 1000,
          },
        },
      },
      {
        version: "0.6.12",
        settings: {
          optimizer: {
            enabled: true,
            runs: 1000,
          },
        },
      },
      {
        version: "0.8.28"
      }
    ],
  },
  networks: {
    hardhat: {
      forking: {
        url: "https://mainnet.infura.io/v3/333dde50efb045c3b2c60a9203a37778",
        blockNumber: 22078673
      }
    },
    local: {
      url: "http://127.0.0.1:8545/",
    },
    eth_sepolia: {
      url: "https://sepolia.infura.io/v3/333dde50efb045c3b2c60a9203a37778",
      accounts:
        process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
    },
    eth_main: {
      url: "https://mainnet.infura.io/v3/333dde50efb045c3b2c60a9203a37778",
      accounts:
        process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
    }
  },
  abiExporter: {
    path: "./abi",
    runOnCompile: true,
    clear: true,
    flat: true,
    only: [],
    spacing: 2,
  },
  contractSizer: {
    alphaSort: true,
    disambiguatePaths: false,
    runOnCompile: true,
    strict: false,
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD",
    token: "ETH",
    coinmarketcap: process.env.COINMARKETCAP_API_KEY,
    gasPrice: 10,
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
  sourcify: {
    enabled: true
  }
};

export default config;
