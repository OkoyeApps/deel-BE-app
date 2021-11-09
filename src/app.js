const express = require('express');
const bodyParser = require('body-parser');
const { sequelize } = require('./model');
const { getProfile } = require('./middleware/getProfile');
const { Op } = require('sequelize');
const { getContract, getContracts } = require('./services/contract');
const { getUnpaidJob, payForJob } = require('./services/job');
const { deposit } = require('./services/user');
const { getBestProfession, getBestClients } = require('./services/admin');
const app = express();
app.use(bodyParser.json());
app.set('sequelize', sequelize);
app.set('models', sequelize.models);
/**
 * FIX ME!
 * @returns contract by id
 */
app.get('/contracts/:id', getProfile, async (req, res) => {
    const contract = await getContract(req.app.get('models'), req);
    if (!contract) return res.status(404).end();
    res.json(contract);
});

app.get('/contracts', getProfile, async (req, res) => {
    const contracts = await getContracts(req.app.get('models'), req);
    if (!contracts) return res.status(404).end();
    res.json(contracts);
});

app.get("/jobs/unpaid", getProfile, async (req, res) => {
    const jobs = await getUnpaidJob(req.app.get('models'), req);
    if (!jobs) return res.status(404).end();
    res.json(jobs);
});

app.post("/jobs/:job_id/pay", getProfile, async (req, res) => {
    return await payForJob(req.app.get('models'), app.get('sequelize'), req, res);
});

/**
 * Don't think I fully understand this question and also
 * I don't understand what this userid is exactly but I will assume a client 
 * only make deposit into his account for now. 
 * so I assume this userId is same as profileId from the middleware
 * */
app.post("/balances/deposit/:userId", getProfile, async (req, res) => {
    const result = await deposit(req.app.get('models'), req);
    if (result === true) return res.status(200).send(`${amountToDeposit} deposited`);

    return res.status(400).send(`sorry, you can't deposit more than ${result} at once`);
});


app.get("/admin/best-profession", async (req, res) => {
    const result = await getBestProfession(req, req.app.get('sequelize'));
    res.send(result);
});


app.get("/admin/best-clients", async (req, res) => {
    const result = await getBestClients(req, req.app.get('sequelize'));
    res.send(result);
});
module.exports = app;
