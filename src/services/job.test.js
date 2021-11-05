const { getUnpaidJob, payForJob } = require('./job');
const { sequelize } = require('../model');
const models = sequelize.models;

/*
* all test was written as with the seeded test database in mind
* I see hard coded values at some places because I are sure of their ids from the seed file
* for a real world I might want to do get data dymically as the id might change
*/
describe('/jobs test', () => {
    beforeAll(() => {
       
    })
    it('should return all unpaid job for user with id 1', async () => {
        //find any user profile;
        const profile = await models.Profile.findOne({});
        expect(profile).not.toBeNull();

        const contract = await getUnpaidJob(models, { profile });

        expect(contract.length).toBeGreaterThan(0);
    });

    it('should return null when payinf for job with id 1', async () => {
        //find any user profile;
        const profile = await models.Profile.findOne({});
        expect(profile).not.toBeNull();

        //we could use proxiquire to mock up this function but for now 
        //this is a hack using js prototype to simulate
        var response = {};
        response.__proto__.status = function () { return this; };
        response.__proto__.send = function () { return null; };

        const result = await payForJob(models, sequelize, { profile, params: { job_id: 1 } }, response);
        expect(result).toBeNull();
    });
});