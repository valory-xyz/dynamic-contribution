/*global describe, context, beforeEach, it*/

const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("DelegateContribute", function () {
    let delegateContribute;
    let wveOLASMock;
    let signers;

    beforeEach(async function () {
        // Deploy the mock for IWVEOLAS interface
        const WVEOLASMock = await ethers.getContractFactory("WVEOLASMock");
        wveOLASMock = await WVEOLASMock.deploy();
        await wveOLASMock.deployed();

        // Deploy the DelegateContribute contract
        const DelegateContribute = await ethers.getContractFactory("DelegateContribute");
        delegateContribute = await DelegateContribute.deploy(wveOLASMock.address);
        await delegateContribute.deployed();

        signers = await ethers.getSigners();

        // Setup mock balances and votes before testing delegation
        await wveOLASMock.setBalance(signers[1].address, 100); // Set balance for the delegator
        await wveOLASMock.setVotes(signers[1].address, 50); // Set votes for the delegator
        await wveOLASMock.setBalance(signers[2].address, 100); // Set balance for the delegator
        await wveOLASMock.setVotes(signers[2].address, 50); // Set votes for the delegator
    });

    context("Delegation functionality", async function () {
        it("Delegate from one account to another", async function () {
            // Assuming the setup for balance and votes is done in the mock
            const delegator = signers[1];
            const delegatee = signers[2];
            
            // Delegate
            await delegateContribute.connect(delegator).delegate(delegatee.address);
            
            // Check delegation
            expect(await delegateContribute.mapDelegation(delegator.address)).to.equal(delegatee.address);
        });

        it("Redelegation to a different delegatee", async function () {
            const delegator = signers[1];
            const firstDelegatee = signers[2];
            const secondDelegatee = signers[3];

            // First delegation
            await delegateContribute.connect(delegator).delegate(firstDelegatee.address);

            // Redelegate
            await delegateContribute.connect(delegator).delegate(secondDelegatee.address);

            // Check redelegation
            expect(await delegateContribute.mapDelegation(delegator.address)).to.equal(secondDelegatee.address);
        });

        it("Delegation to zero address (undelegation)", async function () {
            const delegator = signers[1];
            const delegatee = signers[2];
            const zeroAddress = ethers.constants.AddressZero;

            // Delegate
            await delegateContribute.connect(delegator).delegate(delegatee.address);

            // Undelegate
            await delegateContribute.connect(delegator).delegate(zeroAddress);

            // Check undelegation
            expect(await delegateContribute.mapDelegation(delegator.address)).to.equal(zeroAddress);
        });

        it("Voting power calculation after delegation", async function () {
            const delegator = signers[1];
            const delegatee = signers[2];

            // Delegate
            await delegateContribute.connect(delegator).delegate(delegatee.address);

            // Check voting power
            const totalVotingPower = await delegateContribute.votingPower(delegatee.address);
            expect(totalVotingPower).to.equal(100); // total vote of both delegator and delegatee
        });

        it("Delegatee lists are correctly managed", async function () {
            const [deployer, delegatorOne, delegatorTwo, delegateeOne, delegateeTwo] = signers;

            // Initially, delegate from two accounts to the same delegatee
            await delegateContribute.connect(delegatorOne).delegate(delegateeOne.address);
            let thing = await delegateContribute.mapDelegation(delegatorOne.address);
            await delegateContribute.connect(delegatorTwo).delegate(delegateeOne.address);

            // Check delegateeOne's list contains both delegators
            let delegateeOneList = await delegateContribute.getDelegatorList(delegateeOne.address);
            expect(delegateeOneList).to.include(delegatorOne.address);
            expect(delegateeOneList).to.include(delegatorTwo.address);
            
            // Redelegate from delegatorOne to another delegatee
            await delegateContribute.connect(delegatorOne).delegate(delegateeTwo.address);

            // Check delegateeOne's list no longer contains delegatorOne but still contains delegatorTwo
            delegateeOneList = await delegateContribute.getDelegatorList(delegateeOne.address);
            expect(delegateeOneList).to.not.include(delegatorOne.address);
            expect(delegateeOneList).to.include(delegatorTwo.address);

            // Check delegateeTwo's list now contains delegatorOne
            const delegateeTwoList = await delegateContribute.getDelegatorList(delegateeTwo.address);
            expect(delegateeTwoList).to.include(delegatorOne.address);

            // Undelegate delegatorTwo by delegating to the zero address
            await delegateContribute.connect(delegatorTwo).delegate(ethers.constants.AddressZero);

            // Check delegateeOne's list no longer contains delegatorTwo
            delegateeOneList = await delegateContribute.getDelegatorList(delegateeOne.address);
            expect(delegateeOneList).to.not.include(delegatorTwo.address);
        });

        it("should revert with NoBalance error when delegator has no balance", async function () {
            const [delegator, delegatee] = signers;

            // Ensure the delegator has zero balance in the mock
            await wveOLASMock.setBalance(delegator.address, 0);

            // Attempt to delegate and expect a revert with the NoBalance error
            await expect(delegateContribute.connect(delegator).delegate(delegatee.address)).to.be.revertedWith("NoBalance");
        });

        it("should revert with NoSelfDelegation error when delegator tries to delegate to themselves", async function () {
            const delegator = signers[0];

            // Attempt to delegate to oneself and expect a revert with the NoSelfDelegation error
            await expect(delegateContribute.connect(delegator).delegate(delegator.address))
                .to.be.revertedWith("NoSelfDelegation");
        });

        // Add more tests as needed for edge cases and error conditions
    });

    // Additional contexts for other functionalities and error handling
});