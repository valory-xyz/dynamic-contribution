// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

// Mock contract for IWVEOLAS interface
contract WVEOLASMock {
    mapping(address => uint256) private _balances;
    mapping(address => uint256) private _votes;

    // Function to simulate setting the balance for an account
    function setBalance(address account, uint256 balance) public {
        _balances[account] = balance;
    }

    // Function to simulate setting the votes for an account
    function setVotes(address account, uint256 votes) public {
        _votes[account] = votes;
    }

    // balanceOf mock function
    function balanceOf(address account) external view returns (uint256) {
        return _balances[account];
    }

    // getVotes mock function
    function getVotes(address account) external view returns (uint256) {
        return _votes[account];
    }
}