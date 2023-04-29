#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const solc = require('solc');
const Web3 = require('web3');
const faker = require('faker');
const commander = require('commander');

const web3 = new Web3('http://0.0.0.0:8545'); // Replace with your Ethereum node URL
const web3Instance = new Web3(web3.currentProvider);

const compile = (inputFile) => {
    const source = fs.readFileSync(inputFile, 'utf8');

    const input = {
        language: 'Solidity',
        sources: {
            [path.basename(inputFile)]: {
                content: source,
            },
        },
        settings: {
            outputSelection: {
                '*': {
                    '*': ['*'],
                },
            },
        },
    };

    const output = JSON.parse(solc.compile(JSON.stringify(input)));
    return output;
};

const deploy = async (inputFile, contractName) => {
    const output = compile(inputFile);

    const bytecode = output.contracts[path.basename(inputFile)][contractName].evm.bytecode.object;
    const abi = JSON.parse(output.contracts[path.basename(inputFile)][contractName].metadata).output.abi;

    const accounts = await web3.eth.getAccounts();
    const myAccount = accounts[0];

    const myContract = new web3.eth.Contract(abi);

    const gasEstimate = await myContract.deploy({ data: bytecode }).estimateGas();

    const contractInstance = await myContract.deploy({ data: bytecode })
        .send({
            from: myAccount,
            gas: gasEstimate,
        });

    console.log('Contract deployed at address:', contractInstance.options.address);
    return contractInstance;
};

const estimateGas = async (inputFile, contractName, functionName, ...args) => {
    const output = compile(inputFile);

    const abi = output.contracts[contractName].interface;
    const contractAddress = '0x00000001'; // Use the deployed contract address

    const contractInstance = new web3.eth.Contract(JSON.parse(abi), contractAddress);

    const accounts = await web3.eth.getAccounts();
    const myAccount = accounts[0];

    const gasEstimate = await contractInstance.methods[functionName](...args)
        .estimateGas({ from: myAccount });

    console.log('Gas estimate:', gasEstimate);
};

const generateInputValue = (type) => {
    switch (type) {
        case 'uint256':
        case 'int256':
            return faker.datatype.number({ min: 0, max: 1e6 });
        case 'address':
            return faker.datatype.uuid();
        case 'bool':
            return faker.datatype.boolean();
        case 'string':
            return faker.random.words();
        default:
            throw new Error(`Unsupported data type: ${type}`);
    }
};
const compareContracts = async (contractFile1, contractFile2, contractName1, contractName2) => {
    const output1 = compile(contractFile1);
    const output2 = compile(contractFile2);

    const bytecode1 = output1.contracts[path.basename(contractFile1)][contractName1].evm.bytecode.object;
    const bytecode2 = output2.contracts[path.basename(contractFile2)][contractName2].evm.bytecode.object;

    const abi1 = JSON.parse(output1.contracts[path.basename(contractFile1)][contractName1].metadata).output.abi;
    const abi2 = JSON.parse(output2.contracts[path.basename(contractFile2)][contractName2].metadata).output.abi;

    const contract1 = deploy(contractFile1, contractName1)
    const contract2 = deploy(contractFile2, contractName2)

    const contract1Address = await contract1;
    const contract2Address = await contract2;

    const contractAddress1 = contract1Address.options.address; // Use the deployed contract address for contract 1
    const contractAddress2 = contract2Address.options.address; // Use the deployed contract address for contract 2

    const instance1 = new web3Instance.eth.Contract(abi1, contractAddress1);
    const instance2 = new web3Instance.eth.Contract(abi2, contractAddress2);

    const accounts = await web3.eth.getAccounts();
    const myAccount = accounts[0];

    for (const item1 of abi1) {
        if (item1.type !== 'function') continue;

        const item2 = abi2.find(item => item.name === item1.name && item.type === 'function');
        if (!item2) {
            console.log(`Function ${item1.name} not found in the second contract`);
            continue;
        }

        const inputs1 = item1.inputs;
        const inputs2 = item2.inputs;

        if (inputs1.length !== inputs2.length) {
            console.log(`Function ${item1.name} has different number of inputs in the two contracts`);
            continue;
        }

        const inputValues = inputs1.map(input => generateInputValue(input.type));

        const gasEstimate1 = await instance1.methods[item1.name](...inputValues)
            .estimateGas({ from: myAccount });
        const gasEstimate2 = await instance2.methods[item2.name](...inputValues)
            .estimateGas({ from: myAccount });

        console.log(`Gas estimate for ${item1.name}: Contract 1 = ${gasEstimate1}, Contract 2 = ${gasEstimate2}`);
    }
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

commander
    .command('compare <contractFile1> <contractFile2> <contractName1> <contractName2>')
    .description('Compare gas estimates of two contract files')
    .action(compareContracts);


commander.parse(process.argv);
