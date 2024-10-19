const User = require('../model/userModel');
const jobPost = require('../model/jobPostModel');
const proposal = require('../model/proposalModel');
const walletController = require('./walletController');
const catchAsync = require('../utils/catchAsync');
const { ethers } = require('ethers');
const freelancerContractABI = require('../ABI/freelancerContractABI.json');
const providerUrl = process.env.ETHEREUM_PROVIDER_URL;
const Contract = require('../model/contractModel'); // Local model

const MODE = process.env.NETWORK_MODE;

exports.createContract = catchAsync(async (req, res, next) => {
    const clientId = req.user._id;
    const { freelancerId, jobID, amount, duration, status } = req.body;
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
            contract._id.toString(),
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
    // check if is already a contract for this job and its status is pending or completed then return
    const existingContract = await Contract.findOne({
        job: data.jobID._id,
        status: { $in: ['pending', 'completed'] },
    });

    if (existingContract) {
        return {
            status: 'error',
            message: 'Contract already exists for this job',
        };
    }
    const contractData = await Contract.create({
        client: data.clientId,
        freelancer: data.freelancerId._id,
        job: data.jobID._id,
        amount: data.amount,
        duration: data.duration,
        status: 'pending',
    });

    if (MODE === 'LOCAL') {
        return {
            status: 'success',
            data: contractData,
            message: 'Contract created successfully',
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
            contractData._id.toString(),
            data.clientId.toString(),
            data.freelancerId._id.toString(),
            data.jobID._id.toString(),
            +data.amount,
            +data.duration
        );

        const receipt = await tx.wait();
        return {
            status: 'success',
            data: contractData,
            message: 'Contract created successfully',
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
                const contractData = await Contract.findById(contract[0]);
                const client = await User.findById(contract[1]);
                const freelancer = await User.findById(contract[2]);
                const job = await jobPost.findById(contract[3]);
                return {
                    amount: contract[4].toString(),
                    createdDate: new Date(+contract[5].toString() * 1000),
                    duration: contract[6].toString(),
                    status:
                        +contract[7].toString() === 0
                            ? 'pending'
                            : +contract[7].toString() === 1
                            ? 'completed'
                            : 'cancelled',
                    client,
                    freelancer,
                    job,
                    contract: contractData,
                    _id: contract[0],
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
                const contractData = await Contract.findById(contract[0]);
                const client = await User.findById(contract[1]);
                const freelancer = await User.findById(contract[2]);
                const job = await jobPost.findById(contract[3]);
                return {
                    amount: contract[4].toString(),
                    createdDate: new Date(+contract[5].toString() * 1000),
                    duration: contract[6].toString(),
                    status:
                        +contract[7].toString() === 0
                            ? 'pending'
                            : +contract[7].toString() === 1
                            ? 'completed'
                            : 'cancelled',
                    client,
                    freelancer,
                    job,
                    contract: contractData,
                    _id: contract[0],
                };
            })
        );

        res.status(200).json({
            status: 'success',
            data: formattedContracts,
        });
    } else {
        const freelancer = req.user._id;
        const contracts = await Contract.find({ freelancer }).populate(
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
                const contractData = await Contract.findById(contract[0]);
                const client = await User.findById(contract[1]);
                const freelancer = await User.findById(contract[2]);
                const job = await jobPost.findById(contract[3]);
                return {
                    amount: contract[4].toString(),
                    createdDate: new Date(+contract[5].toString() * 1000),
                    duration: contract[6].toString(),
                    status:
                        +contract[7].toString() === 0
                            ? 'pending'
                            : +contract[7].toString() === 1
                            ? 'completed'
                            : 'cancelled',
                    client,
                    freelancer,
                    job,
                    contract: contractData,
                    _id: contract[0],
                };
            })
        );

        res.status(200).json({
            status: 'success',
            data: formattedContracts,
        });
    } else {
        const client = req.user._id;
        const contracts = await Contract.find({ client }).populate(
            'client freelancer job'
        );

        res.status(200).json({
            status: 'success',
            data: contracts,
        });
    }
});

exports.updateContractStatus = catchAsync(async (req, res, next) => {
    const contractId = req.params.contractId;
    const freelancerID = req.params.freelancerID;
    const status = req.body.contractStatus;
    const jobID = req.body.jobID;
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

    const proposalData = await proposal.findOne({
        jobPost: jobID,
        freelancer: freelancerID,
    });
    const job = await jobPost.findById(jobID);

    // If completed, pay the freelancer and close the contract and job post status to completed
    if (+statusValue === 1) {
        // Update job post status
        job.status = 'completed';
        await job.save();
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
        // return job post status to open
        job.status = 'open';
        await job.save();
    }
    // Update contract status
    const contract = await Contract.findById(contractId);

    if (!contract) {
        return res.status(404).json({ message: 'Contract not found' });
    }

    contract.status = status;

    await contract.save();
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

        const tx = await contract.updateContractStatusByContractID(
            contractId.toString(),
            statusValue.toString()
        );

        await tx.wait();

        res.status(200).json({
            status: 'success',
            data: {
                statusValue,
            },
        });
    } else {
        res.status(200).json({
            status: 'success',
            data: {
                status,
            },
        });
    }
});
