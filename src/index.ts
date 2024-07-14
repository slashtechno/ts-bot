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

// TODO: Add authentication when pulling


app.command(
    '/export-docker-image',
    async ({ command, ack, respond }) => {
        await ack();
        const image = command.text;
        await respond(`Pulling image: ${image}`);
        docker.pull(image)
            .finally(async () => {
                log.info(`Exporting image: ${image}`);
                await exportImage(image);
                await respond(`Exported image: ${image}`);

            })
            .catch(async (error) => {
                await respond(`Error exporting image: ${image}; check the logs for more information`);
                log.error(error);
            });
    }
);

app.command(
    '/clone-docker-image',
    async ({ command, ack, respond }) => {
        await ack();
        const image = command.text;
        await respond(`Pulling image: ${image}`);
        docker.pull(image)
            .then(async () => {
                log.info(`Cloning image: ${image}`);
                await cloneImage(image).catch(async (error) => {
                    await respond(`Error cloning image: ${image}; check the logs for more information`);
                    log.error(error);
                }
                ).finally(async () => {
                    await respond(`Cloned image: ${image}`);
                }
                );

            })
            .catch(async (error) => {
                await respond(`Error cloning image: ${image}; check the logs for more information`);
                log.error(error);
            });
    }
);


async function cloneImage(imageName: string): Promise<void> {
    return new Promise(async (resolve, reject) => {
        try {
            const image = docker.getImage(imageName);
            const data = await image.inspect();
            log.debug(data);
            const registryHostname = configuration.get('docker.destination.registry.hostname');

            // The `?` is a ternary operator
            // It is equivalent to:
            // if imageName.includes('/'):
            //     justTheImageName = imageName.split('/')[1]
            // else:
            //     justTheImageName = imageName
            // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Conditional_Operator
            const fullImageName = data.RepoTags[0];
            const newImageNameWithoutHost = fullImageName.includes('/') ? fullImageName.split('/')[1] : fullImageName;
            // Get the tag (the fullImageName should always have a tag)
            // const tag = newImageNameWithoutHost.includes(':') ? newImageNameWithoutHost.split(':')[1] : 'latest';
            const tag = newImageNameWithoutHost.split(':')[1]
            // Remove the tag from the image name
            const newImageNameClean = newImageNameWithoutHost.includes(':') ? newImageNameWithoutHost.split(':')[0] : newImageNameWithoutHost;
            log.debug(`newImageNameClean: ${newImageNameClean}`);

            const newImageName = `${registryHostname}/${newImageNameClean}`;
            await image.tag(
                {
                    repo: newImageName,
                    tag: tag
                }
            )
            const newImage = docker.getImage(newImageName);

            const options = {
                tag: tag,
                authconfig: { // Include the auth configuration here
                    username: configuration.get('docker.destination.registry.username'),
                    password: configuration.get('docker.destination.registry.password')
                }
            };
            newImage.push(options, (error, res) => {
                if (error) {
                    reject(error);
                }
                // https://github.com/apocas/dockerode/issues/743#issuecomment-1725256963
                // res.pipe(process.stdout);
            });
        } catch (err) {
            reject(err);
        }
    });
}

async function exportImage(imageName: string): Promise<void> {
    return new Promise(async (resolve, reject) => {
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
            // In the filename, have the image name, tag, and platfoxrm
            const fileName = slug(`${data.RepoTags[0]}-${data.Architecture}`) + '.tar';
            const imageData = await image.get();
            const readableStream = imageData;
            const exportPath = path.join(exportDirectory, fileName);
            const writeStream = fs.createWriteStream(exportPath);
            readableStream.pipe(writeStream);
            log.debug(imageData);
        } catch (err) {
            reject(err);
        }
    });
}
// Promise is needed since the function is async
// async function dockerLogin(): Promise<string | null> {
//     try {
//         const response = await axios.post("https://hub.docker.com/v2/users/login",
//             {
//                 username: configuration.get('docker.dockerHub.username'),
//                 password: configuration.get('docker.dockerHub.password')
//             },
//             {
//                 headers: {
//                     "Content-Type": "application/json"
//                 }
//             });
//         const token = response.data.token;
//         log.debug(`Docker login token: ${token}`);
//         return token;
//     }
//     catch (error) {
//         log.error(error);
//         log.debug(`data: ${error.response.data}`);
//         return null;
//     }

// }


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