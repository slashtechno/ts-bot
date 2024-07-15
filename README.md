# Mirror what?  
A Slack bot written in TypeScript for mirroring Docker images between Docker Hub and a private registry or exporting a Docker image to a tarball.  
## Installation and setup  
## Node.js and npm  
1. Clone the repository.
2. Install the dependencies with `npm install`.
3. Build the project with `npm run build`.
4. Copy the `.env.example` file to `.env` and fill in the required values.
    * Reference `slack-app-manifest.yml` to setup the Slack app.  
## Docker  
1. Clone the repository.
2. Run with `docker compose up -d`.
    * `-d` runs the containers in the background.
    * `docker-compose.yml` is configured to use the `.env` file but can be edited for further customization.  
## Usage  
* Run the bot with `node .`.
* Clone an image to the private registry with `/clone-docker-image  <image>`  
    * Example: `/clone-docker-image library/hello-world:latest`  
* Export an image to the export directory with `/clone-docker-image  <image>`  
    * Example: `/export-docker-image library/hello-world:latest`  