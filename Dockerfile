FROM keymetrics/pm2:latest-stretch

WORKDIR /app

# Bundle APP files
COPY . .

# Install app dependencies
ENV NPM_CONFIG_LOGLEVEL warn
RUN npm install
RUN npm run build

COPY src/schema/types/schema.graphql dist/schema/types/

# Show current folder structure in logs
RUN ls -al -R

EXPOSE 4002

CMD [ "pm2-runtime", "start", "pm2.json" ]
