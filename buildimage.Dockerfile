# Buildimage used for creating a local build
# Since it is intended to run on Amazon Linux we need to install binaries
# for the internally used sharp package that match this distribution

FROM registry.gitlab.com/dealmore/dealmore-build-images/lambdaci:nodejs12.x

WORKDIR /app

ADD tsconfig.json \
    ./lib/package.json \
    ./lib/*.ts \
    /app/

RUN ls -a /app

RUN npm i &&\
    npm run build
