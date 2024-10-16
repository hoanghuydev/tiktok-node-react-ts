const express = require('express');
import cors from 'cors';
const jwt = require('jsonwebtoken');
const app = express();
const port = 8000;
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
app.use(cookieParser());
const { getConnection } = require('./config/db');
import route from './routes';
import startCron from './cron';
startCron();
dotenv.config();
require('./config/oauth/passport');
import client from './config/db/redis';
global._basedir = __dirname;
const { Server } = require('socket.io');
const handleSocket = require('./socket');
getConnection();
app.use(
    cors({
        origin: ['http://localhost:5173', 'http://localhost:8000'], // 8000 is port of mobile client, 5173 is port of web
        credentials: true,
    })
);
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

const server = app.listen(port, function () {
    console.log('Server listening on port ' + port);
});

const io = new Server(server, {
    allowEIO3: true,
    cors: {
        origin: true,
        methods: ['GET', 'POST'],
        credentials: true,
    },
});
app.use((req, res, next) => {
    res.io = io;
    next();
});

route(app);

handleSocket(io);
