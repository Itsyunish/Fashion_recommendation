FROM node:20-alpine AS build
WORKDIR /app
COPY package.json ./
RUN npm install
COPY . .
RUN npm run build

FROM python:3.13-slim
WORKDIR /app
COPY --from=build /app/dist /app
EXPOSE 3000
CMD ["python", "-m", "http.server", "3000"]
