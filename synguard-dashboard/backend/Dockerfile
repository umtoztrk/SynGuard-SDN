FROM node:20-slim
WORKDIR /app

# 1. Bütün dosyaları içeri al (senin bilgisayarındaki bozuk node_modules dahil)
COPY . .

# 2. İçeri giren o bozuk klasörleri acımadan tamamen sil!
RUN rm -rf node_modules package-lock.json

# 3. Gerekli derleme araçlarını kur
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

# 4. Tertemiz ve Docker'a özel kurulum yap (En sonda olduğu için kimse ezemeyecek!)
RUN npm install --build-from-source

EXPOSE 3001
CMD ["npm", "start"]
