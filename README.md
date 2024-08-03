# Video Call Example with Janus

This is a video call example using Janus Legacy. It utilizes the Janus Video Room plugin to create a video room. The application is built with vanilla JavaScript and includes a Docker Compose configuration for easy setup.

## Prerequisites

To run this application, you'll need to have the following installed:

* Docker.
* npm/yarn (It's not mandatory if you just want to view the app.)

## Getting Started

1. Clone this repository to your local machine:

```shell
git clone git@github.com:fsociety/janus-video-call-example.git
```

2. Optionally, you can choose to run the project in either "dev" or "prod" mode. By default, it runs in "dev" mode.
3. Configure the host settings on your machine based on your operating system:

* For Linux and macOS users, open a terminal and execute the following command to edit the hosts file:

```shell
  sudo nano /etc/hosts
```

* For Windows users, open your text editor as an administrator and open the following file:

```
c:\Windows\System32\Drivers\etc\hosts
```

Add the following lines at the end of the file:

```
127.0.0.1 video-call.test socket.video-call.test api.video-call.test janus.video-call.test
```

7. Finally, open your web browser and access the application at https://video-call.test.

## Usage

Once the application is running, you can perform the following steps:

1. Open the application in a supported web browser.
2. Enter a unique room ID or join an existing room.
3. Grant access to your camera and microphone when prompted.
4. Enjoy your video call experience!

## Troubleshooting

* If you encounter any issues during the setup or usage of the application, please refer to the [Janus Legacy documentation](https://janus-legacy.conf.meetecho.com/docs/).
* For general support or questions, you can also consult the Janus Legacy community forum.

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
