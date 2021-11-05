const { URLSearchParams } = require('url');
const { Op } = require('sequelize');

const getBestProfession = async (models, req) => {
    const { Contract, Job, Profile } = models;

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
                where: { type: "contractor" },
                as: 'Contractor'
            }
        }
    });

    const professionalAndGeneratedTotal = new Map();
    let currentHighest = null;
    Jobs.forEach((job) => {
        const profession = job.Contract.Contractor.profession;
        if (professionalAndGeneratedTotal.has(profession)) {
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

    return currentHighest;
};

const getBestClients = async (models, req) => {
    const { Contract, Job, Profile } = models;

    const queryObject = new URLSearchParams(req.query);
    if (!queryObject.has("start") || !queryObject.has("end"))
        return res.status(400).send("start or end date missing");

    const start = new Date(queryObject.get("start"));
    const end = new Date(queryObject.get("end"));
    const limit = queryObject.get("limit") || 2;

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
                where: { type: "client" },
                as: 'Client'
            }
        },
        limit: limit
    });

    const professionalAndGeneratedTotal = new Map();
    let currentHighest = null;
    Jobs.forEach((job) => {
        const { id: clientId, firstName, lastName } = job.Contract.Client;

        if (professionalAndGeneratedTotal.has(clientId)) {
            const newTotal = professionalAndGeneratedTotal.get(clientId) + job.price;
            if (newTotal > currentHighest.total) {
                currentHighest = { clientId, firstName, lastName, total: newTotal };
            }
            professionalAndGeneratedTotal.set(clientId, newTotal);
        } else {
            if (currentHighest === null || currentHighest.total < job.price) {
                currentHighest = { clientId, firstName, lastName, total: job.price };
            }
            professionalAndGeneratedTotal.set(clientId, job.price);
        }
    });
    return currentHighest;
};

module.exports = { getBestProfession, getBestClients };