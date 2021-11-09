const { URLSearchParams } = require('url');
const { QueryTypes } = require('sequelize');


/**
 * @url(https://knexjs.org/)
 * I normally make use of the Knex to build my query but because its an interview and am not sure if
 * am allowed to do that I had to use the sql aggregate functions writing it this way
 */

const getBestProfession = async (req, sequelize) => {
    const queryObject = new URLSearchParams(req.query);
    if (!queryObject.has("start") || !queryObject.has("end"))
        return res.status(400).send("start or end date missing");

    const start = new Date(queryObject.get("start"));
    const end = new Date(queryObject.get("end"));

    const result = await sequelize.query(`SELECT  p.profession, SUM(Jobs.price) AS total FROM Jobs 
    inner join Contracts CN on CN.id = Jobs.ContractId
    inner join Profiles P on P.id = CN.ContractorId
    where Jobs.paid is NOT NULL AND Jobs.updatedAt >= :start AND Jobs.updatedAt <= :end
    GROUP By P.profession
    ORDER BY total DESC`, { type: QueryTypes.SELECT, replacements: { start, end } });

    return result;
};

/**
 * @url(https://knexjs.org/)
 * I normally make use of the Knex to build my query but because its an interview and am not sure if
 * am allowed to do that I had to use the sql aggregate functions writing it this way
 */
const getBestClients = async (req, sequelize) => {
    const queryObject = new URLSearchParams(req.query);
    if (!queryObject.has("start") || !queryObject.has("end"))
        return res.status(400).send("start or end date missing");

    const start = new Date(queryObject.get("start"));
    const end = new Date(queryObject.get("end"));
    const limit = queryObject.get("limit") || 2;

    const result = await sequelize.query(`SELECT p.id,  p.firstName ||' ' ||  p.lastName as fullName, SUM(Jobs.price) AS paid FROM Jobs 
    inner join Contracts CN on CN.id = Jobs.ContractId
    inner join Profiles P on P.id = CN.ContractorId
    where Jobs.paid is NOT NULL AND Jobs.updatedAt >= :start AND Jobs.updatedAt <= :end
    GROUP By P.id
    ORDER BY paid DESC
    Limit :limit
    `, { type: QueryTypes.SELECT, replacements: { start, end, limit } });

    return result;
};

module.exports = { getBestProfession, getBestClients };