# 1. Utiliser une image Node.js officielle et légère
FROM node:18-slim

# 2. Définir le répertoire de travail dans le conteneur
WORKDIR /usr/src/app

# 3. Copier les fichiers de dépendances et les installer
COPY package*.json ./
RUN npm install --only=production

# 4. Copier le reste du code de l'application
COPY . .

# 5. Exposer le port sur lequel l'application écoute
EXPOSE 8080

# 6. Commande pour démarrer l'application
CMD [ "node", "server.js" ]