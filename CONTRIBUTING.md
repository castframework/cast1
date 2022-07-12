**Contributing to the CAST Framework**

[[_TOC_]]

## 1. Overview

This repository has the following packages:

| [cast-interface-v1](./packages/cast/cast-interface-v1) | Abstract blockchain interface |
| [cast-eth-v1](./packages/cast/cast-eth-v1) | Ethereum smart contracts and deploy mechanic (Solidity) |
| [cast-tz-v1](./packages/cast/cast-tz-v1) | Tezos smart contracts and deploy mechanic (SmartPy) |
| [models](./packages/cast/models) | Definition of the data models |
| [chain-auth](./packages/cast/chain-auth) | Authentication with blockchain addresses |
| [oracles](./packages/cast/oracles) | GraphQL blockchain adapters (transaction publication, event reporting) |
| [oracle-clients](./packages/cast/oracle-clients) | TypeScript client libraries for Oracles |

## 2. Development Methodology

1. Create a new branch sourced from the `main` branch.
2. Check out the development best practices before making changes.
2. Make the changes, always being sure to follow the git best practices.
4. Push the changes to the corresponding new branch at the remote GitHub repository.
5. Open a Pull Request, following the Pull Request template.

## 3. Best Practices

### Development

- [NVM][https://github.com/nvm-sh/nvm] is configured to handle NodeJS veresions, `nvm use` at the project root gets the correct version
- [Prettier][prettier] is configured to handle code formatting
- [TypeScript][ts] is required, JavaScript contributions will not be accepted
- Tests are included for all packages, excluding `models`. Changes must include the corresponding tests.

### Git

- Every commit should be formatted following the  [conventional commits](https://www.conventionalcommits.org/en/v1.0.0/#summary) guidelines
- Every branch merged to `main` should have a reasonable number of commits, ideally 1 (use rebase)
- No commit should be made directly on the `main` branch.

[cc]: https://www.conventionalcommits.org/
[nvm]: https://github.com/nvm-sh/nvm
[prettier]: https://prettier.io/
[ts]: https://www.typescriptlang.org/