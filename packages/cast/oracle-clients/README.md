# Forge Oracle

NodeJS Oracle to interact with Forge Smart Contracts on Blockchains. Only Ethereum is supported at the moment.  
It can:
- Listen to blockchain events
- Send transactions to blockchain  

This project leverage the power of [NestJS](https://docs.nestjs.com/) to expose a [GraphQL](https://graphql.org/) API to communicate with Blockchains.

## Folder structure

```
.
├── src
│    ├── modules
│    │   ├── fio 
│    │   ├── fmo
│    │   ├── fro
│    │   ├── fso
│    │   └── str
│    ├── shared         Code shared between all modules
│    └── utils          Utility code
└── test
    └── unit             Unit tests

```


## Run locally

```shell script
docker-compose -f docker-compose.dev.yml up -d
```

Note: If you modify dependencies, you may have to re-build the Docker image: 
```
docker-compose -f docker-compose.dev.yml build
```
