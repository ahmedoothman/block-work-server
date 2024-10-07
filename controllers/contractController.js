const User = require('../model/userModel');
const jobPost = require('../model/jobPostModel');
const proposal = require('../model/proposalModel');
const walletController = require('./walletController');
const catchAsync = require('../utils/catchAsync');
const { ethers } = require('ethers');
const freelancerContractABI = require('../ABI/freelancerContractABI.json');
const providerUrl = process.env.ETHEREUM_PROVIDER_URL;
const Contract = require('../model/contractModel'); // Local model

const MODE = 'LOCAL'; // 'BLOCKCHAIN' or 'LOCAL'

exports.createContract = catchAsync(async (req, res, next) => {
    const clientId = req.user._id;
    const { freelancerId, jobID, amount, duration, status } = req.body;

    if (MODE === 'BLOCKCHAIN') {
        // Blockchain mode logic
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

        const job = await jobPost.findById(jobID);
        const client = await User.findById(clientId);
        const freelancer = await User.findById(freelancerId);

        res.status(201).json({
            status: 'success',
            data: {
                client,
                freelancer,
                job,
                amount: amount.toString(),
                duration: duration.toString(),
                status,
            },
        });
    } else {
        // Local mode logic
        const contract = await Contract.create({
            client: clientId,
            freelancer: freelancerId,
            job: jobID,
            amount,
            duration,
            status,
        });

        const job = await jobPost.findById(jobID);
        const client = await User.findById(clientId);
        const freelancer = await User.findById(freelancerId);

        res.status(201).json({
            status: 'success',
            data: {
                client,
                freelancer,
                job,
                contract,
            },
        });
    }
});
exports.createContractUtility = async (data) => {
    if (MODE === 'LOCAL') {
        const contract = await Contract.create({
            client: data.clientId,
            freelancer: data.freelancerId,
            job: data.jobID,
            amount: data.amount,
            duration: data.duration,
            status: 'pending',
        });

        return {
            status: 'success',
            data: contract,
        };
    } else {
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
    }
};

exports.getAllContracts = catchAsync(async (req, res, next) => {
    if (MODE === 'BLOCKCHAIN') {
        // Blockchain mode logic
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
    } else {
        // Local mode logic
        const contracts = await Contract.find().populate(
            'client freelancer job'
        );

        res.status(200).json({
            status: 'success',
            data: contracts,
        });
    }
});

exports.getFreelancerContracts = catchAsync(async (req, res, next) => {
    if (MODE === 'BLOCKCHAIN') {
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
    } else {
        const freelancerId = req.user._id;
        const contracts = await Contract.find({ freelancerId }).populate(
            'client freelancer job'
        );

        res.status(200).json({
            status: 'success',
            data: contracts,
        });
    }
});

exports.getClientContracts = catchAsync(async (req, res, next) => {
    if (MODE === 'BLOCKCHAIN') {
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
    } else {
        const clientId = req.user._id;
        const contracts = await Contract.find({ clientId }).populate(
            'client freelancer job'
        );

        res.status(200).json({
            status: 'success',
            data: contracts,
        });
    }
});

exports.updateContractStatus = catchAsync(async (req, res, next) => {
    const jobID = req.params.jobID;
    const freelancerID = req.params.freelancerID;
    const status = req.body.contractStatus; // pending, completed cancelled
    console.log(status);
    let statusValue;

    switch (status) {
        case 'pending':
            statusValue = 0;
            break;
        case 'completed':
            statusValue = 1;
            break;
        case 'cancelled':
            statusValue = 2;
            break;
    }

    // Get proposal by jobID
    const proposalData = await proposal.findOne({
        jobPost: jobID,
        freelancer: freelancerID,
    });
    // If completed, pay the freelancer and close the contract and job post status to completed
    if (+statusValue === 1) {
        const job = await jobPost.findByIdAndUpdate(jobID, {
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
    if (+statusValue === 2) {
        await jobPost.findByIdAndUpdate(jobID, {
            status: 'open',
        });
    }

    if (MODE === 'BLOCKCHAIN') {
        // Blockchain mode logic
        const provider = new ethers.JsonRpcProvider(providerUrl);
        const privateKey = process.env.WALLET_PRIVATE_KEY;
        const wallet = new ethers.Wallet(privateKey, provider);

        const contractAddress = process.env.FREELANCER_CONTRACT_ADDRESS;
        const contract = new ethers.Contract(
            contractAddress,
            freelancerContractABI,
            wallet
        );

        const contractIndex = await contract.getContractIndexByJobID(
            jobID.toString()
        );

        const tx = await contract.updateContractStatus(
            contractIndex,
            status.toString()
        );

        await tx.wait();

        res.status(200).json({
            status: 'success',
            data: {
                statusValue,
            },
        });
    } else {
        const contract = await Contract.findOne({ jobID });
        console.log(contract);
        if (!contract) {
            return res.status(404).json({ message: 'Contract not found' });
        }

        contract.status = status;

        await contract.save();
        res.status(200).json({
            status: 'success',
            data: {
                status,
            },
        });
    }
});
