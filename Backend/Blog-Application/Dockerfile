# 1. Use Node.js as the base image
FROM node:22-alpine

# 2. Set the working directory inside the container
WORKDIR /app

# 3. Copy package files
COPY package*.json ./

# 4. Install dependencies
RUN npm install

# 5. Copy the project files
COPY . .

# 6. Expose the backend port
EXPOSE 3000

# 7. Start the backend
CMD ["npm", "start"]