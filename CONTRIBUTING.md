# Contributing

## Testing

### Run e2e-tests locally

In order to run the e2e-tests locally, you need to install the following software:
- [Docker Desktop + Docker Compose](https://www.docker.com/products/docker-desktop)  
  (Docker Compose comes bundled with Docker Desktop on MacOS and Windows)
- [AWS SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-cli-install.html)

You should check after install if both are available from your command-line:
```sh
docker --version
# > Docker version 20.10.2, build 2291f61

docker-compose --version
# > docker-compose version 1.27.4, build 40524192

sam --version
# > SAM CLI, version 1.17.0
```

Before running the e2e-tests, make sure that the local S3 emulator from docker-compose is running.
From the root of the project run:

```sh
docker-compose up -d
```

After that you should be able to execute the e2e-tests locally by running the `test:e2e` task:

```sh
yarn test:e2e
```
