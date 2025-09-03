import hre, { ethers } from "hardhat"
import { readContractInfo } from "./helpers/utility"

// ArrowToekn & Staking contract addresses on the Fuji testnet
const safeCoinInfo = readContractInfo("SafeCoin", hre.network.name)

async function verifyContracts() {
  if (safeCoinInfo != null) {
    await verify(safeCoinInfo.address, safeCoinInfo.args)
  }
}

async function verify(contract: string, args: (string | string[])[]) {
  try {
    await hre.run("verify:verify", {
      address: contract,
      constructorArguments: args,
    })
  } catch (e: unknown) {
    if (typeof e === "string") {
      console.log("Error String: ", e.toUpperCase())
    } else if (e instanceof Error) {
      console.log("Error.message: ", e.message)
    }
    console.log(`\n******`)
    console.log()
  }
}

verifyContracts()
