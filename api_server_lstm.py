from fastapi import FastAPI
from pydantic import BaseModel
import numpy as np
import tensorflow as tf
import pickle
from collections import deque
import uvicorn
import requests
import threading

app = FastAPI()

print("[YÜKLENİYOR] LSTM Modeli ve Scaler hafızaya alınıyor...")

MODEL_PATH = "gercek_model.keras" 
SCALER_PATH = "scaler.pkl"

# Modeli ve Scaler'ı Yükle
model = tf.keras.models.load_model(MODEL_PATH)
with open(SCALER_PATH, 'rb') as f:
    scaler = pickle.load(f)

# Senin Notebook'un tespit ettiği en iyi eşik değeri!
THRESHOLD = 0.88  

print(f"[HAZIR] LSTM Yapay Zeka Canlı Savunma İçin Bekliyor! (Eşik: {THRESHOLD})")

flow_buffer = {}

class FlowData(BaseModel):
    flow_id: str
    src_ip: str
    dst_ip: str
    features: dict

def send_to_dashboard(src_ip, status, prob):
    try:
        # Node.js backend'ine veriyi fırlat
        url = "http://127.0.0.1:3001/api/traffic-log" 
        payload = {
            "src_ip": src_ip,
            "status": status,
            "probability": float(prob)
        }
        # Timeout'u kısa tutuyoruz ki ağ kilitlenmesin
        requests.post(url, json=payload, timeout=1) 
    except Exception as e:
        pass # Dashboard kapalıysa hata verme, sessizce geç

@app.post("/predict")
def predict_flow(data: FlowData):
    f = data.features
    flow_id = data.flow_id

    # -------------------------------------------------------------
    # 👑 ŞAMPİYONUN MÜHENDİSLİK HİLELERİ (L2 / L7 UYUMU)
    # -------------------------------------------------------------
    # 1. 70 Byte (Boş Payload) Filtresi
    pkt_size = f["Pkt_Size_Avg"]
    if pkt_size <= 70:
        pkt_size = 0.0
        flow_byts_s = 0.0  # Paket boşsa bant genişliği de sıfırdır
    else:
        flow_byts_s = f["Flow_Byts_per_s"]

    # 2. IAT Mikrosaniye (µs) Dönüşümü
    iat_micros = f["Flow_IAT_Mean"] * 1000000.0

    # 3. Modelin Eğitildiği Formattaki Gerçek Öznitelikler
    current_features = [
        f["Flow_Pkts_per_s"],
        flow_byts_s,
        pkt_size,
        iat_micros
    ]
    # -------------------------------------------------------------

    # 4. Veriyi Ölçekle
    scaled_features = scaler.transform([current_features])[0]

    # 5. Zekice Hafıza Yönetimi (Sıfır padding YOK, Anında kopyalama VAR!)
    if flow_id not in flow_buffer:
        flow_buffer[flow_id] = deque(maxlen=10)
        # İlk gelen veriyi 10 kere kopyalayarak kuyruğu anında doldur
        for _ in range(10):
            flow_buffer[flow_id].append(scaled_features)
    else:
        # Yeni gelen veriyi ekle
        flow_buffer[flow_id].append(scaled_features)

    # 6. Modeli tahmin için hazırla -> Shape: (1, 10, 4)
    sequence = list(flow_buffer[flow_id])
    X_predict = np.array([sequence])

    # 7. TAHMİN (PREDICTION)
    prediction = model.predict(X_predict, verbose=0)[0][0]

    # 8. Yeni Eşik Değeriyle Karar (Notebook'taki 0.88 değeri)
    # ... (önceki model.predict kodları vb. buralar aynı) ...

    # 8. Yeni Eşik Değeriyle Karar (0.88)
    if prediction >= THRESHOLD:
        print(f"🚨 [DDoS TESPİT] Kaynak: {data.src_ip} | Olasılık: %{prediction*100:.2f} -> DROP")
        
        # DASHBOARD'A HABER VER (Arka planda çalıştır ki SDN yavaşlamasın)
        threading.Thread(target=send_to_dashboard, args=(data.src_ip, "DDoS (DROP)", prediction)).start()
        
        return {"action": "drop"}
    else:
        print(f"✅ [NORMAL] Kaynak: {data.src_ip} | Olasılık: %{prediction*100:.2f}")
        
        # DASHBOARD'A HABER VER
        threading.Thread(target=send_to_dashboard, args=(data.src_ip, "Normal (ALLOW)", prediction)).start()
        
        return {"action": "allow"}

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000)