const { Client } = require('pg');
require('dotenv').config();

const connectDb = async () => {
    const client = new Client({
        host: process.env.PG_HOST,
        port: process.env.PG_PORT,
        user: process.env.PG_USER,
        password: process.env.PG_PASSWORD,
        database: process.env.PG_DATABASE,
    });

    try {
        await client.connect();
        console.log(`PostgreSQL server connected: ${client.host}`);
    } catch (error) {
        console.log(`PostgreSQL server not connected: ${error}`);
    }

    return client;
};

module.exports = connectDb;
