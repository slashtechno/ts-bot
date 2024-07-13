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
        exportDirectoryPath: {
          doc: 'The directory to export the Docker image to',
          format: String,
          default: path.join(__dirname, 'export'),
          env: 'DOCKER_DESTINATION_EXPORT_DIRECTORY'
        },
        git: {
          enabled: {
            doc: "Automatically commit and push the exported image to a pre-configured Git repository",
            format: Boolean,
            default: false,
            env: 'DOCKER_DESTINATION_GIT_ENABLED'
          },
          force: {
            doc: "Force push the Git commit",
            format: Boolean,
            default: false,
            env: 'DOCKER_DESTINATION_GIT_FORCE'
          },
          branch: {
            doc: 'The branch to commit the exported image to',
            format: String,
            default: 'main',
            env: 'DOCKER_DESTINATION_GIT_BRANCH'
          },
          remoteName: {
            doc: 'The name of the remote to push the Git commit to',
            format: String,
            default: 'origin',
            env: 'DOCKER_DESTINATION_GIT_REMOTE_NAME'
          },
          author: {
            email: {
              doc: 'The email address to use for the Git commit',
              format: String,
              default: "", 
              env: 'DOCKER_DESTINATION_GIT_AUTHOR_EMAIL'
            },
            name: {
              doc: 'The name to use for the Git commit',
              format: String,
              default: "",
              env: 'DOCKER_DESTINATION_GIT_AUTHOR_NAME'
            }
          },
          credentials: {
            username: {
              doc: 'The username to use for the Git repository',
              format: String,
              default: '',
              env: 'DOCKER_DESTINATION_GIT_USERNAME'
            },
            password: {
              doc: 'The password to use for the Git repository',
              format: String,
              default: '',
              env: 'DOCKER_DESTINATION_GIT_PASSWORD'
            },
          },
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
