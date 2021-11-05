const { getContract, getContracts } = require('./contract');
const { sequelize } = require('../model');
const models = sequelize.models;


/*
* all test was written as with the seeded test database in mind
* I see hard coded values at some places because I are sure of their ids from the seed file
* for a real world I might want to do get data dymically as the id might change
*/

describe("/contract test", () => {

    it("should return specific contract", async () => {
        //find any user profile;
        const profile = await models.Profile.findOne({});
        expect(profile).not.toBeNull();

        const contract = await getContract(models, { profile, params: { id: 1 } });
        expect(contract).not.toBeNull();
    });

    it('should return all contracts for user profile', async () => {
        //find any user profile;
        const profile = await models.Profile.findOne({});
        expect(profile).not.toBeNull();

        const contract = await getContracts(models, { profile });
        expect(contract).not.toBeNull();
    });
});

