# Buildimage used for creating a local build
# Since it is intended to run on Amazon Linux we need to install binaries
# for the internally used sharp package that match this distribution

FROM amazon/aws-sam-cli-emulation-image-nodejs14.x

# Install yarn
RUN npm i -g yarn

WORKDIR /app

COPY . .

RUN yarn --frozen-lockfile &&\
    yarn build
