import dotenv from 'dotenv';
import path from 'path';
import convict from 'convict';
import { fileURLToPath } from 'url';


// Load environment variables from .env file
dotenv.config();


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
    allowedRoleId: {
      doc: 'The role that is allowed to use the app. Leave blank to allow all roles',
      format: String,
      default: '',
      env: 'SLACK_ALLOWED_ROLE_ID',
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
    destination: {
      exportDirectory: {
        doc: 'The directory to export the Docker image to',
        format: String,
        default: path.join(__dirname, 'export'),
        env: 'DOCKER_DESTINATION_EXPORT_DIRECTORY'
      },
      registry: {
        hostname: {
          doc: 'The address of the Docker registry to push to',
          format: String,
          default: 'registry.hub.docker.com',
          env: 'DOCKER_DESTINATION_REGISTRY_HOSTNAME'
        },
        username: {
          doc: 'The username to use for the Docker registry',
          format: String,
          default: '',
          env: 'DOCKER_DESTINATION_USERNAME'
        },
        password: {
          doc: 'The password or personal access token to use for the Docker registry',
          format: String,
          default: '',
          env: 'DOCKER_DESTINATION_PASSWORD'
        },
      },
    }
  },
});

// Perform validation
// https://github.com/mozilla/node-convict/tree/master/packages/convict#configvalidateoptions
config.validate({ allowed: 'strict' });

// `import configuration from './config';` will load this object
// Without the default, it would be `import {config} from './config';`
export default config;
