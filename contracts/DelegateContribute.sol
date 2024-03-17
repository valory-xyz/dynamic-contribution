// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

interface IWVEOLAS {
    /// @dev Gets the account balance in native token.
    /// @param account Account address.
    /// @return balance Account balance.
    function balanceOf(address account) external view returns (uint256 balance);

    /// @dev Gets the voting power.
    /// @param account Account address.
    /// @return balance Account balance.
    function getVotes(address account) external view returns (uint256 balance);
}

/// @dev No balance available to delegate.
/// @param delegator provided delegator address.
error NoBalance(address delegator);

/// @title DynamicContribution - Ownable smart contract for minting ERC721 tokens
contract DelegateContribute {

    /// @dev Delegation.
    /// @param delegator provided delegator.
    /// @param delegatee provided delegatee.
    event Delegation(address indexed delegator, address indexed delegatee);

    // wveOLAS address
    address immutable wveOLAS;

    // Mapping of account address => address
    mapping(address => address) public mapDelegation;

    // Maps a delegatee to their list of delegators
    mapping(address => address[]) private delegatorLists;

    // Maps a delegator to their index in the delegatee's list + 1 (since default value is 0)
    mapping(address => mapping(address => uint256)) private delegatorIndex;

    /// @dev DynamicContribution constructor.
    /// @param _wveOLAS wveOLAS contract address.
    constructor(address _wveOLAS)
    {
        wveOLAS = _wveOLAS;
    }

    /// @dev Delegates Contribute voting power to an address.
    /// @param delegator Delegator address.
    /// @param delegatee Delegatee address.
    function delegate(address delegator, address delegatee) external {

        uint256 balanceOf = IWVEOLAS(wveOLAS).balanceOf(delegator);
        if (balanceOf == 0) {
            revert NoBalance(delegator);
        }

        // Remove from old delegatee if applicable
        address currentDelegatee = mapDelegation[delegator];
        if(currentDelegatee != address(0) && currentDelegatee != delegatee) {
            uint256 index = delegatorIndex[currentDelegatee][delegator];

            // Adjust index since it's stored +1
            index -= 1;

            // Move the last element to the deleted spot to maintain compact array
            address lastDelegator = delegatorLists[currentDelegatee][delegatorLists[currentDelegatee].length - 1];
            delegatorLists[currentDelegatee][index] = lastDelegator;
            delegatorIndex[currentDelegatee][lastDelegator] = index + 1; // Update moved delegator's index

            // Remove the last element
            delegatorLists[currentDelegatee].pop();
            delete delegatorIndex[currentDelegatee][delegator];
        }

        mapDelegation[delegator] = delegatee;

        delegatorLists[delegatee].push(delegator);
        // Store the index of the new delegator, +1 to differentiate from default value
        delegatorIndex[delegatee][delegator] = delegatorLists[delegatee].length;

        emit Delegation(delegator, delegatee);
    }

    /// @dev Checks for the votingPower of a delegatee.
    /// @param delegatee Delegatee address.
    /// @return totalVotingPower total voting power of delegatee.
    function votingPower(address delegatee) external view returns (uint256 totalVotingPower) {
        address[] memory delegators = delegatorLists[delegatee];
        for (uint i = 0; i < delegators.length; i++) {
            totalVotingPower += IWVEOLAS(wveOLAS).getVotes(delegators[i]);
        }
    }

    /// @dev Get the delegators of a delegatee.
    /// @param delegatee Delegatee address.
    /// @return list of delegators.
    function getDelegatorList(address delegatee) external view returns (address[] memory) {
        return delegatorLists[delegatee];
    }
}
