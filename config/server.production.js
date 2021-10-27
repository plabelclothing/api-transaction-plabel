/**
 * @module config/production
 */
'use strict';

const config = module.exports = {};

config.expressApi = {
	bind:   '{{ api_transaction_api_bind_address }}',
	port:   {{ api_transaction_api_bind_port }},
	authorizationToken: '{{ api_transaction_authorization_token }}'
};

config.winston = {
	file:   {
		filename:   '{{ api_transaction_logfilename }}'
	},
	sentry: {
		dsn:    '{{ api_transaction_sentry_dsn }}'
	}
};

config.mysqlRead = {
	connection:     {
		host:       '{{ api_transaction_mysql_read_host }}',
		port:       {{ api_transaction_mysql_read_port }},
		database:   '{{ api_transaction_mysql_read_database }}',
		user:       '{{ api_transaction_mysql_read_user }}',
		password:   '{{ api_transaction_mysql_read_password }}'
    }
};

config.mysqlWrite = {
	connection: {
		host:       '{{ api_transaction_mysql_write_host }}',
		port:       {{ api_transaction_mysql_write_port }},
		database:   '{{ api_transaction_mysql_write_database }}',
		user:       '{{ api_transaction_mysql_write_user }}',
		password:   '{{ api_transaction_mysql_write_password }}'
	}
};

config.mailer = {
	host: '{{ api_transaction_mailer_host }}',
	port: '{{ api_transaction_mailer_port }}',
	secure: true,
	from: '{{ api_transaction_mailer_mail_from }}',
	fromSupport: '{{ api_transaction_mailer_mail_from_support }}',
	auth: {
		user: '{{ api_transaction_mailer_user }}',
		pass: '{{ api_transaction_mailer_password }}',
	},
	supportAuth: {
		user: '{{ api_transaction_mailer_user_support }}',
		pass: '{{ api_transaction_mailer_password_support }}',
	}
};
