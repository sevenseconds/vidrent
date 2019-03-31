const express = require('express');
const winston = require('winston');
const app = express();

require('./startup/logging')();
require('./startup/config')();
require('./startup/routes')(app);
require('./startup/db')();
require('./startup/validation')();

process.on('unhandledRejection', (e) => {
    throw e;
});

const port = process.env.PORT || 3000;

app.listen(port, function () {
    winston.info(`Listening on port ${port}...`);
});