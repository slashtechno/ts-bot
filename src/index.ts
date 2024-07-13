import configuration from './config.js';
import log from 'loglevel';
import pkg from '@slack/bolt';
import axios from 'axios';
import path from 'path';
import Docker from 'dockerode';
// https://github.com/simov/slugify/issues/24#issuecomment-629725749
import slug from 'limax';
import git from 'isomorphic-git'
const { App } = pkg;
import fs from 'fs';
import * as isoHttp from 'isomorphic-git/http/node/index.js';

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
    '/export-docker-image',
    async ({ command, ack, respond }) => {
        await ack();
        // docker.listContainers({ all: true }, function (err, containers) {
        //     containers.forEach(function (containerInfo) {
        //         docker.getContainer(containerInfo.Id).inspect(function (err, data) {
        //             log.debug(data);
        //         });
        //     });
        // }
        // );

        // TODO: Figure out why inspect sometimes states that the image does not exist. Maybe use `finally`?
        const image = command.text;
        await respond(`Pulling image: ${image}`);
        docker.pull(image)
            .finally(async () => {
                await exportImage(image).then(async () => {
                    log.info(`Exported image: ${image}`);
                    await respond(`Exported image: ${image}`);
                });
            })
            .catch(async (error) => {
                await respond(`Error exporting image: ${image}; check the logs for more information`);
                log.error(error);
            });
    }
);

async function exportImage(imageName: string): Promise<void> {
    const exportDirectory = configuration.get('docker.destination.exportDirectory.exportDirectoryPath');

    try {
        const image = docker.getImage(imageName);
        const data = await image.inspect();
        log.debug(data);
        // Create the directory if it does not exist
        // https://stackoverflow.com/a/26815894/18270659
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

        writeStream.on('finish', async () => {
            
                // If the docker.destination.exportDirectory.gitEnabled is true, commit the file to the repo and push 
                if (configuration.get('docker.destination.exportDirectory.git.enabled')) {
                    log.info(`Git is enabled; committing and pushing the exported image to the repository`);
                    // https://isomorphic-git.org/docs/en/snippets
                    // The local Git config should apply. At the time of writing, the global Git config is not used
                    const author = {
                        name: configuration.get('docker.destination.exportDirectory.git.author.name'),
                        email: configuration.get('docker.destination.exportDirectory.git.author.email')
                    }
                    if (author.email === "" || author.name === "") {
                        log.warn(`Author name or email is null; will attempt to use .git/config`);
                    }
                    const repo = {
                        fs: fs,
                        dir: exportDirectory,
                        http: isoHttp,
                        ref: configuration.get('docker.destination.exportDirectory.git.branch'),
                        remote: configuration.get('docker.destination.exportDirectory.git.remoteName'),
                        onAuth: () => ({
                            username: configuration.get('docker.destination.exportDirectory.git.credentials.username'),
                            password: configuration.get('docker.destination.exportDirectory.git.credentials.password')
                        }),
                        force: configuration.get('docker.destination.exportDirectory.git.force'),
                    }
                    // `...` is the spread operator and adds the key-value pairs from the object
                    // await git.fetch({ ...repo });
                    // git.add({ ...repo, filepath: fileName });
                    await git.statusMatrix(repo).then((status) =>
                        Promise.all(
                            status.map(([filepath, , worktreeStatus]) =>
                                worktreeStatus ? git.add({ ...repo, filepath }) : git.remove({ ...repo, filepath })
                            )
                        )
                    )
                    const hash = await git.commit({ ...repo, message: `Exported image: ${imageName}` })
                    .then((hash) => {
                        log.debug(`Commit hash: ${hash}`);
                        return hash;
                    })
                    .catch((error) => {
                        log.error(error);
                    }).finally(async () => {
                        await git.push({ ...repo });
                    });
                    // log.debug(`Commit hash: ${hash}`);
                    // await git.merge({ ...repo, theirs: 'HEAD', ours: hash });
                    // await git.push({ ...repo });
                }
        });
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