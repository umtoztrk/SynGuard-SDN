# Hızlı ve hafif bir Node.js 20 imajı kullanıyoruz
FROM node:20-alpine

WORKDIR /app

# Önce paket listelerini kopyalayıp kurulum yapıyoruz
COPY package*.json ./
RUN npm install

# Frontend kodlarının tamamını kopyalıyoruz
COPY . .

# Vite'ın varsayılan portunu açıyoruz
EXPOSE 5173

# Projeyi her yerden erişilebilir şekilde ayağa kaldırıyoruz
CMD ["npm", "run", "dev", "--", "--host"]
