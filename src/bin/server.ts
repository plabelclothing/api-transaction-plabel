import express, {Request, Response} from 'express';
import {json, urlencoded} from 'body-parser';
import morgan from 'morgan';
import {checkAuth, secureHeaders} from '../middleware';
import config from './config';
import {logger, loggerMessage} from '../utils';
import {LogCode, LogCodeId, LoggerLevel, StatusHttp} from '../enums';
import routes from '../routes';

// Created server
const app = express();

// Disable headers
app.disable('x-powered-by');
app.disable('etag');

// Trust proxy headers
app.enable('trust proxy');

app.use(morgan('[:res[X-Request-Id]] :remote-addr - :remote-user ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent"', {
    stream: logger.expressStream,
    skip: (req) => req.originalUrl === '/v1/check/ping'
}));

app.use(secureHeaders);
app.use(urlencoded({extended: true}));
app.use(json({limit: '20mb'}));
app.use(checkAuth);

// Default routes
app.use(routes);

// Handle not available requests
app.all('*', (req: Request, res: Response) => {
    let err = new Error();
    err.message = 'Not found';
    res.status(404).send({
        status: StatusHttp.FAIL,
        message: 'Not found',
        data: {
            errorCode: LogCode.GEN_003_ERR,
            errorId: LogCodeId.GEN_003_ERR
        }
    });
});

try {
    app.listen(config.expressApi.port, config.expressApi.bind);
    logger.log(LoggerLevel.INFO, loggerMessage({
        message: `API endpoint started at ${config.expressApi.bind}:${config.expressApi.port}`
    }));
    import('../bin/services');
} catch (e) {
    logger.log(LoggerLevel.ERROR, loggerMessage({
        message: 'Error starting API!',
        error: e
    }));
}


