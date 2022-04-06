<div align="center">
  <img src="https://www.cast-framework.com/wp-content/themes/forge-framework/img/logo-cast-w.svg" alt="drawing" width="200"/>
</div>

# Description

The Forge platform is composed of market standards designed for digital blockchain-based securities. We aspire to promote innovation in capital markets with a set of open standards and technologies anyone can use to develop mutually compatible and interoperable digital financial services.


The Forge platform enables the creation of an integrated financial ecosystem across blockchain-native and legacy systems. It is intended to give issuers, investors, financial institutions and other service providers easy, trustworthy and seamless access to the developing market of tokenized securities. Minimizing integration risk will give actors throughout the financial industry the ability to transition to a new model for financial markets without prohibitive cost overheads.

This is done via the [Oracles](./packages/cast/oracles/) in the Cast Framework. Oracles are entities which communicated with the blockchain.

# Packages

See [packages documentation](./packages/cast)

# Run

## Requirements

- Fairly recent Linux (or Mac, or Windows with WSL) distribution
- [docker](https://docs.docker.com/get-docker/)
- [docker-compose](https://docs.docker.com/compose/install/)
- [nvm](https://github.com/nvm-sh/nvm#installing-and-updating)
- build-essential (apt-get install build-essential)

## Local Install

```shell
git clone git@github.com:castframework/cast1.git
cd forge-platform
make init
make start
```

The `init` script compiles the different packages and hoists the dependencies to the root of the project.
The `start` script generates an address for Ganache to use and launches Ganache and Flextesa, the local blockchain simulators for Ethereum and Tezos, respectively. It then migrates the Forge Smart Contracts and performs initial transfers in order to set up a basic environment with the necessary entities and funds (settler, issuer, registrar, investor). The docker containers for the CAST Framework are then launched.

## CAST Oracle Tutorial

Once the local environmente has been launched, the tutorial can be accessed at:
- [http://localhost:8000/](http://localhost:8000/).

# Developing an Application with CAST Oracles

With the local environment started, developments can be made which communicate with the Oracles:
- [FIO](http://localhost:6664/graphql)
- [FRO](http://localhost:6661/graphql) 
- [FSO](http://localhost:6663/graphql) 

. The GraphQL Playgrounds can be used not only as testing environments, but also for documentation on the list of queries, mutations, types, and schema available for each Oracle.
You can use the schema and URL to connect your GraphQL client to an Oracle.

# Developing an Application with Smart Contracts

Ethereum Smart Contracts are written in [Solidity](https://docs.soliditylang.org/en/v0.8.13/). Tezos Smart Contracts are written in [SmartPy](https://smartpy.io/).
Each blockchain has its own development process:

- [Ethereum](./packages/cast/cast-eth-v1/)
- [Tezos](./packages/cast/cast-tz-v1/)

# Developing Infrastructure Functionality (BlockChain Driver)

See [https://github.com/castframework/gba](https://github.com/castframework/gba).

# Deploy on Other Networks (Testnet/Mainnet)

In order to run the CAST framework on a different network, a new folder needs to be created in [networks](./networks/). This folder should imitate the other configurations found in this location, such as that of the local network. Namely, it should have a folder per blockchain, each with the following files:

- `coinbase.json`: private key of issuer which should have sufficient funds to performs its functions
- `keys.json`: private keys for various roles (issuer, investor, settler, registrar)
- `node.json`: network configuration parameters

# Troubleshooting

- When running a local environment, a `make stop` will remove all running containers and prepare the local environment for a new `make start` command.
- Always be sure that the correct `NETWORK_FOLDER` argument is being passed to each script, especially if this has been changed from the local default folder.

# License

Apache 2.0
