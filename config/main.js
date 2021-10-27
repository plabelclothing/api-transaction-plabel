const config = module.exports = {};

config.application = 'api-transaction-plabel';
config.applicationKey = 'e5fc6405-c170-4c09-add2-a667d7869331';

config.expressApi = {
	bind:               '',
	port:               null,
	authorizationToken: '',
};

config.luxon = {
	timezone: 'Europe/Warsaw'
};

config.winston = {
	console:     {
		level:            'info',
		handleExceptions: true,
		json:             false,
		colorize:         false,
	},
	file:        {
		level:            'warn',
		handleExceptions: true,
		filename:         'logs/app.log',
		json:             true,
		maxsize:          5242880, // 5MB
		maxFiles:         100,
		colorize:         false
	},
	sentry:      {
		level: 'error',
		dsn:   ''
	},
	transports:  {
		file:    {
			enabled: false
		},
		console: {
			enabled: true
		},
		sentry:  {
			enabled: false
		}
	},
	exitOnError: false
};

config.mysqlRead = {
	id:              'READ',
	connection:      {
		connectionLimit: 1,
		host:            '',
		timezone:        'Europe/Warsaw',
		port:            null,
		database:        '',
		user:            '',
		password:        '',
		charset:         'UTF8_GENERAL_CI',
	},
	reconnectPeriod: 5000
};

config.mysqlWrite = {
	id:              'WRITE',
	connection:      {
		connectionLimit: 1,
		host:            '',
		timezone:        'Europe/Warsaw',
		port:            null,
		database:        '',
		user:            '',
		password:        '',
		charset:         'UTF8_GENERAL_CI'
	},
	reconnectPeriod: 5000
};

config.mailer = {
	host:        '',
	port:        null,
	secure:      true,
	from:        '',
	fromSupport: '',
	auth:        {
		user: '',
		pass: '',
	},
	supportAuth: {
		user: '',
		pass: '',
	}
};

module.exports = config;
