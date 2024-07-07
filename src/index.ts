import configuration from './config.js';
import log from 'loglevel';
import pkg from '@slack/bolt';
const { App } = pkg;

const app = new App({
    appToken: configuration.get('slack.appToken'),
    token: configuration.get('slack.botToken'),
    socketMode: true,
});

app.command(
    '/hello',
    async ({command, ack, respond}) => {
    // Acknowledge 
    await ack();
    log.info(`Received command: ${command.text}`);
    await respond("Hello, world! :)\nYou said: " + command.text);
    }
);

// (async () => {
//     await app.start(configuration.get('server.port'));
//     log.info(`⚡️ Bolt app is running on port ${configuration.get('server.port')}`);
// }
// )();
await app.start(configuration.get('server.port'));

// Log configuration
log.setDefaultLevel('debug');
log.debug(configuration.toString());