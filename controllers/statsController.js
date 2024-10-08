const catchAsync = require('../utils/catchAsync');
const Job = require('../model/jobPostModel');
const User = require('../model/userModel');
const Contract = require('../model/contractModel');
const Proposals = require('../model/proposalModel');
const Wallet = require('../model/walletModel');
/* 
{
    "categories": [
      {
        "categoryName": "Software Development",
        "totalJobs": 150
      },
      {
        "categoryName": "Marketing",
        "totalJobs": 80
      },
      {
        "categoryName": "Design",
        "totalJobs": 60
      },
      {
        "categoryName": "Data Science",
        "totalJobs": 90
      }
    ],
    "status": [
      {
        "statusName": "Open",
        "numberOfJobs": 300
      },
      {
        "statusName": "Closed",
        "numberOfJobs": 160
      }
    ],
    "overview": {
      "Users": 1500,
      "Proposals": 2000,
      "Contracts": 3000,
      "Jobs": 2500
    },
    "contracts": [
      {
        "status": "Pending",
        "numberOfContracts": 150
      },
      {
        "status": "Approved",
        "numberOfContracts": 200
      },
      {
        "status": "Rejected",
        "numberOfContracts": 50
      },
      {
        "status": "Completed",
        "numberOfContracts": 500
      }
    ],
    "userCounts": {
      "freelancers": {
        "count": 1200
      },
      "clients": {
        "count": 800
      }
    },
   "profit":1000
  };


*/
exports.getAllStats = catchAsync(async (req, res, next) => {
    const categories = await Job.aggregate([
        {
            $group: {
                _id: '$category',
                totalJobs: { $sum: 1 },
            },
        },
        {
            $project: {
                categoryName: '$_id',
                totalJobs: 1,
                _id: 0,
            },
        },
    ]);

    const status = await Job.aggregate([
        {
            $group: {
                _id: '$status',
                numberOfJobs: { $sum: 1 },
            },
        },
        {
            $project: {
                statusName: '$_id',
                numberOfJobs: 1,
                _id: 0,
            },
        },
    ]);

    const overview = {
        Users: await User.countDocuments(),
        Proposals: await Proposals.countDocuments(),
        Contracts: await Contract.countDocuments(),
        Jobs: await Job.countDocuments(),
    };

    const contracts = await Contract.aggregate([
        {
            $group: {
                _id: '$status',
                numberOfContracts: { $sum: 1 },
            },
        },
        {
            $project: {
                status: '$_id',
                numberOfContracts: 1,
                _id: 0,
            },
        },
    ]);

    const userCounts = {
        freelancers: {
            count: await User.countDocuments({ role: 'freelancer' }),
        },
        clients: { count: await User.countDocuments({ role: 'client' }) },
    };

    const systemWalletId = process.env.SYSTEM_WALLET_ID;

    const systemWallet = await Wallet.findOne({ user: systemWalletId });

    const profit = systemWallet.totalBalance;

    res.status(200).json({
        categories,
        status,
        overview,
        contracts,
        userCounts,
        profit,
    });
});
