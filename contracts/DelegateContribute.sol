// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

interface IVEOLAS {
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

/// @dev No self delegation.
/// @param delegator provided delegator address.
error NoSelfDelegation(address delegator);

/// @dev Already delegated to same delegatee.
/// @param delegator provided delegator address.
/// @param delegatee provided delegatee address.
error AlreadyDelegatedToSameDelegatee(address delegator, address delegatee);

/// @title DelegateContribute - Governance free contract for delegating veOLAS voting power
contract DelegateContribute {

    /// @dev Delegation.
    /// @param delegator provided delegator.
    /// @param delegatee provided delegatee.
    event Delegation(address indexed delegator, address indexed delegatee);

    // veOLAS address
    address public immutable veOLAS;

    // Mapping of account address => address
    mapping(address => address) public mapDelegation;

    // Maps a delegatee to their list of delegators
    mapping(address => address[]) private delegatorLists;

    // Maps a delegator to their index in the delegatee's list + 1 (since default value is 0)
    mapping(address => mapping(address => uint256)) private delegatorIndex;

    /// @dev DynamicContribution constructor.
    /// @param _veOLAS veOLAS contract address.
    constructor(address _veOLAS)
    {
        veOLAS = _veOLAS;
    }

    /// @dev Delegates Contribute voting power to an address.
    /// @param delegatee Delegatee address.
    function delegate(address delegatee) external {
        address delegator = msg.sender;
        if (delegator == delegatee) {
            revert NoSelfDelegation(delegator);
        }
        address currentDelegatee = mapDelegation[delegator];
        if (currentDelegatee == delegatee) {
            revert AlreadyDelegatedToSameDelegatee(delegator, delegatee);
        }
        uint256 balanceOf = IVEOLAS(veOLAS).balanceOf(delegator);
        if (balanceOf == 0) {
            revert NoBalance(delegator);
        }

        // Remove from old delegatee if applicable
        if(currentDelegatee != address(0)) {
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

        if(delegatee != address(0)) {
            delegatorLists[delegatee].push(delegator);
            // Store the index of the new delegator, +1 to differentiate from default value
            delegatorIndex[delegatee][delegator] = delegatorLists[delegatee].length;
        }

        emit Delegation(delegator, delegatee);
    }

    /// @dev Checks for the votingPower of a delegatee.
    /// @notice the votingPower includes the delegatee's own voting power, unless delegated.
    /// @param delegatee Delegatee address.
    /// @return totalVotingPower total voting power of delegatee.
    function votingPower(address delegatee) external view returns (uint256 totalVotingPower) {
        if (mapDelegation[delegatee] == address(0)) {
            totalVotingPower += IVEOLAS(veOLAS).getVotes(delegatee);
        }
        address[] memory delegators = delegatorLists[delegatee];
        for (uint i = 0; i < delegators.length; i++) {
            totalVotingPower += IVEOLAS(veOLAS).getVotes(delegators[i]);
        }
    }

    /// @dev Get the delegators of a delegatee.
    /// @param delegatee Delegatee address.
    /// @return list of delegators.
    function getDelegatorList(address delegatee) external view returns (address[] memory) {
        return delegatorLists[delegatee];
    }
}
