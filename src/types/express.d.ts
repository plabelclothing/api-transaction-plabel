declare global {
	namespace Express {
		interface Request {
			api: {
				requestId?: string | string[];
			}
		}
	}
}

export {};
