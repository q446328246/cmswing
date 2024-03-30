FROM node
COPY . /cmswing
EXPOSE 8360
WORKDIR /cmswing
CMD npm run dev
