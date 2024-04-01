#node镜像版本
FROM node
#声明作者

#在image中创建文件夹
RUN mkdir -p /home/cmswing
#将该文件夹作为工作目录
WORKDIR /home/cmswing

# 将node工程下所有文件拷贝到Image下的文件夹中
COPY . /home/cmswing

#使用RUN命令执行npm install安装工程依赖库
RUN npm install

#暴露给主机的端口号
EXPOSE 7000
#执行npm start命令，启动Node工程
CMD npm run dev
