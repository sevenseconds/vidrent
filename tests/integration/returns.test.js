const request = require('supertest');
const mongoose = require('mongoose');
const moment = require('moment');

const { Rental } = require('../../models/rental');
const { User } = require('../../models/user');
const { Movie } = require('../../models/movie');

describe('POST /api/returns', () => {
    let server;
    let customerId;
    let movieId;
    let rental;
    let token;

    beforeEach(async () => {
        server = require('../../index');

        token = new User().generateAuthToken();

        customerId = mongoose.Types.ObjectId();
        movieId = mongoose.Types.ObjectId();

        rental = new Rental({
            customer: {
                _id: customerId,
                name: '12345',
                phone: '12345',
            },
            movie: {
                _id: movieId,
                title: '12345',
                dailyRentalRate: 2,
            },
        });

        rental = await rental.save();
    });

    afterEach(async () => {
        await server.close();
        await Rental.remove({});
        await Movie.remove({});
    });

    const exec = () => {
        return request(server)
            .post('/api/returns')
            .set('x-auth-token', token)
            .send({ customerId, movieId });
    };

    it('should return 401 if client is not logged in', async () => {
        token = '';

        const res = await exec();

        expect(res.status).toBe(401);
    });

    it('should return 400 if customerId is not provided', async () => {
        customerId = '';

        const res = await exec();

        expect(res.status).toBe(400);
    });

    it('should return 400 if movieId is not provided', async () => {
        movieId = '';

        const res = await exec();

        expect(res.status).toBe(400);
    });

    it('should return 404 if no rental found for this customer/movie', async () => {
        movieId = mongoose.Types.ObjectId();

        const res = await exec();

        expect(res.status).toBe(404);
    });

    it('should return 400 if rental is already processed', async () => {
        rental.dateReturned = Date.now();
        await rental.save();
        
        const res = await exec();

        expect(res.status).toBe(400);
    });

    it('should return 200 if valid request', async () => {
        const res = await exec();

        expect(res.status).toBe(200);
    });

    it('should set the dateReturned if input is valid', async () => {
        const res = await exec();

        const rentalInDb = await Rental.findById(rental._id);
        const diff = Date.now() - rentalInDb.dateReturned;
        expect(diff).toBeLessThan(10 * 1000);
    });

    it('should set the rentalFee if input is valid', async () => {
        rental.dateOut = moment().add(-7, 'days').toDate();
        await rental.save();

        await exec();

        const rentalInDb = await Rental.findById(rental._id);
        expect(rentalInDb.rentalFee).toBe(14);
    });

    it('should increase the movie stock if input is valid', async () => {
        const movie = new Movie({
            _id: movieId,
            title: 'Captain Marvel',
            genre: { name: 'Sci-Fi' },
            numberInStock: 10,
            dailyRentalRate: 2,
        });
        await movie.save();

        await exec();

        const movieInDb = await Movie.findById(movieId);
        expect(movieInDb.numberInStock).toBe(movie.numberInStock + 1);
    });

    it('should return the rental if input is valid', async () => {
        const res = await exec();
        
        expect(Object.keys(res.body)).toEqual(
            expect.arrayContaining(['dateOut', 'dateReturned', 'rentalFee', 'customer', 'movie'])
        );
    });
});