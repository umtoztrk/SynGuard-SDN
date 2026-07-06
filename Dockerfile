# Temel imaj olarak hafif bir Python 3.10 sürümü kullanıyoruz
FROM python:3.10-slim

# Çalışma dizinini belirliyoruz
WORKDIR /app

# Sadece requirements dosyasını kopyalayıp bağımlılıkları kuruyoruz
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Tüm kodları konteynerin içine kopyalıyoruz
COPY . .

# FastAPI'nin dışarıya açılacağı portu belirtiyoruz
EXPOSE 8000

# Yapay Zeka API'sini başlatan komut
CMD ["uvicorn", "api_server_xgboost:app", "--host", "0.0.0.0", "--port", "8000"]
