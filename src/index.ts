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
        // https://distribution.github.io/distribution/spec/api/#pulling-an-image
        // axios.get('https://registry.hub.docker.com/v2/repositories/library/ubuntu/tags')
        // https://stackoverflow.com/questions/56193110/how-can-i-use-docker-registry-http-api-v2-to-obtain-a-list-of-all-repositories-i/60549026#60549026
        axios.get(`https://registry.hub.docker.com/v2/library/ubuntu/manifests/latest`, {
            headers: {
                "Authorization": `Bearer ${await dockerLogin()}`
            }
        })
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

// Promise is needed since the function is async
async function dockerLogin(): Promise<string | null> {
    try {
        const response = await axios.post("https://hub.docker.com/v2/users/login", 
            {
                username: configuration.get('docker.dockerHub.username'),
                password: configuration.get('docker.dockerHub.password')
            },
            {
            headers: {
                "Content-Type": "application/json"
            }
        });
        const token = response.data.token;
        log.debug(`Docker login token: ${token}`);
        return token;
    }
    catch (error) {
        log.error(error);
        log.debug(`data: ${error.response.data}`);
        return null;
    }

}


// (async () => {
//     await app.start(configuration.get('server.port'));
//     log.info(`⚡️ Bolt app is running on port ${configuration.get('server.port')}`);
// }
// )();
await app.start(configuration.get('server.port'));

// Log configuration
// log.setDefaultLevel('debug');
log.setLevel('debug');
log.debug(configuration.toString());