// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;
import "../../lib/solmate/src/tokens/ERC721.sol";

interface IDynamicContribution {
    /// @dev Mints a new token.
    /// @return tokenId Minted token Id.
    function mint() external returns (uint256 tokenId);

    /// @dev Mints a new token for a specified account.
    /// @param account Account address for the token mint.
    /// @return tokenId Minted token Id.
    function mintFor(address account) external returns (uint256 tokenId);
}

contract ReentrancyAttacker is ERC721TokenReceiver {
    // DynamicContribution contract
    address public immutable dynamicContribution;

    bool public badAction;
    bool public justMint;

    constructor(address _dynamicContribution) {
        dynamicContribution = _dynamicContribution;
    }
    
    /// @dev wallet
    receive() external payable {
        badAction = true;
    }

    /// @dev Malicious contract function call during the token mint.
    function onERC721Received(address, address, uint256, bytes memory) public virtual override returns (bytes4) {
        uint256 tokenId;
        if (justMint) {
            tokenId = badMint();
        } else {
            tokenId = badMintFor();
        }
        badAction = true;
        return this.onERC721Received.selector;
    }

    /// @dev Sets the attack during the mint of a token.
    function setAttackOnJustMint(bool _justMint) external {
        justMint = _justMint;
    }

    /// @dev Lets attacker call a onERC721Receive during the token mint.
    function badMint() public returns (uint256 tokenId) {
        tokenId = IDynamicContribution(dynamicContribution).mint();
    }

    /// @dev Lets attacker call a onERC721Receive during the token mint for the account.
    function badMintFor() public returns (uint256 tokenId) {
        tokenId = IDynamicContribution(dynamicContribution).mintFor(address(this));
    }
}