import configuration from './config.js';
import log from 'loglevel';
import pkg from '@slack/bolt';
import axios from 'axios';
import path from 'path';
import Docker from 'dockerode';
// https://github.com/simov/slugify/issues/24#issuecomment-629725749
import slug from 'limax';
const { App } = pkg;
import fs from 'fs';
import exp from 'constants';

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
        
        // TODO: Figure out why inspect sometimes states that the image does not exist
        docker.pull('hello-world:latest')
            .then(async () => {
                log.debug("Pulled hello-world:latest");
                await exportImage('hello-world:latest');
            })
            .catch(function (error) {
                log.error(error);
            });
    }
);

async function exportImage(imageName: string): Promise<void> {
    try {
        const image = docker.getImage(imageName);
        const data = await image.inspect(); 
        log.debug(data);
        // Create the directory if it does not exist
        // https://stackoverflow.com/a/26815894/18270659
        const exportDirectory = configuration.get('docker.destination.exportDirectory');
        if (!fs.existsSync(exportDirectory)) {
            log.warn(`Export directory does not exist: ${exportDirectory}; creating it`);
            fs.mkdirSync(exportDirectory, { recursive: true });
        }
        // In the filename, have the image name, tag, and platform
        const fileName = slug(`${data.RepoTags[0]}-${data.Architecture}`) + '.tar';
        const imageData = await image.get();
        const readableStream = imageData;
        const exportPath = path.join(exportDirectory, fileName);
        const writeStream = fs.createWriteStream(exportPath);
        readableStream.pipe(writeStream);
        log.debug(imageData);
    } catch (err) {
        log.error(err);
    }
}

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