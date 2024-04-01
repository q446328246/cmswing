#基于node
FROM node
#镜像标签
LABEL author = "446328246@qq.com"
LABEL version = "1.0"
LABEL description = "docker node test"
#工作目录
WORKDIR /cms
#把当前目录的文件拷贝到data下面
COPY ./ /cms

RUN yarn install
#暴露端口
EXPOSE 7001
#启动项目
CMD [ "yarn", "run","dev"]

