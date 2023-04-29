const hre = require("hardhat");
const ethers = hre.ethers;
const faker = require("faker");
const fs = require("fs");
const { solidity } = require("ethereum-waffle");

async function main(...args) {
    const [deployer] = await hre.ethers.getSigners();

    console.log("Deploying contracts with the account:", deployer.address);

    const contracts = [...args]; // List of your contract names

    for (const contractName of contracts) {
        const ContractFactory = await hre.ethers.getContractFactory(contractName);
        const constructorParams = ContractFactory.interface.deploy.inputs;

        const randomArgs = constructorParams.map((param) => {
            switch (param.type) {
                case "uint256":
                case "int256":
                    return faker.datatype.number({ min: 0, max: 1e6 });
                case "address":
                    return deployer.address;
                case "bool":
                    return faker.datatype.boolean();
                case "string":
                    return faker.random.words();
                default:
                    throw new Error(`Unsupported data type: ${param.type}`);
            }
        });
        console.log(`Deploying contract ${contractName} with arguments:`, randomArgs);

        const contractInstance = await ContractFactory.deploy(...randomArgs);
        await contractInstance.deployed();

        console.log(`${contractName} deployed at address:`, contractInstance.address);

        // if adress path does not exist, create it
        if (!fs.existsSync(`${__dirname}/addresses`)) {
            fs.mkdirSync(`${__dirname}/addresses`);
        }
        // Save contract address to a JSON file
        const addressPath = `${__dirname}/addresses/${contractName}.json`;
        fs.writeFileSync(addressPath, JSON.stringify({ address: contractInstance.address }));

        iface1 = new ethers.utils.Interface(ContractFactory.interface.format("json"));
        iface2 = new ethers.utils.Interface(ContractFactory.interface.format("json"));

        for (const item1 of iface1.fragments) {
            if (item1.type !== "function") continue;

            const item2 = iface2.getFunction(item1.name);
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

            const gasEstimate1 = await contractInstance.estimateGas[item1.name](...inputValues);
            // const gasEstimate2 = await contracts[1].estimateGas[item2.name](...inputValues);

            console.log(`Gas estimate for ${item1.name}: Contract ${contractName} = ${gasEstimate1}`);
        }
    }

}

function generateInputValue(type) {
    switch (type) {
        case "uint256":
        case "int256":
            return faker.datatype.number({ min: 0, max: 1e6 });
        case "address":
            return faker.datatype.uuid();
        case "bool":
            return faker.datatype.boolean();
        case "string":
            return faker.random.words();
        default:
            throw new Error(`Unsupported data type: ${type}`);
    }
}

// main()
//     .then(() => process.exit(0))
//     .catch((error) => {
//         console.error(error);
//         process.exit(1);
//     });
module.exports = {
    main
}