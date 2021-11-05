const { Op } = require('sequelize');

const deposit = async (models, req) => {
    const { Profile, Contract, Job } = models;
    const { id: profileId } = req.profile;
    const { amount } = req.body;

    const allJobsToPay = await Job.findAll({
        where: {
            paid: { [Op.is]: null }
        },
        include: { model: Contract, where: { ClientId: profileId, status: "in_progress" } }
    });

    const maxAmountToPay = allJobsToPay.reduce((acc, job) => acc + job.price, 0);
    const percentagemax = maxAmountToPay * 0.25;
    const amountToDeposit = parseInt(amount);
    if (!isNaN(amountToDeposit) && amountToDeposit <= percentagemax) {
        Profile.increment({ balance: amountToDeposit }, { where: { id: profileId } });
        return true;
    } else {
        //we can find a way to unify the result to probaly return same data type for consistency
        return percentagemax;
    }
};

module.exports = { deposit };