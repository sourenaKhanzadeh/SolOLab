#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const solc = require('solc');
const Web3 = require('web3');
const faker = require('faker');
const commander = require('commander');
const { main } = require('./compare_gas');
const exec = require('child_process').exec;

const compareContracts = async () => {
    const contractName1 = commander.args[1];
    const contractName2 = commander.args[2];
    const compileOutput = exec("npx hardhat compile");
    console.log(compileOutput.toString());
    await main(contractName1, contractName2);
    console.log('Done');
}


// commander
//     .command('compile <inputFile>')
//     .description('Compile a Solidity file')
//     .action(compile);
//
// commander
//     .command('deploy <inputFile> <contractName>')
//     .description('Deploy a contract to the Ethereum network')
//     .action(deploy);
//
// commander
//     .command('estimate-gas <inputFile> <contractName> <functionName> [args...]')
//     .description('Estimate gas consumption for a specific contract function')
//     .action(estimateGas);

commander
    .command('compare <contractName1> <contractName2>')
    .description('Compare gas estimates of two contract files')
    .action(compareContracts);


commander.parse(process.argv);
