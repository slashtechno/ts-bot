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
  },
  server: {
    port: {
      doc: 'The port to listen on',
      format: 'port',
      default: 3000,
      env: 'PORT',
    },
  },
  // https://docs.docker.com/docker-hub/api/latest/#tag/authentication
  docker: {
    dockerHub: {
    // registry: {
    //   doc: 'The Docker registry to use',
    //   format: String,
    //   default: 'https://hub.docker.com',
    //   env: 'DOCKER_SOURCE_REGISTRY'
    // },
    username: {
      doc: 'The username to use for the Docker registry',
      format: String,
      default: '',
      env: 'DOCKER_SOURCE_USERNAME'
    },
    password: {
      doc: 'The password or personal access token to use for the Docker registry',
      format: String,
      default: '',
      env: 'DOCKER_SOURCE_PASSWORD'
    },
  },
  },
});

// Perform validation
// https://github.com/mozilla/node-convict/tree/master/packages/convict#configvalidateoptions
config.validate({ allowed: 'strict' });

// `import configuration from './config';` will load this object
// Without the default, it would be `import {config} from './config';`
export default config;
