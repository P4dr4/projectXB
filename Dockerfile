FROM node:16-alpine
LABEL version="1.0"
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
ENV MONGO_URL=mongodb://localhost:27017/projectx
EXPOSE 3000
CMD ["npm", "start"]