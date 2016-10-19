FROM node:6-slim

WORKDIR /root/app

ADD package.json package.json
RUN npm install
ADD typings.json typings.json
RUN npm run typings

ADD . .

RUN npm run build

EXPOSE 3000 

CMD ["node", "bin/www"]
