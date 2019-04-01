const winston = require('winston');
const { format, transports, level } = winston;
require('winston-mongodb');
require('express-async-errors');

module.exports = function () {
    winston.add(new transports.File({
        filename: 'uncaughtExceptions.log',
        handleExceptions: true,
        level: "error",
    }));

    winston.add(new transports.File({
        filename: 'logfile.log',
        format: format.simple(),
    }));
    winston.add(new transports.MongoDB({
        db: 'mongodb://localhost/vidly',
    }));

    if (process.env.NODE_ENV !== 'production') {
        winston.add(new transports.Console({
            handleExceptions: true,
            format: format.combine(
                format.colorize(),
                format.simple(),
            ),
        }));
    }
}