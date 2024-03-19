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
        await wveOLASMock.setBalance(signers[2].address, 200); // Set balance for the delegator
        await wveOLASMock.setVotes(signers[2].address, 100); // Set votes for the delegator
        await wveOLASMock.setBalance(signers[3].address, 300); // Set balance for the delegator
        await wveOLASMock.setVotes(signers[3].address, 150); // Set votes for the delegator
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

            // Check that the delegator is no longer in the delegatee's list
            const delegatorList = await delegateContribute.getDelegatorList(delegatee.address);
            expect(delegatorList).to.not.include(delegator.address);
        });

        
        it("Voting power calculation without delegation", async function () {
            const delegator = signers[1];

            // Check voting power
            const totalVotingPower = await delegateContribute.votingPower(delegator.address);
            expect(totalVotingPower).to.equal(50);
        });

        it("Voting power calculation after delegation", async function () {
            const delegator = signers[1];
            const delegatee = signers[2];

            // Delegate
            await delegateContribute.connect(delegator).delegate(delegatee.address);

            // Check voting power
            const totalVotingPower = await delegateContribute.votingPower(delegatee.address);
            expect(totalVotingPower).to.equal(150); // total vote of both delegator and delegatee
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

        it("should revert when a delegator tries to delegate to the same delegatee multiple times", async function () {
            const [delegator, delegatee] = signers;

            // Set a non-zero balance for the delegator in the mock contract to bypass the NoBalance check
            await wveOLASMock.setBalance(delegator.address, ethers.utils.parseEther("1"));

            // Delegate once from the delegator to the delegatee
            await delegateContribute.connect(delegator).delegate(delegatee.address);

            // Attempt to delegate again to the same delegatee and expect a revert with the new error
            await expect(delegateContribute.connect(delegator).delegate(delegatee.address))
                .to.be.revertedWith("AlreadyDelegatedToSameDelegatee");
        });

        it("should emit a Delegation event upon successful delegation", async function () {
            const [delegator, delegatee] = signers;
            await wveOLASMock.setBalance(delegator.address, 100);

            await expect(delegateContribute.connect(delegator).delegate(delegatee.address))
                .to.emit(delegateContribute, 'Delegation')
                .withArgs(delegator.address, delegatee.address);
        });

        it("should handle multiple redelegations correctly", async function () {
            const [delegator, delegatee1, delegatee2, delegatee3] = signers;

            // Set balance for the delegator
            await wveOLASMock.setBalance(delegator.address, 100);

            // Delegate to the first delegatee
            await delegateContribute.connect(delegator).delegate(delegatee1.address);

            // Redelegate to the second delegatee
            await delegateContribute.connect(delegator).delegate(delegatee2.address);

            // Redelegate to the third delegatee
            await delegateContribute.connect(delegator).delegate(delegatee3.address);

            // Check final delegation
            expect(await delegateContribute.mapDelegation(delegator.address)).to.equal(delegatee3.address);
        });

        it("should calculate voting power correctly in a delegation chain (only power from direct delegation)", async function () {
            const [delegator, delegatee1, delegatee2, delegatee3] = signers;

            // Delegatee1 delegates to Delegatee2
            await delegateContribute.connect(delegatee1).delegate(delegatee2.address);

            // Delegatee2 delegates to Delegatee3
            await delegateContribute.connect(delegatee2).delegate(delegatee3.address);

            // Check voting power of Delegatee2
            let totalVotingPower = await delegateContribute.votingPower(delegatee2.address);
            expect(totalVotingPower).to.equal(50); // 50 (Delegatee1)

            // Check voting power of Delegatee3
            totalVotingPower = await delegateContribute.votingPower(delegatee3.address);
            expect(totalVotingPower).to.equal(250); // 100 (Delegatee2) + 150 (Delegatee3)
        });

        it("should handle a large number of delegators to a single delegatee", async function () {
            const delegatee = signers[0];
            const numDelegators = 10;

            // Set balance and votes for each delegator and delegate to the same delegatee
            for (let i = 1; i <= numDelegators; i++) {
                const delegator = signers[i];
                await wveOLASMock.setBalance(delegator.address, 100);
                await delegateContribute.connect(delegator).delegate(delegatee.address);
            }

            // Check the delegator list for the delegatee
            const delegatorList = await delegateContribute.getDelegatorList(delegatee.address);
            expect(delegatorList.length).to.equal(numDelegators);
        });

        // Add more tests as needed for edge cases and error conditions
    });

    // Additional contexts for other functionalities and error handling
});