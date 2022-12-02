# Internal audit of autonolas-registries
The review has been performed based on the contract code in the following repository:<br>
`https://github.com/valory-xyz/dynamic-contribution` <br>
commit: `e5f8736fe2e80ef26950ba19813f6933568f7dff` <br> 

## Objectives
The audit focused on contracts in this repo.

### Flatten version
Flatten version of contracts. [contracts](https://github.com/valory-xyz/dynamic-contribution/blob/main/audits/internal/analysis/contracts) 

### ERC721 checks
```
slither-check-erc --erc ERC721 DynamicContribution-flatten.sol DynamicContribution
# Check DynamicContribution

## Check functions
[✓] balanceOf(address) is present
        [✓] balanceOf(address) -> (uint256) (correct return type)
        [✓] balanceOf(address) is view
[✓] ownerOf(uint256) is present
        [✓] ownerOf(uint256) -> (address) (correct return type)
        [✓] ownerOf(uint256) is view
[✓] safeTransferFrom(address,address,uint256,bytes) is present
        [✓] safeTransferFrom(address,address,uint256,bytes) -> () (correct return type)
        [✓] Transfer(address,address,uint256) is emitted
[✓] safeTransferFrom(address,address,uint256) is present
        [✓] safeTransferFrom(address,address,uint256) -> () (correct return type)
        [✓] Transfer(address,address,uint256) is emitted
[✓] transferFrom(address,address,uint256) is present
        [✓] transferFrom(address,address,uint256) -> () (correct return type)
        [✓] Transfer(address,address,uint256) is emitted
[✓] approve(address,uint256) is present
        [✓] approve(address,uint256) -> () (correct return type)
        [✓] Approval(address,address,uint256) is emitted
[✓] setApprovalForAll(address,bool) is present
        [✓] setApprovalForAll(address,bool) -> () (correct return type)
        [✓] ApprovalForAll(address,address,bool) is emitted
[✓] getApproved(uint256) is present
        [✓] getApproved(uint256) -> (address) (correct return type)
        [✓] getApproved(uint256) is view
[✓] isApprovedForAll(address,address) is present
        [✓] isApprovedForAll(address,address) -> (bool) (correct return type)
        [✓] isApprovedForAll(address,address) is view
[✓] supportsInterface(bytes4) is present
        [✓] supportsInterface(bytes4) -> (bool) (correct return type)
        [✓] supportsInterface(bytes4) is view
[✓] name() is present
        [✓] name() -> (string) (correct return type)
        [✓] name() is view
[✓] symbol() is present
        [✓] symbol() -> (string) (correct return type)
[✓] tokenURI(uint256) is present
        [✓] tokenURI(uint256) -> (string) (correct return type)

## Check events
[✓] Transfer(address,address,uint256) is present
        [✓] parameter 0 is indexed
        [✓] parameter 1 is indexed
        [✓] parameter 2 is indexed
[✓] Approval(address,address,uint256) is present
        [✓] parameter 0 is indexed
        [✓] parameter 1 is indexed
        [✓] parameter 2 is indexed
[✓] ApprovalForAll(address,address,bool) is present
        [✓] parameter 0 is indexed
        [✓] parameter 1 is indexed
```

### Fuzzing check, Update 01-12-22

Candidates to [fuzzing](https://github.com/valory-xyz/dynamic-contribution/blob/main/audits/internal/analysis/fuzzer): <br>
```
echidna-test DynamicContribution-flatten.sol --contract DynamicContribution
                                                          ┌─────────────────────────────────────────────────────Echidna 1.7.3────────────────────────────────────────────────────┐                                                          
                                                          │ Tests found: 1                                                                                                       │                                                          
                                                          │ Seed: -5145603924598086133                                                                                           │                                                          
                                                          │ Unique instructions: 4118                                                                                            │                                                          
                                                          │ Unique codehashes: 1                                                                                                 │                                                          
                                                          │ Corpus size: 15                                                                                                      │                                                          
                                                          │─────────────────────────────────────────────────────────Tests────────────────────────────────────────────────────────│                                                          
                                                          │ echidna_track_tokenId: FAILED!                                                                                       │                                                          
                                                          │                                                                                                                      │                                                          
                                                          │ Call sequence:                                                                                                       │                                                          
                                                          │ 1.mint()                                                                                                             │                                                          
                                                          │ 2.burn(1)                                                                                                            │                                                          
                                                          └──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘                                                          
                                                                                                                                             
Ref: DynamicContribution needs attention
```
[fixed] removed burn functionality, commit: `658e820a5b762900cdc456b85b2ac90438163be1`

### Security issues. Updated 01-12-22
#### Problems found instrumentally
Several checks are obtained automatically. They are commented. No issue found by instrumentally way <br>
[slither-full](https://github.com/valory-xyz/dynamic-contribution/blob/main/audits/internal/analysis/slither_full.txt) <br>


#### DynamicContribution needs attention
In my opinion, the problems have a medium/low level of risk and they are related to the fact that the contract includes burn(). <br>
The contract requires improvement or exclusion of the functionality with the burning of tokens. <br>
[fixed] all listed issues, commit: `658e820a5b762900cdc456b85b2ac90438163be1`

##### totalSupply incorrect with `burn()`. Medium priority
```
// Unit counter
uint256 public totalSupply;

https://eips.ethereum.org/EIPS/eip-721
    /// @notice Count NFTs tracked by this contract
    /// @return A count of valid NFTs tracked by this contract, where each one of
    ///  them has an assigned and queryable owner not equal to the zero address
    function totalSupply() external view returns (uint256);

This condition will not be met in the current version of the contract after each operation `burn`
```
[fixed] removed burn functionality, commit: `658e820a5b762900cdc456b85b2ac90438163be1`

##### tokenURI without checking by EIP-721. Medium priority 
```
https://github.com/ethereum/EIPs/blob/master/EIPS/eip-721.md
/// @dev Throws if `_tokenId` is not a valid NFT. URIs are defined in RFC

    function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
        return string.concat(baseURI, tokenId.toString());
    }
no existence check of tokenId
```
[fixed] refactored a function and tests, commit: `658e820a5b762900cdc456b85b2ac90438163be1`

##### exists incorrect with `burn()`. Medium priority

```
    function exists(uint256 tokenId) public view virtual returns (bool) {
        return tokenId > 0 && tokenId < (totalSupply + 1);
    }
correct like 
        return _ownerOf(tokenId) != address(0);
```
[fixed] removed burn functionality, commit: `658e820a5b762900cdc456b85b2ac90438163be1`

##### tokenByIndex needs to be rechecked for implementation with `burn()`. Medium priority

##### burn by approve. Low priority
```
like pseudocode:
function burn(uint256 tokenId)
    public
  {
    require(_isApprovedOrOwner(msg.sender, tokenId));
    _burn(ownerOf(tokenId), tokenId);
  }
current version:
function burn(uint256 tokenId)
    public
  {
    require(_isOwner(msg.sender, tokenId));
    _burn(ownerOf(tokenId), tokenId);
  }
```
[fixed] removed burn functionality, commit: `658e820a5b762900cdc456b85b2ac90438163be1`

##### tokenOfOwnerByIndex not implemented. Low priority/No issue
```
https://github.com/ethereum/EIPs/blob/master/EIPS/eip-721.md
The enumeration extension is OPTIONAL for ERC-721 smart contracts (see "caveats", below). This allows your contract to publish its full list of NFTs and make them discoverable.

tokenOfOwnerByIndex not implemented from this list
```
[fixed] skipped the implementation of this optional function after a team consensus.

##### Remove virtual in DynamicContribution. Low priority.
Ref: https://medium.com/upstate-interactive/solidity-override-vs-virtual-functions-c0a5dfb83aaf
A function that allows an inheriting contract to override its behavior will be marked at virtual. (c)
[fixed] removed redundant key words, commit: `658e820a5b762900cdc456b85b2ac90438163be1`

