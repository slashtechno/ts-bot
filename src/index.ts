import configuration from './config.js';
import log from 'loglevel';
import pkg from '@slack/bolt';
import axios from 'axios';
const { App } = pkg;

const app = new App({
    appToken: configuration.get('slack.appToken'),
    token: configuration.get('slack.botToken'),
    socketMode: true,
});

app.command(
    '/hello',
    async ({ command, ack, respond }) => {
        // Acknowledge 
        await ack();
        log.info(`Received command: ${command.text}`);
        await respond("Hello, world! :)\nYou said: " + command.text);
    }
);

app.command(
    '/test-api',
    async ({ command, ack, respond }) => {
        await ack();
        // https://docker-docs.uclv.cu/registry/spec/api/#listing-image-tags
        axios.get('https://registry.hub.docker.com/v2/repositories/library/ubuntu/tags')
            .then((response) => {
                log.debug(response.data);
                (async () => {
                    await respond("Response: " + JSON.stringify(response.data));
                }
                )();

            })
            .catch((error) => {
                log.error(error);
                (async () => {
                    await respond("Error: " + error);
                }
                )();
            });
    }
)

// (async () => {
//     await app.start(configuration.get('server.port'));
//     log.info(`⚡️ Bolt app is running on port ${configuration.get('server.port')}`);
// }
// )();
await app.start(configuration.get('server.port'));

// Log configuration
log.setDefaultLevel('debug');
log.debug(configuration.toString());