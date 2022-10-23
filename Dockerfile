FROM node:19-slim as builder
WORKDIR /zte
COPY package.json .
COPY *.js .
RUN npm install
EXPOSE 3000

CMD [ "node", "index.js" ]