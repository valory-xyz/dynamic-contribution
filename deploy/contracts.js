/*global ethers*/

const { expect } = require("chai");

module.exports = async () => {
    const signers = await ethers.getSigners();
    const deployer = signers[0];

    console.log("Deploying contracts with the account:", deployer.address);
    console.log("Account balance:", (await deployer.getBalance()).toString());

    const DynamicContribution = await ethers.getContractFactory("DynamicContribution");
    const dynamicContribution = await DynamicContribution.deploy("DynamicContribution", "DC", "https://pfp.autonolas.network/");
    await dynamicContribution.deployed();

    console.log("==========================================");
    console.log("DynamicContribution deployed to:", dynamicContribution.address);
    console.log("==========================================");

    // Mint some NFTs
    const numMints = 10;
    for (let i = 0; i < numMints; i++) {
        const minterIndex = 9 + i;
        const tokenId = await dynamicContribution.connect(signers[minterIndex]).callStatic.mint();
        await dynamicContribution.connect(signers[minterIndex]).mint();
        console.log("DynamicContribution NFT", Number(tokenId), "minted to:", signers[minterIndex].address);
    }

    // Writing the JSON with the initial deployment data
    let initDeployJSON = {
        "dynamicContribution": dynamicContribution.address
    };

    // Write the json file with the setup
    const fs = require("fs");
    const initDeployFile = "initDeploy.json";
    fs.writeFileSync(initDeployFile, JSON.stringify(initDeployJSON));
};
