# [Choice] Node.js version (use -bullseye variants on local arm64/Apple Silicon): 16, 14, 12, 16-bullseye, 14-bullseye, 12-bullseye, 16-buster, 14-buster, 12-buster
ARG VARIANT=14-bullseye
FROM mcr.microsoft.com/vscode/devcontainers/typescript-node:${VARIANT}

# Homebrew
ENV BREW_PREFIX=/home/linuxbrew/.linuxbrew
ENV PATH=${BREW_PREFIX}/sbin:${BREW_PREFIX}/bin:${PATH}

# Docker
ENV DOCKER_BUILDKIT=1

COPY library-scripts/*.sh /tmp/library-scripts/

RUN apt-get update \
  && /bin/bash /tmp/library-scripts/common-debian.sh \
  && /bin/bash /tmp/library-scripts/homebrew-debian.sh \
  && /bin/bash /tmp/library-scripts/terraform-debian.sh "latest" "none" "none" \
  && /bin/bash /tmp/library-scripts/docker-in-docker-debian.sh \
  && brew tap aws/tap \
  && brew install aws-sam-cli

# Setting the ENTRYPOINT to docker-init.sh will configure non-root access
# to the Docker socket. The script will also execute CMD as needed.
ENTRYPOINT ["/usr/local/share/docker-init.sh"]
VOLUME [ "/var/lib/docker" ]
CMD ["sleep", "infinity"]
