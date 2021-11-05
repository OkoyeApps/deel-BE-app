const express = require('express');
const bodyParser = require('body-parser');
const { sequelize } = require('./model');
const { getProfile } = require('./middleware/getProfile');
const app = express();
app.use(bodyParser.json());
app.set('sequelize', sequelize);
app.set('models', sequelize.models);
const { Op } = require('sequelize');
const { URLSearchParams } = require('url');

/**
 * FIX ME!
 * @returns contract by id
 */
app.get('/contracts/:id', getProfile, async (req, res) => {
    const { Contract } = req.app.get('models');
    const { id: profileId } = req.profile;
    const id = parseInt(req.params.id);
    if (isNaN(id))
        return res.status(400).end();

    const contract = await Contract.findOne({
        where: {
            id: id,
            [Op.or]: [
                { ContractorId: profileId },
                { ClientId: profileId }
            ]
        }
    });

    if (!contract) return res.status(404).end();
    res.json(contract);
});

app.get('/contracts', getProfile, async (req, res) => {
    const { Contract } = req.app.get('models');
    const { id: profileId } = req.profile;

    const contract = await Contract.findAll({
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
                        [Op.ne]: 'terminated'
                    }
                }

            ]

        }
    });

    if (!contract) return res.status(404).end();
    res.json(contract);
});

app.get("/jobs/unpaid", getProfile, async (req, res) => {
    const { Job, Contract } = req.app.get("models");
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
    if (!jobs) return res.status(404).end();
    res.json(jobs);
});

app.post("/jobs/:job_id/pay", getProfile, async (req, res) => {
    const sequelize = app.get('sequelize');
    const t = await sequelize.transaction();
    try {
        const { Job, Profile } = req.app.get('models');
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

        res.send('payment successful');
    }
    catch (error) {
        console.log(error);
        await t.rollback();
    }
});

/**
 * Don't think I fully understand this question and also
 * I don't understand what this userid is exactly but I will assume a client 
 * only make deposit into his account for now. 
 * so I assume this userId is same as profileId from the middleware
 * */
app.post("/balances/deposit/:userId", getProfile, async (req, res) => {
    const { Profile, Contract, Job } = req.app.get('models');
    const { id: profileId } = req.profile;
    const { amount } = req.body;

    const allJobsToPay = await Job.findAll({
        where: {
            paid: { [Op.is]: null }
        },
        include: { model: Contract, where: { ClientId: profileId, status: "in_progress" } }
    });



    const maxAmountToPay = allJobsToPay.reduce((acc, job) => acc + job.price, 0);
    console.log("max age check ", maxAmountToPay);
    const percentagemax = maxAmountToPay * 0.25;
    const amountToDeposit = parseInt(amount);
    if (!isNaN(amountToDeposit) && amountToDeposit <= percentagemax) {
        Profile.increment({ balance: amountToDeposit }, { where: { id: profileId } });
        res.status(200).send(`${amountToDeposit} deposited`);
    } else {
        res.status(400).send(`sorry but you can't deposit more than ${percentagemax} at once`);
    }

});


app.get("/admin/best-profession", async (req, res) => {
    const { Contract, Job, Profile } = req.app.get('models');

    const queryObject = new URLSearchParams(req.query);
    if (!queryObject.has("start") || !queryObject.has("end"))
        return res.status(400).send("start or end date missing");

    const start = new Date(queryObject.get("start"));
    const end = new Date(queryObject.get("end"));

    const Jobs = await Job.findAll({
        where: {
            paid: true,
        },
        include:
        {
            model: Contract,
            where: {
                [Op.and]: [{
                    updatedAt: {
                        [Op.gte]: start
                    }
                },
                {
                    updatedAt: {
                        [Op.lte]: end
                    }
                }
                ]
            },
            include: {
                model: Profile,
                as: 'Contractor'
            }
        }
    });

    const professionalAndGeneratedTotal = new Map();
    let currentHighest = null;
    Jobs.forEach((job) => {
        const profession = job.Contract.Contractor.profession;
        if (professionalAndGeneratedTotal.has(job.Contract.Contractor.profession)) {
            const newTotal = professionalAndGeneratedTotal.get(profession) + job.price;
            if (newTotal > currentHighest.total) {
                currentHighest = { name: profession, total: newTotal };
            }
            professionalAndGeneratedTotal.set(profession, newTotal);
        } else {
            if (currentHighest === null || currentHighest.total < job.price) {
                currentHighest = { name: profession, total: job.price };
            }
            professionalAndGeneratedTotal.set(profession, job.price);
        }
    });

    res.send(currentHighest);
});
module.exports = app;
