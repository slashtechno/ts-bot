# Mirror what?  
A Slack bot written in TypeScript for mirroring Docker images between Docker Hub and a private registry or exporting a Docker image to a tarball.  
## Installation and setup  
1. Clone the repository.
2. Install the dependencies with `npm install`.
3. Build the project with `npm run build`.
4. Copy the `.env.example` file to `.env` and fill in the required values.
    5. Reference `slack-app-manifest.yml` to setup the Slack app.
## Usage  
* Run the bot with `node .`.
* Clone an image to the private registry with `/clone-docker-image  <image>`  
    * Example: `/clone-docker-image library/hello-world:latest`  
* Export an image to the export directory with `/clone-docker-image  <image>`  
    * Example: `/export-docker-image library/hello-world:latest`  