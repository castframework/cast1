const {
  WhoamiFRO,
} = require('./queries/fro');
const {
  WhoamiFSO,
} = require('./queries/fso');
const { GraphQLClient } = require('graphql-request');
const bondToForge = require('./mock-bonds.json');
const { forgeBond } = require('./bond-creation');
require('dotenv').config();

const froEndpoint = `http://${process.env.FRO_ENDPOINT || 'localhost:6661/graphql'}`;
const fsoEndpoint = `http://${process.env.FSO_ENDPOINT || 'localhost:6663/graphql'}`;
const froClient = new GraphQLClient(froEndpoint);
const fsoClient = new GraphQLClient(fsoEndpoint);
const ledger = process.env.LEDGER || 'ETHEREUM';

async function main() {
  const froAddress = await froClient.request(WhoamiFRO, { ledger });
  const fsoAddress = await fsoClient.request(WhoamiFSO, { ledger });

  console.log('FRO Address:', froAddress.whoami);
  console.log('FSO Address:', fsoAddress.whoami);

  for (bond of bondToForge) {
    try {
      await forgeBond(froClient, froAddress.whoami, fsoClient, fsoAddress.whoami, ledger, bond);
    } catch (err) {
      if (err.response.errors[0].message.includes('Bond with this name already exists')) {
        console.error(`!! Bond ${bond.symbol} already exists`);
      } else {
        console.error(err);
      }
    }
  }

  console.log('All done !');
  process.exit();
}

main();
