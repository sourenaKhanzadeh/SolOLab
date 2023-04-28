#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const solc = require('solc');
const Web3 = require('web3');
const faker = require('faker');
const commander = require('commander');

const web3 = new Web3('http://localhost:8545'); // Replace with your Ethereum node URL

const compile = (inputFile) => {
    // ... compile code from the previous example ...
};

const deploy = async (inputFile, contractName) => {
    const output = compile(inputFile);

    const bytecode = output.contracts[contractName].bytecode;
    const abi = output.contracts[contractName].interface;

    const accounts = await web3.eth.getAccounts();
    const myAccount = accounts[0];

    const myContract = new web3.eth.Contract(JSON.parse(abi));

    const gasEstimate = await myContract.deploy({ data: bytecode }).estimateGas();

    const contractInstance = await myContract.deploy({ data: bytecode })
        .send({
            from: myAccount,
            gas: gasEstimate,
        });

    console.log('Contract deployed at address:', contractInstance.options.address);
};

const estimateGas = async (inputFile, contractName, functionName, ...args) => {
    const output = compile(inputFile);

    const abi = output.contracts[contractName].interface;
    const contractAddress = '0x...'; // Use the deployed contract address

    const contractInstance = new web3.eth.Contract(JSON.parse(abi), contractAddress);

    const accounts = await web3.eth.getAccounts();
    const myAccount = accounts[0];

    const gasEstimate = await contractInstance.methods[functionName](...args)
        .estimateGas({ from: myAccount });

    console.log('Gas estimate:', gasEstimate);
};

commander
    .command('compile <inputFile>')
    .description('Compile a Solidity file')
    .action(compile);

commander
    .command('deploy <inputFile> <contractName>')
    .description('Deploy a contract to the Ethereum network')
    .action(deploy);

commander
    .command('estimate-gas <inputFile> <contractName> <functionName> [args...]')
    .description('Estimate gas consumption for a specific contract function')
    .action(estimateGas);

commander.parse(process.argv);
