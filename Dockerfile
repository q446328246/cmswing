#node镜像版本
FROM node
#声明作者
COPY . /cms
WORKDIR /cms
EXPOSE 7001
RUN npm install
CMD npm run dev
