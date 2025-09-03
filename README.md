# SafeCoin

SafeCoin is an **ERC20-compatible token** with a built-in _account freezing_ mechanism.  
By default, accounts are frozen until explicitly unfrozen by the owner.  
When a frozen account receives tokens, part of its balance is marked as **non-transferable (frozen cost)** until it is unfrozen.

This repo also contains **integration tests** for Uniswap V2 and V3 on a Hardhat Mainnet fork.  
The tests cover adding liquidity, performing swaps, and verifying frozen balance logic.

---

## Features

- ✅ ERC20 token with custom freezing logic
- ✅ Owner can unfreeze accounts and reset frozen costs
- ✅ Track **transferable balance** vs **frozen cost**
- ✅ Uniswap V2 integration tests (Factory, Router, liquidity, swaps)
- ✅ Uniswap V3 integration tests (Factory, Router, Position Manager, swaps)
- ✅ Runs on **Hardhat mainnet fork** with USDT impersonation

---

## Contracts

### `SafeCoin.sol`

- Extends OpenZeppelin’s `ERC20` and `Ownable`.
- Adds `_unfrozenAccounts` and `_frozenCosts` mappings.
- Custom `transferableAmount()` to compute spendable tokens.
- Emits `AccountUnfrozen(account, bool)` when owner unfreezes.
- Uses `_beforeTokenTransfer` hook to enforce freeze logic.

---

## Project Structure

- contracts/
- SafeCoin.sol
- test/
- uniswap-v2.test.ts
- uniswap-v3.test.ts
- abi/
- IUSDTERC20.json
- hardhat.config.ts
- package.json

---

## Prerequisites

- Node.js >= 18
- [Hardhat](https://hardhat.org/)
- RPC provider with Ethereum mainnet archive access (e.g. Infura, Alchemy)

---

## Setup

1. Clone the repo

   ```bash
   git clone https://github.com/your-org/safecoin.git
   cd safecoin
   ```

2. Install dependencies

   ```bash
   npm install
   ```

3. Create a `.env` file with your RPC provider URL
   ```bash
   echo "RPC_URL=https://your-rpc-url" > .env
   ```

---

## Running Tests

```bash
# Compile contracts
npx hardhat compile

# Run tests on mainnet fork
npx hardhat test --network hardhat
```

---

## How the tests work
### Uniswap V2

- Deploys SafeCoin.
- Impersonates USDT whale to fund test accounts.
- dds liquidity to SAFE/USDT pool.
- Performs swaps (USDT → SAFE, SAFE → USDT).
- Verifies frozen balances are applied correctly.

### Uniswap V3

- Deploys SafeCoin.
- Creates SAFE/USDT pool via NonfungiblePositionManager.
- Adds liquidity.
- Performs swaps using the Uniswap V3 SwapRouter.
- Tests unfreeze logic for pool and accounts.

---

## License

This project is licensed under the MIT License.
