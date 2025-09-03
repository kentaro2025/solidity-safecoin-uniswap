import { ethers, network } from "hardhat"
import { contractFactory } from "./helpers/deploy"
import { writeContractInfo } from "./helpers/utility"
import { tokenName, tokenSymbol, intialSupply } from "./helpers/const"

async function deployToken() {
  const signers = await ethers.getSigners()

  const args = [tokenName, tokenSymbol, intialSupply]
  const safeToken = await contractFactory("SafeCoin", args)

  writeContractInfo("SafeCoin", network.name, await safeToken.getAddress(), signers[0].address, args)
  console.log("SafeCoin Token is deployed")
}
deployToken()
