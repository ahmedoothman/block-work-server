const catchAsync = require('../utils/catchAsync');

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
exports.getAllStats = catchAsync(async (req, res, next) => {});
