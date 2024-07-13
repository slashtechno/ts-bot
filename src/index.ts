import configuration from './config.js';
import log from 'loglevel';
import pkg from '@slack/bolt';
import axios from 'axios';
import Docker from 'dockerode';
const { App } = pkg;
import fs from 'fs';

const app = new App({
    appToken: configuration.get('slack.appToken'),
    token: configuration.get('slack.botToken'),
    socketMode: true,
});

const docker = new Docker();
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
        await respond("Test API command received");
        // docker.listContainers({ all: true }, function (err, containers) {
        //     containers.forEach(function (containerInfo) {
        //         docker.getContainer(containerInfo.Id).inspect(function (err, data) {
        //             log.debug(data);
        //         });
        //     });
        // }
        // );
        docker.pull('hello-world:latest')
            .then(() => {
                const image = docker.getImage('hello-world');
                image.inspect((err, data) => {
                    if (err) {
                        log.error(err);
                    }
                    log.debug(data);
                });
                // Get the tarball of the image
                image.get((err, data) => {
                    if (err) {
                        log.error(err);
                    } else {
                        const readableStream = data;
                        const writeStream = fs.createWriteStream('hello-world.tar');
                        readableStream.pipe(writeStream);
                        log.debug(data);
                    }
                }
                );
        })
        .catch(function (error) {
            log.error(error);
        });
    }
);

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