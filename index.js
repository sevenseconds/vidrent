const express = require('express');
const winston = require('winston');
const app = express();

// Fix integration test doesn't get json body
app.use(express.json());

require('./startup/logging')();
require('./startup/routes')(app);
require('./startup/db')();
require('./startup/config')();
require('./startup/validation')();

if (process.env.NODE_ENV === 'production') {
    require('./startup/prod')(app);
}

process.on('unhandledRejection', (e) => {
    throw e;
});

const port = process.env.PORT || 3000;

const server = app.listen(port, () => winston.info(`Listening on port ${port}...`));

module.exports = server;