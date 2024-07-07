import dotenv from 'dotenv';
import convict from 'convict';

// Load environment variables from .env file
dotenv.config();

// Define a schema for your configuration
// https://gist.github.com/zaach/5061155
const config = convict({
  slack: {
    appToken: {
        doc: 'The app token for your Slack app',
        format: String,
        default: '',
        env: 'SLACK_APP_TOKEN',
    },
    botToken: {
        doc: 'The bot token for your Slack app',
        format: String,
        default: '',
        env: 'SLACK_BOT_TOKEN',

  },
  }
}
);

// Perform validation
// https://github.com/mozilla/node-convict/tree/master/packages/convict#configvalidateoptions
config.validate({allowed: 'strict'});

// `import configuration from './config';` will load this object
// Without the default, it would be `import {config} from './config';`
export default config;
