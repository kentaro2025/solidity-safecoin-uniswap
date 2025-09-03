import { readContractInfo } from "./utility"

interface StableCointDictionary {
  [key: string]: string
}

export let usdtAddress: StableCointDictionary = {}
export let usdcAddress: StableCointDictionary = {}

usdtAddress["ethereum"] = "0xdac17f958d2ee523a2206206994597c13d831ec7"
usdcAddress["ethereum"] = "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48"

export const tokenName = "Safe Coin"
export const tokenSymbol = "SAFE"
export const intialSupply = 100000000

export const treasury = "0x2205183B44ec598dAc52589D0336FD1E332c9f07"
