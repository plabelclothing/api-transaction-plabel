import {NextFunction, Request, Response} from 'express';
import {StatusHttp, LogCode, LogCodeId} from '../enums';
import config from '../bin/config';

const checkAuth = (req: Request, res: Response, next: NextFunction) => {

    const {path} = req;

    if (
        req.method === 'OPTIONS'
        || path.includes('/v1/check/ping')
        || path.includes('/v1/check/telemetry')
    ) return next();

    const auth: string | undefined = req.headers.authorization;
    const token = `Bearer ${config.expressApi.authorizationToken}`;

    if (!auth || auth !== token) {
        return res.status(401).send({
            status: StatusHttp.FAIL,
            message: !auth ? 'Authorization header not found!' : 'Authorization token is not correct!',
            data: {
                errorCode: LogCode.GEN_000_ERR,
                errorId: LogCodeId.GEN_000_ERR
            }
        });
    }


    next();
};

export {
    checkAuth
};
