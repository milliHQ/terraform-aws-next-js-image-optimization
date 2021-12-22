# [Choice] Node.js version (use -bullseye variants on local arm64/Apple Silicon): 16, 14, 12, 16-bullseye, 14-bullseye, 12-bullseye, 16-buster, 14-buster, 12-buster
ARG VARIANT=14-bullseye
FROM mcr.microsoft.com/vscode/devcontainers/typescript-node:${VARIANT}

##
# Install AWS SAM CLI through homebrew
##

# Install Homebrew
# https://github.com/microsoft/vscode-dev-containers/blob/main/script-library/docs/homebrew.md
ENV BREW_PREFIX=/home/linuxbrew/.linuxbrew
ENV PATH=${BREW_PREFIX}/sbin:${BREW_PREFIX}/bin:${PATH}
COPY library-scripts/homebrew-debian.sh /tmp/library-scripts/
RUN apt-get update && bash /tmp/library-scripts/homebrew-debian.sh

# Install SAM CLI
RUN \
  brew tap aws/tap &&\
  brew install aws-sam-cli &&\
  sam --version
