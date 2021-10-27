/// <reference path="../types/application-config.d.ts" />
/* eslint-disable import/no-dynamic-require */
/* eslint-disable security/detect-non-literal-require */
import _ from 'lodash';
import {existsSync} from 'fs';
import {resolve} from 'path';

const {NODE_ENV} = process.env;
const configDir = resolve('config');
const serverFileConfig = `${configDir}/server.${NODE_ENV}.js`;

if (!existsSync(serverFileConfig)) {
	throw new Error('File config is not defined!');
}

const createSettings: ApplicationConfig.RootObject = _.merge(
	require('../../config/main'),
	require(`../../config/server.${NODE_ENV}`)
);

export default createSettings;
