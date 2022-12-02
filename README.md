# Dynamic Contribution

## Introduction
This repository contains the Autonolas dynamic contribution contracts.

## Development

### Prerequisites
- Ensure you pull and initialise the submodules `git submodule update --init --recursive`
- This repository follows the standard [`Hardhat`](https://hardhat.org/tutorial/) development process.
- The code is written on Solidity `0.8.17`.
- The standard versions of Node.js along with Yarn are required to proceed further (confirmed to work with Yarn `1.22.19` and npx/npm `8.19.2` and node `v18.6.0`).

### Install the dependencies
The project has submodules to get the dependencies. Make sure to run `git clone --recursive` or init the submodules yourself.
The dependency list is managed by the `package.json` file,
and the setup parameters are stored in the `hardhat.config.js` file.
Simply run the following command to install the project:
```
yarn install
```

### Core components
The contracts and tests are located in the following folders respectively:
```
contracts
test
```

### Compile the code and run
Compile the code:
```
npx hardhat compile
```
Run the tests:
```
npx hardhat test
```

### Linters
- [`ESLint`](https://eslint.org) is used for JS code.
- [`solhint`](https://github.com/protofire/solhint) is used for Solidity linting.

### Github Workflows
The PR process is managed by github workflows, where the code undergoes
several steps in order to be verified. Those include:
- code installation
- running linters
- running tests

## Deployment
The deployment of contracts to the test- and main-net is split into step-by-step series of scripts for more control and checkpoint convenience.
The description of deployment procedure can be found here: [deployment](https://github.com/valory-xyz/dynamic-contribution/blob/main/scripts/deployment).

The finalized contract ABIs for deployment and their number of optimization passes are located here: [ABIs](https://github.com/valory-xyz/dynamic-contribution/blob/main/abis).

For testing purposes, the hardhat node deployment script is located [here](https://github.com/valory-xyz/dynamic-contribution/blob/main/deploy).

### Audits
The audit is provided as development matures. The latest audit report can be found here: [audits](https://github.com/valory-xyz/dynamic-contribution/blob/main/audits).

## Deployed Protocol
The list of addresses can be found [here](https://github.com/valory-xyz/dynamic-contribution/blob/main/docs/mainnet_addresses.json).

## Acknowledgements
The registries contracts were inspired and based on the following sources:
- [Rari-Capital](https://github.com/Rari-Capital/solmate). Last known audited version: `a9e3ea26a2dc73bfa87f0cb189687d029028e0c5`;
- [OpenZeppelin](https://github.com/OpenZeppelin/openzeppelin-contracts).
