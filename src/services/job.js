const { Op } = require('sequelize');

const getUnpaidJob = async (models, req) => {
    const { Job, Contract } = models;
    const { id: profileId } = req.profile;

    const jobs = await Job.findAll({
        where: {
            paid: {
                [Op.is]: null
            }
        },
        include: [{
            model: Contract,
            where: {
                [Op.and]: [
                    {
                        [Op.or]: [
                            { ContractorId: profileId },
                            { ClientId: profileId }
                        ]
                    },
                    {
                        status: {
                            [Op.eq]: 'in_progress'
                        }
                    }
                ]
            }

        }]
    });

    return jobs;
};

const payForJob = async (models, sequelize, req, res) => {
    const t = await sequelize.transaction();
    try {
        const { Job, Profile } = models;
        const { id: profileId, balance: profileBalance } = req.profile;
        const { job_id } = req.params;

        //find jobs by id
        const currentJob = await Job.findOne({ where: { id: job_id }, include: 'Contract' });
        if (!currentJob) return res.status(404).send("Job not found or payment");

        if (currentJob.paid) return res.status(200).send("Payment already made for job");

        if (currentJob.balance > profileBalance) return res.status(400).send(`your balance need to be >= ${currentJob.balance} for payment`);

        const contractorId = currentJob.Contract.ContractorId;

        //add amount to contractor balance
        const jobContractor = await Profile.findOne({ where: { id: contractorId } });
        const newContractorBalance = jobContractor.balance + currentJob.price;
        await Profile.update({ balance: newContractorBalance }, { where: { id: contractorId } }, { transaction: t });

        //subtract amount from client balance
        const clientNewBalance = profileBalance - currentJob.price;
        await Profile.update({ balance: clientNewBalance }, { where: { id: profileId } }, { transaction: t });

        //update paid status of job
        await Job.update({ paid: true }, { where: { id: job_id } });

        await t.commit();
        return res.send('payment successful');
    }
    catch (error) {
        console.log(error);
        await t.rollback();
        //we could have a better way to handle this error,
        //maybe log it and even find a way to let users know what happened at our end;
        return res.status().send("could not complete this transaction, try again later");

    }
};

module.exports = { getUnpaidJob,payForJob };