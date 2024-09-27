const catchAsync = require('../utils/catchAsync');
const { ethers } = require('ethers');
const contractABI = require('../ABI/contractABI');
const walletAddress = process.env.WALLET_ADDRESS;
const providerUrl = process.env.ETHEREUM_PROVIDER_URL;

exports.setUserInfo = catchAsync(async (req, res, next) => {
    const { name, phone } = req.body; // Assuming the user submits name and phone in the request body

    const provider = new ethers.JsonRpcProvider(providerUrl);
    const privateKey = process.env.WALLET_PRIVATE_KEY;
    const wallet = new ethers.Wallet(privateKey, provider);

    const contractAddress = process.env.CONTRACT_ADDRESS;
    const contract = new ethers.Contract(contractAddress, contractABI, wallet);

    // Sending transaction to the setUserInfo function of the contract
    const tx = await contract.setUserInfo(walletAddress, name, phone);

    // Wait for the transaction to be mined
    await tx.wait();

    res.status(200).json({ message: 'User info updated', transaction: tx });
});

// Get user information from the blockchain
exports.getUserInfo = catchAsync(async (req, res, next) => {
    const provider = new ethers.JsonRpcProvider(providerUrl);
    const contractAddress = process.env.CONTRACT_ADDRESS;
    const contract = new ethers.Contract(
        contractAddress,
        contractABI,
        provider
    );

    // Calling the getUserInfo function of the contract
    const userInfo = await contract.getUserInfo();

    res.status(200).json({
        walletAddress: userInfo[0],
        name: userInfo[1],
        phone: userInfo[2],
    });
});

exports.createContract = catchAsync(async (req, res, next) => {
    const provider = new ethers.JsonRpcProvider(providerUrl);
    const privateKey = process.env.WALLET_PRIVATE_KEY;

    const wallet = new ethers.Wallet(privateKey, provider);

    const contractAddress = process.env.CONTRACT_ADDRESS;
    console.log(contractABI);

    const contract = new ethers.Contract(contractAddress, contractABI, wallet);
    const amount = ethers.parseEther('0.1');
    const tx = contract.createContract(
        '0xc7bcf71ebf81ed240a26f55b85380c372560f441',
        amount,
        { value: amount }
    );
    tx.wait();
    res.status(200).json({ message: 'Contract created', transaction: tx });
});

exports.getContracts = catchAsync(async (req, res, next) => {
    // get all contracts
});

exports.getAllContracts = catchAsync(async (req, res, next) => {
    // get all contracts of the freelancer or client
});

exports.getContract = catchAsync(async (req, res, next) => {
    // get the contract details
});

exports.updateContractStatus = catchAsync(async (req, res, next) => {});

exports.getClientContracts = catchAsync(async (req, res, next) => {
    // get all contracts of the client
});

exports.getFreelancerContracts = catchAsync(async (req, res, next) => {
    // get all contracts of the freelancer
});
