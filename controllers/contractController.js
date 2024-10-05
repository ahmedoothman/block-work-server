const User = require('../model/userModel');
const jobPost = require('../model/jobPostModel');
const proposal = require('../model/proposalModel');
const walletController = require('./walletController');
const catchAsync = require('../utils/catchAsync');
const { ethers } = require('ethers');
const freelancerContractABI = require('../ABI/freelancerContractABI.json');
const providerUrl = process.env.ETHEREUM_PROVIDER_URL;

exports.createContract = catchAsync(async (req, res, next) => {
    const clientId = req.user._id;
    const { freelancerId, jobID, amount, duration, status } = req.body;

    const provider = new ethers.JsonRpcProvider(providerUrl);
    const privateKey = process.env.WALLET_PRIVATE_KEY;

    const wallet = new ethers.Wallet(privateKey, provider);

    const contractAddress = process.env.FREELANCER_CONTRACT_ADDRESS;

    const contract = new ethers.Contract(
        contractAddress,
        freelancerContractABI,
        wallet
    );

    const tx = await contract.createContract(
        clientId.toString(),
        freelancerId.toString(),
        jobID.toString(),
        +amount,
        +duration
    );

    const receipt = await tx.wait();

    // get the job post and client and freelancer
    const job = await jobPost.findById(jobID);
    const client = await User.findById(clientId);
    const freelancer = await User.findById(freelancerId);
    res.status(201).json({
        status: 'success',
        data: {
            client: client,
            freelancer: freelancer,
            job: job,
            amount: amount.toString(),
            duration: duration.toString(),
            status,
            transactionHash: receipt.transactionHash,
        },
    });
});

exports.createContractUtility = async (data) => {
    const provider = new ethers.JsonRpcProvider(providerUrl);
    const privateKey = process.env.WALLET_PRIVATE_KEY;

    const wallet = new ethers.Wallet(privateKey, provider);

    const contractAddress = process.env.FREELANCER_CONTRACT_ADDRESS;

    const contract = new ethers.Contract(
        contractAddress,
        freelancerContractABI,
        wallet
    );

    const tx = await contract.createContract(
        data.clientId.toString(),
        data.freelancerId.toString(),
        data.jobID.toString(),
        +data.amount,
        +data.duration
    );

    const receipt = await tx.wait();
    return {
        status: 'success',
    };
};

exports.getAllContracts = catchAsync(async (req, res, next) => {
    const provider = new ethers.JsonRpcProvider(providerUrl);
    const contractAddress = process.env.FREELANCER_CONTRACT_ADDRESS;
    const contract = new ethers.Contract(
        contractAddress,
        freelancerContractABI,
        provider
    );

    const contracts = await contract.getAllContracts();
    const formattedContracts = await Promise.all(
        contracts.map(async (contract) => {
            const client = await User.findById(contract[0]);
            const freelancer = await User.findById(contract[1]);
            const job = await jobPost.findById(contract[2]);
            return {
                amount: contract[3].toString(),
                createdDate: new Date(+contract[4].toString() * 1000),
                duration: contract[5].toString(),
                status: contract[6].toString(),
                client,
                freelancer,
                job,
            };
        })
    );

    res.status(200).json({
        status: 'success',
        data: formattedContracts,
    });
});

exports.getFreelancerContracts = catchAsync(async (req, res, next) => {
    const provider = new ethers.JsonRpcProvider(providerUrl);
    const contractAddress = process.env.FREELANCER_CONTRACT_ADDRESS;
    const contract = new ethers.Contract(
        contractAddress,
        freelancerContractABI,
        provider
    );

    const freelancerId = req.user._id;
    const contracts = await contract.getContractsByFreelancerID(
        freelancerId.toString()
    );

    const formattedContracts = await Promise.all(
        contracts.map(async (contract) => {
            const client = await User.findById(contract[0]);
            const freelancer = await User.findById(contract[1]);
            const job = await jobPost.findById(contract[2]);

            return {
                amount: contract[3].toString(),
                createdDate: new Date(+contract[4].toString() * 1000),
                duration: contract[5].toString(),
                status: contract[6].toString(),
                client,
                freelancer,
                job,
            };
        })
    );

    res.status(200).json({
        status: 'success',
        data: formattedContracts,
    });
});

exports.getClientContracts = catchAsync(async (req, res, next) => {
    const provider = new ethers.JsonRpcProvider(providerUrl);
    const contractAddress = process.env.FREELANCER_CONTRACT_ADDRESS;
    const contract = new ethers.Contract(
        contractAddress,
        freelancerContractABI,
        provider
    );

    const clientId = req.user._id;
    const contracts = await contract.getContractsByClientID(
        clientId.toString()
    );

    const formattedContracts = await Promise.all(
        contracts.map(async (contract) => {
            const client = await User.findById(contract[0]);
            const freelancer = await User.findById(contract[1]);
            const job = await jobPost.findById(contract[2]);

            return {
                amount: contract[3].toString(),
                createdDate: new Date(+contract[4].toString() * 1000),
                duration: contract[5].toString(),
                status: contract[6].toString(),
                client,
                freelancer,
                job,
            };
        })
    );

    res.status(200).json({
        status: 'success',
        data: formattedContracts,
    });
});

exports.updateContractStatus = catchAsync(async (req, res, next) => {
    const provider = new ethers.JsonRpcProvider(providerUrl);
    const privateKey = process.env.WALLET_PRIVATE_KEY;
    const wallet = new ethers.Wallet(privateKey, provider);

    const contractAddress = process.env.FREELANCER_CONTRACT_ADDRESS;
    const contract = new ethers.Contract(
        contractAddress,
        freelancerContractABI,
        wallet
    );

    const jobID = req.params.jobID;
    // get proposal by jobID
    const proposalData = await proposal.findOne({ jobPost: jobID });

    const status = req.body.status; //pending 0 , completed 1, cancelled 2

    // if completed, pay the freelancer and close the contract and job post status to completed
    if (+status === 1) {
        await jobPost.findByIdAndUpdate(jobID, {
            status: 'completed',
        });

        const response = await walletController.updateWalletBalanceUtility({
            clientId: req.user._id,
            freelancerId: proposalData.freelancer,
            amount: proposalData.proposedAmount,
        });
        if (!response) {
            return res.status(500).json({
                message: 'Error paying the freelancer',
            });
        }
    }

    if (status === '2') {
        await jobPost.findByIdAndUpdate(jobID, {
            status: 'open',
        });
    }

    // const contractIndex = await contract.getContractIndexByJobID(
    //     jobID.toString()
    // );

    // const tx = await contract.updateContractStatus(
    //     contractIndex,
    //     status.toString()
    // );

    // await tx.wait();

    res.status(200).json({
        status: 'success',
        data: {
            status,
        },
    });
});
