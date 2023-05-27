# Video Call Example with Janus

This is a video call example using Janus Legacy. It utilizes the Janus Video Room plugin to create a video room. The application is built with vanilla JavaScript and includes a Docker Compose configuration for easy setup.

## Prerequisites

To run this application, you'll need to have the following installed:

- Docker
- npm/yarn

## Getting Started

1. Clone this repository to your local machine:

  ```shell
  git clone git@github.com:fsociety/janus-video-call-example.git
  ```

2. Navigate to the root directory and install dependencies using yarn:
  ```shell
  cd janus-video-call-example

  yarn
  ```

3. Update Janus settings:
The Janus configuration files are located in the janus directory. Modify the configuration files to match your requirements.

4. Start the janus container using Docker Compose:
  ```shell
  docker-compose up
  ```
  
5. Start the application using yarn/npm:
  ```shell
  yarn serve
  ```
  
6. Open your web browser and access the application at http://localhost:8080/?room=room-id (replace room-id with the appropriate room id).

## Usage
Once the application is running, you can perform the following steps:

1. Open the application in a supported web browser.

2. Enter a unique room ID or join an existing room.

3. Grant access to your camera and microphone when prompted.

4. Enjoy your video call experience!

## Troubleshooting
- If you encounter any issues during the setup or usage of the application, please refer to the [Janus Legacy documentation](https://janus-legacy.conf.meetecho.com/docs/).

- For general support or questions, you can also consult the Janus Legacy community forum.

## Contributing
Contributions are welcome! If you'd like to contribute to this project, please follow these steps:
1. Fork the repository.
2. Create a new branch:
  ```shell
  git checkout -b my-feature
  ```
3. Make your changes and commit them.
4. Push the changes to your forked repository:
  ```shell
  git push origin my-feature
  ```
5. Open a pull request on the original repository.