import {App} from '@slack/bolt';
import configuration from './config.js';
import log from 'loglevel';


// Log configuration
log.setDefaultLevel('debug');
log.debug(configuration.toString());