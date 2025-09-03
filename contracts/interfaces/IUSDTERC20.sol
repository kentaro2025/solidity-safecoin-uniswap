interface IUSDTERC20 {
    function decimals() external view returns (uint8);

    function balanceOf(address who) external view returns (uint256);

    function transfer(address _to, uint _value) external;

    function transferFrom(address from, address to, uint256 value) external;

    function approve(address _spender, uint _value) external; 

    function allowance(address _owner, address _spender) external view returns (uint256);
}