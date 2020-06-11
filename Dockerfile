# Base image on node
FROM node:12

# Create app directory and move into it
WORKDIR /usr/src/app

# Copy all files into container
COPY . .

# Install packages
RUN npm install

# Expose port
EXPOSE 7086

# Run the app
CMD [ "node", "internal_search_engine.js" ]
