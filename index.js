const config = require('config');
require('express-async-errors');
const mongoose = require('mongoose');
const express = require('express');
const Joi = require('joi');
Joi.objectId = require('joi-objectid')(Joi);
const winston = require('winston');
const { format, transports } = winston;
require('winston-mongodb');
const genres = require('./routes/genres');
const customers = require('./routes/customers');
const movies = require('./routes/movies');
const rentals = require('./routes/rentals');
const users = require('./routes/users');
const auth = require('./routes/auth');
const error = require('./middleware/error');

const app = express();

process.on('unhandledRejection', (e) => {
    throw e;
});

winston.add(new transports.File({
    filename: 'uncaughtExceptions.log',
    handleExceptions: true,
}));

winston.add(new transports.File({
    filename: 'logfile.log',
    format: format.simple(),
}));
winston.add(new transports.MongoDB({
    db: 'mongodb://localhost/vidly',
}));

if (!config.get('jwtPrivateKey')) {
    console.error('FATAL ERROR: jwtPrivateKey is not defined.')
    process.exit(1);
}

mongoose.connect('mongodb://localhost/vidly')
    .then(() => console.log('Connected to MongoDB...'))
    .catch(e => console.error('Could not connect to MongoDB...'));

app.use(express.json());
app.use('/api/genres', genres);
app.use('/api/customers', customers);
app.use('/api/movies', movies);
app.use('/api/rentals', rentals);
app.use('/api/users', users);
app.use('/api/auth', auth);

app.use(error);

if (process.env.NODE_ENV !== 'production') {
    winston.add(new transports.Console({
        handleExceptions: true,
        format: format.combine(
            format.colorize(),
            format.simple(),
        ),
    }));
}

const port = process.env.PORT || 3000;

app.listen(port, function () {
    console.log(`Listening on port ${port}...`)
});