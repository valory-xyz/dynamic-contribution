# Deployment scripts
This folder contains the scripts to deploy Autonolas dynamic contribution.

## Observations
- There are several files with global parameters based on the corresponding network. In order to work with the configuration, please copy `gobals_network.json` file to file the `gobals.json` one, where `network` is the corresponding network. For example: `cp gobals_goerli.json gobals.json`.
- Please note: if you encounter the `Unknown Error 0x6b0c`, then it is likely because the ledger is not connected or logged in.

## Steps to engage
Make sure the project is installed with the
```
yarn install
```
command and compiled with the
```
npx hardhat compile
```
command as described in the [main readme](https://github.com/valory-xyz/dynamic-contribution/blob/main/README.md).


Create a `globals.json` file in the root folder, or copy it from the file with pre-defined parameters (i.e., `scripts/deployment/globals_goerli.json` for the goerli testnet).

Parameters of the `globals.json` file:
- `contractVerification`: a flag for verifying contracts in deployment scripts (`true`) or skipping it (`false`);
- `useLedger`: a flag whether to use the hardware wallet (`true`) or proceed with the seed-phrase accounts (`false`);
- `derivationPath`: a string with the derivation path;
- `providerName`: a network type (see `hardhat.config.js` for the network configurations).

Other values in the `JSON` file are related to the ERC721 constructor. The deployed contract addresses will be added / updated during the scripts run.

To run the script, use the following command:
`npx hardhat run scripts/deployment/script_name --network network_type`,
where `script_name` is a script name, i.e. `deploy_dynamic_contribution.js`, `network_type` is a network type corresponding to the `hardhat.config.js` network configuration.

## Validity checks and contract verification
Each script controls the obtained values by checking them against the expected ones. Also, each script has a contract verification procedure.
If a contract is deployed with arguments, these arguments are taken from the corresponding `verify__name` file, where `name` corresponds to the deployment script name.





