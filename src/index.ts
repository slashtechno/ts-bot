import configuration from './config.js';
import log from 'loglevel';
import {WebClient} from '@slack/web-api';
import pkg from '@slack/bolt';
const { App } = pkg;
import path, { resolve } from 'path';
import Docker from 'dockerode';
// https://github.com/simov/slugify/issues/24#issuecomment-629725749
import slug from 'limax';
import fs from 'fs';
const app = new App({
    appToken: configuration.get('slack.appToken'),
    token: configuration.get('slack.botToken'),
    socketMode: true,
});
const web = new WebClient(configuration.get('slack.botToken'));


const docker = new Docker();

// TODO: Add authentication when pulling

app.command(
    /.*-docker-image$/,
    // https://api.slack.com/interactivity/slash-commands#app_command_handling
    async ({ command, ack, respond }) => {
        await ack();
        // Pull the image
        const image = command.text;
        // Check if the user is allowed to use the app
        const allowedRole = configuration.get('slack.allowedUserGroupId');
        // If the allowed role is not set, allow all roles
        if (allowedRole === '') {
            log.debug('Allowed role is not set; allowing all roles');
        } else {
            // Get all roles for the user
            // https://api.slack.com/methods/usergroups.users.list
            const users = await app.client.usergroups.users.list({usergroup: allowedRole});
            if (!users.users.includes(command.user_id)) {
                await respond(`You are not in the user group allowed to use this app`);
                return;
            } else {
                log.debug(`User ${command.user_id} is in the allowed user group`);
            }
        }
        await respond(`Pulling image: ${image}`);
        await docker.pull(image).then(async () => {
            log.info(`Pulled image: ${image}`);
            await respond(`Pulled image: ${image}`);
        }).catch(async (error) => {
            await respond(`Error pulling image: ${image}; check the logs for more information`);
            log.error(error);
        });
        switch (command.command) {
            case '/export-docker-image':
                exportImage(image).then(async () => {
                    await respond(`Exported image: ${image}`);
                }).catch(async (error) => {
                    await respond(`Error exporting image: ${image}; check the logs for more information`);
                    log.error(error);
                });
                break;
            case '/clone-docker-image':
                cloneImage(image).then(async () => {
                    await respond(`Cloned image: ${image}`);
                }).catch(async (error) => {
                    await respond(`Error cloning image: ${image}; check the logs for more information`);
                    log.error(error);
                });
                break;
            default:
                respond(`Command not recognized: ${command.command}`);
        }
    }

)


async function cloneImage(imageName: string): Promise<void> {
    return new Promise(async (resolve, reject) => {
        try {
            const image = docker.getImage(imageName);
            const data = await image.inspect();
            // log.debug(data);
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
                    return;
                }
                log.info(`Pushed image: ${newImageName}:${tag}`);
                resolve();
                // https://github.com/apocas/dockerode/issues/743#issuecomment-1725256963
                // res.pipe(process.stdout);
            });
        } catch (err) {
            reject(err);
            return;
        }
    });
}

async function exportImage(imageName: string): Promise<void> {
    return new Promise(async (resolve, reject) => {
        try {
            const image = docker.getImage(imageName);
            const data = await image.inspect();
            // log.debug(data);
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
            // log.debug(imageData);
        } catch (err) {
            reject(err);
            return;
        }
        resolve();
    });
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