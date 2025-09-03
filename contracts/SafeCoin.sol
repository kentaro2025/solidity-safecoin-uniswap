// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

// SafeCoin is an ERC20 token contract that implements account freezing functionality. 
// The owner of token contract can unfreeze accounts, and frozen accounts have their transferable balance reduced 
// by the amount that is "frozen". The contract also includes events for account unfreezing 
// and allows for querying the frozen status and costs associated with accounts.

contract SafeCoin is ERC20, Ownable, ReentrancyGuard {
    mapping(address => bool) private _unfrozenAccounts;
    mapping(address => uint256) private _frozenCosts;

    event AccountUnfreezed(address indexed account, bool unfrozen);

    constructor(string memory name, string memory symbol, uint256 initialSupply)
        ERC20(name, symbol)
        Ownable(msg.sender)
    {
        _unfrozenAccounts[msg.sender] = true;
        _unfrozenAccounts[address(this)] = true;

        _mint(msg.sender, initialSupply * 10 ** decimals());
    }

    function unfreezeAccount(address account, bool unfreeze) external onlyOwner {
        _unfrozenAccounts[account] = unfreeze;
        _frozenCosts[account] = 0;
        emit AccountUnfreezed(account, unfreeze);
    }

    function isFrozen(address account) external view returns (bool) {
        return !_unfrozenAccounts[account];
    }

    function _update(address from, address to, uint256 value) internal override {
        uint256 transferable = transferableAmount(from);
        require(from == address(0) || transferable >= value, "SAFE: Insufficient transferable balance");
        
        if (!_unfrozenAccounts[to]) {
            _frozenCosts[to] = _frozenCosts[to] + value;
        }
        
        super._update(from, to, value);
    }

    function transferableAmount(address account) public view returns (uint256) {
        if (balanceOf(account) > _frozenCosts[account]) {
            return balanceOf(account) - _frozenCosts[account];
        }
        return 0;
    }

    function getFrozenCost(address account) public view returns (uint256) {
        return _frozenCosts[account];
    }
}
