const {
  WhoamiFRO,
} = require('./queries/fro');
const {
  WhoamiFSO,
} = require('./queries/fso');
const { GraphQLClient } = require('graphql-request');
const toCreate = require('./data.json');
const {bondCreation} = require('./bond-creation');

const froEndpoint = 'http://localhost:6661/graphql';
const fsoEndpoint = 'http://localhost:6663/graphql';
const froClient = new GraphQLClient(froEndpoint);
const fsoClient = new GraphQLClient(fsoEndpoint);
const ledger = 'ETHEREUM';

async function main() {
  const froAddress = await froClient.request(WhoamiFRO, { ledger });
  const fsoAddress = await fsoClient.request(WhoamiFSO, { ledger });

  console.log('FRO Address:', froAddress.whoami);
  console.log('FSO Address:', fsoAddress.whoami);

  for (bond of toCreate) {
    await bondCreation(froClient, froAddress.whoami, fsoClient, fsoAddress.whoami, ledger, bond);
  }

  console.log('All done !');
  process.exit();
}

main();
