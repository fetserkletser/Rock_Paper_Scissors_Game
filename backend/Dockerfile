FROM node:18-alpine

WORKDIR /app

# Ensure log directory and central log file exist for admin log viewer
RUN mkdir -p /var/log && echo "[RPS-APP] Central logging initialized for RPS Backend" > /var/log/rps-central.log

COPY package*.json ./

RUN npm install --omit=dev

COPY . .

EXPOSE 4000

CMD ["npm", "start"]
