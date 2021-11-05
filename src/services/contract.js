const { Op } = require('sequelize');

const getContract = async (models, req) => {
    const { Contract } = models;
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

    return contract;
};

const getContracts =async (models, req) => {
    const { Contract } = models;
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

    return contract;
};;

module.exports = {
    getContract,
    getContracts
}