import { find, ls } from 'shelljs';
import {
  GraphQLSchemaBuilderModule,
  GraphQLSchemaFactory,
} from '@nestjs/graphql';
import { NestFactory } from '@nestjs/core';
import { printSchema } from 'graphql';
import * as fs from 'fs';
import * as minimist from 'minimist';
import * as chalk from 'chalk';
import { Module } from '@nestjs/common';

const args = minimist(process.argv.slice(2));

if (!(args.o && args.i) || args.h) {
  showHelp();
  process.exit(-1);
}

const outSchemaDir = args.o;
const modulesPath = args.i;

ls(modulesPath).forEach((module) =>
  buildModuleFromPath(module, `${modulesPath}/${module}`)
    .then((mod) => {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      if (mod.resolvers.length > 0) generateSchema(mod, outSchemaDir);
      else logWarn(`🤔 Module ${mod.name} has no resolver. Skipping...`);
    })
    .catch((err) => {
      logError(`💥 Error while generating schema for module : ${module}`);
      console.error(module, err);
    }),
);

interface Module {
  name: string;
  // eslint-disable-next-line @typescript-eslint/ban-types
  resolvers: Function[];
}
interface FunctionMap {
  // eslint-disable-next-line @typescript-eslint/ban-types
  [key: string]: Function;
}

async function buildModuleFromPath(
  moduleName: string,
  modulePath: string,
): Promise<Module> {
  log(`🔎 Module ${moduleName} found`);

  const resolvers = find(modulePath)
    .filter((file) => file.match(/\.resolver\.ts$/))
    .map((file) => import(`./${file}`));

  const fxoRegex = /^f[^x]o$/; // Will match fro, fio, fso but not fxo

  if (moduleName.match(fxoRegex)) {
    log(`🔎 Adding fxo, swift and position resolver for ${moduleName}`);
    resolvers.push(import('./src/modules/fxo/fxo.resolver'));
    resolvers.push(import('./src/modules/fxo/position/position.resolver'));
  }

  return Promise.all(resolvers).then((res) => ({
    name: moduleName,
    resolvers: flatImport(res),
  }));
}

async function generateSchema(module: Module, outDir: string): Promise<void> {
  const outFilePath = `${outDir}/${module.name}.graphql`;

  log(`🛠 Generating SDL for module ${module.name} in file "${outFilePath}"`);

  const app = await NestFactory.create(GraphQLSchemaBuilderModule, {
    logger: false,
  });
  await app.init();

  try {
    const gqlSchemaFactory = app.get(GraphQLSchemaFactory);
    const schema = await gqlSchemaFactory.create(module.resolvers);
    const schemaString = printSchema(schema);

    fs.writeFileSync(outFilePath, schemaString);

    log(`🎊 Module ${module.name} done !`);
  } catch (err) {
    logError(`💥 Error in module ${module.name}`);
    console.error(err);
  }
}

// eslint-disable-next-line @typescript-eslint/ban-types
function flatImport(res: FunctionMap[]): Function[] {
  return res.reduce((acc, val) => [...acc, ...Object.values(val)], []);
}

function showHelp(): void {
  console.log(`Generate GraphQL SDL from nestJS resolver
    -i : path to modules folder
    -o : output folder
    -h : show this help
  `);
}

function log(message: string): void {
  console.log(chalk.green(message));
}

function logWarn(message: string): void {
  console.log(chalk.yellow(message));
}

function logError(message: string): void {
  console.log(chalk.red(message));
}
