/*global process*/

const { ethers } = require("hardhat");
const { LedgerSigner } = require("@anders-t/ethers-ledger");

async function main() {
    const fs = require("fs");
    const globalsFile = "globals.json";
    const dataFromJSON = fs.readFileSync(globalsFile, "utf8");
    let parsedData = JSON.parse(dataFromJSON);
    const useLedger = parsedData.useLedger;
    const derivationPath = parsedData.derivationPath;
    const providerName = parsedData.providerName;
    const gasPriceInGwei = parsedData.gasPriceInGwei;
    let EOA;

    const provider = await ethers.providers.getDefaultProvider(providerName);
    const signers = await ethers.getSigners();

    if (useLedger) {
        EOA = new LedgerSigner(provider, derivationPath);
    } else {
        EOA = signers[0];
    }
    // EOA address
    const deployer = await EOA.getAddress();
    console.log("EOA is:", deployer);

    // Transaction signing and execution
    console.log("16. EOA to deploy DelegateContribute");
    const gasPrice = ethers.utils.parseUnits(gasPriceInGwei, "gwei");
    const DelegateContribute = await ethers.getContractFactory("DelegateContribute");
    console.log("You are signing the following transaction: DelegateContribute.connect(EOA).deploy()");
    const delegateContribute = await DelegateContribute.connect(EOA).deploy(parsedData.wveOLAS, { gasPrice });
    const result = await delegateContribute.deployed();

    // Wait for a minute on goerli
    if (providerName == "goerli") {
        await new Promise(r => setTimeout(r, 60000));
    }

    // Transaction details
    console.log("Contract deployment: DelegateContribute");
    console.log("Contract address:", delegateContribute.address);
    console.log("Transaction:", result.deployTransaction.hash);

    // Contract verification
    if (parsedData.contractVerification) {
        const execSync = require("child_process").execSync;
        execSync("npx hardhat verify --constructor-args scripts/deployment/verify_delegate_contribute.js --network " + providerName + " " + delegateContribute.address, { encoding: "utf-8" });
    }

    // Writing updated parameters back to the JSON file
    parsedData.delegateContributeAddress = delegateContribute.address;
    fs.writeFileSync(globalsFile, JSON.stringify(parsedData));
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
