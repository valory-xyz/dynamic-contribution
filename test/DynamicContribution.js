/*global describe, context, beforeEach, it*/

const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("DynamicContribution", function () {
    let dynamicContribution;
    let reentrancyAttacker;
    let signers;
    let deployer;
    const AddressZero = "0x" + "0".repeat(40);

    beforeEach(async function () {
        const DynamicContribution = await ethers.getContractFactory("DynamicContribution");
        dynamicContribution = await DynamicContribution.deploy("DynamicContribution", "DC", "https://localhost/dynamicContribution/");
        await dynamicContribution.deployed();

        const ReentrancyAttacker = await ethers.getContractFactory("ReentrancyAttacker");
        reentrancyAttacker = await ReentrancyAttacker.deploy(dynamicContribution.address);
        await reentrancyAttacker.deployed();

        signers = await ethers.getSigners();
        deployer = signers[0];
    });

    context("Initialization", async function () {
        it("Checking for arguments passed to the constructor", async function () {
            expect(await dynamicContribution.name()).to.equal("DynamicContribution");
            expect(await dynamicContribution.symbol()).to.equal("DC");
            expect(await dynamicContribution.baseURI()).to.equal("https://localhost/dynamicContribution/");
        });

        it("Should fail when checking for the token id existence", async function () {
            const tokenId = 0;
            expect(await dynamicContribution.exists(tokenId)).to.equal(false);
        });

        it("Setting the base URI", async function () {
            await dynamicContribution.setBaseURI("https://localhost2/agent/");
            expect(await dynamicContribution.baseURI()).to.equal("https://localhost2/agent/");

            // Try to set base URI not by the contract owner
            await expect(
                dynamicContribution.connect(signers[1]).setBaseURI("")
            ).to.be.revertedWith("OwnerOnly");

            // Try to set the zero base URI
            await expect(
                dynamicContribution.connect(deployer).setBaseURI("")
            ).to.be.revertedWith("ZeroValue");
        });
        
        it("Changing owner", async function () {
            const account = signers[1];
            // Trying to change owner from a non-owner account address
            await expect(
                dynamicContribution.connect(account).changeOwner(account.address)
            ).to.be.revertedWith("OwnerOnly");

            // Trying to change owner for the zero address
            await expect(
                dynamicContribution.connect(deployer).changeOwner(AddressZero)
            ).to.be.revertedWith("ZeroAddress");

            // Changing the owner
            await dynamicContribution.connect(deployer).changeOwner(account.address);

            // Trying to change owner from the previous owner address
            await expect(
                dynamicContribution.connect(deployer).changeOwner(deployer.address)
            ).to.be.revertedWith("OwnerOnly");
        });

        it("Getting the token URI", async function () {
            const baseURI = "https://localhost/series/";
            await dynamicContribution.setBaseURI(baseURI);
            // Try to get the URI of a non-existent token
            await expect(
                dynamicContribution.tokenURI(1)
            ).to.be.revertedWith("WrongTokenId");
            // Mint two tokens
            await dynamicContribution.connect(deployer).mint();
            await dynamicContribution.connect(deployer).mint();
            expect(await dynamicContribution.tokenURI(1)).to.equal(baseURI + "1");
            expect(await dynamicContribution.tokenURI(2)).to.equal(baseURI + "2");
        });
    });

    context("Minting tokens", async function () {
        it("Token Id=1 after first successful first mint", async function () {
            const tokenId = 1;
            // Mint a token
            await dynamicContribution.connect(deployer).mint();
            expect(await dynamicContribution.balanceOf(deployer.address)).to.equal(1);
            // Check that the created token exists
            expect(await dynamicContribution.exists(tokenId)).to.equal(true);
            // Check for the existent token Id
            expect(await dynamicContribution.tokenByIndex(0)).to.equal(tokenId);
            // Try to check for the next token number
            await expect(
                dynamicContribution.tokenByIndex(1)
            ).to.be.revertedWith("Overflow");
        });

        it("Catching \"Transfer\" event log after successful creation of an agent", async function () {
            const tx = await dynamicContribution.connect(deployer).mint();
            const result = await tx.wait();
            expect(result.events[0].event).to.equal("Transfer");
        });
    });

    context("Minting tokens for a specific account", async function () {
        it("Token Id=1 after first successful first mint", async function () {
            const account = signers[1];
            const tokenId = 1;
            await dynamicContribution.connect(deployer).mintFor(account.address);
            expect(await dynamicContribution.balanceOf(account.address)).to.equal(1);
            expect(await dynamicContribution.exists(tokenId)).to.equal(true);
        });

        it("Catching \"Transfer\" event log after successful creation of an agent", async function () {
            const account = signers[1];
            const tx = await dynamicContribution.connect(deployer).mintFor(account.address);
            const result = await tx.wait();
            expect(result.events[0].event).to.equal("Transfer");
        });
    });

    context("Reentrancy attack", async function () {
        it("Reentrancy attack by the manager during the token mint", async function () {
            // Simulate the reentrancy attacks
            // For the mint function call
            await reentrancyAttacker.setAttackOnJustMint(true);
            await expect(
                reentrancyAttacker.badMint()
            ).to.be.revertedWith("ReentrancyGuard");
            // For the mintFor function call
            await reentrancyAttacker.setAttackOnJustMint(false);
            await expect(
                reentrancyAttacker.badMintFor()
            ).to.be.revertedWith("ReentrancyGuard");
        });
    });
});
