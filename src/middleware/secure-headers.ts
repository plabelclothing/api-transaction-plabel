/// <reference path="../types/express.d.ts" />
import {Request, Response, NextFunction} from 'express';
import {v4} from 'uuid';

const secureHeaders = (req: Request, res: Response, next: NextFunction) => {
	req.api = {
		requestId: v4()
	};

	res.header('X-Frame-Options', 'SAMEORIGIN; SAMEORIGIN');
	res.header('X-Xss-Protection', '1; mode=block');
	res.header('X-Content-Type-Options', 'nosniff');
	res.header('X-Request-Id', req.api.requestId);
	res.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');

	// Close connection
	res.set('Connection', 'close');
	next();
};

export {
	secureHeaders
};
