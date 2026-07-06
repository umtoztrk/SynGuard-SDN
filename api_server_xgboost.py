from fastapi import FastAPI
from pydantic import BaseModel
import pandas as pd
import xgboost as xgb
import uvicorn
import time  # ⏱️ ADDED FOR TIMING
import requests
import threading

app = FastAPI()

print("\n" + "="*50)
print("[*] Loading XGBoost AI Engine...")
model = xgb.XGBClassifier()
model.load_model("xgboost_model.json")
print("[+] Model loaded successfully with DataFrame compatibility!")
print("="*50 + "\n")

class FeatureSet(BaseModel):
    Flow_Pkts_per_s: float
    Flow_Byts_per_s: float
    Pkt_Size_Avg: float
    Flow_IAT_Mean: float

class Payload(BaseModel):
    flow_id: str
    src_ip: str
    dst_ip: str
    features: FeatureSet

# --- FUNCTION TO SEND LIVE DATA TO DASHBOARD ---
def send_to_dashboard(src_ip, status, prob, det_time):
    try:
        url = "http://node-backend:3001/api/traffic-log" 
        payload = {
            "src_ip": src_ip,
            "status": status,
            "probability": float(prob),
            "detection_time": f"{det_time:.1f} ms" # ACTUAL time measured by Python!
        }
        requests.post(url, json=payload, timeout=1) 
    except Exception as e:
        print(f"\n\033[91m[!] DASHBOARD BAĞLANTI HATASI: {e}\033[0m")
        #pass
# --------------------------------------------------

@app.post("/predict")
async def predict(data: Payload):
    # ⏱️ START THE TIMER
    start_time = time.time() 
    
    f = data.features
    
    if f.Pkt_Size_Avg <= 70:
        f.Pkt_Size_Avg = 0.0
        f.Flow_Byts_per_s = 0.0

    iat_micros = f.Flow_IAT_Mean * 1000000 
    
    data_dict = {
        'Flow Pkts/s': [f.Flow_Pkts_per_s],
        'Flow Byts/s': [f.Flow_Byts_per_s],
        'Pkt Size Avg': [f.Pkt_Size_Avg],
        'Flow IAT Mean': [iat_micros]
    }
    vector_df = pd.DataFrame(data_dict)
    
    # AI PREDICTION
    prediction = model.predict(vector_df)[0]
    
    # Calculate DDoS probability (percentage) to fill the gauge in the UI!
    try:
        prob = float(model.predict_proba(vector_df)[0][1])
    except:
        prob = 1.0 if prediction == 1 else 0.0
    
    # ⏱️ STOP THE TIMER
    end_time = time.time()
    decision_time = end_time - start_time
    decision_ms = decision_time * 1000  # Convert seconds to milliseconds (ms)
    
    label = "attack" if int(prediction) == 1 else "benign"
    action = "drop" if label == "attack" else "allow"
    
    # Formatted status message for the dashboard
    dashboard_status = "DDoS (DROP)" if label == "attack" else "Normal (ALLOW)"
    
    # NOTIFY THE DASHBOARD (Run in background to avoid network lag)
    threading.Thread(target=send_to_dashboard, args=(data.src_ip, dashboard_status, prob, decision_ms)).start()
    
    color = '\033[91m' if label == "attack" else '\033[92m'
    print(f"\n[+] Flow: {data.src_ip} -> {data.dst_ip}")
    print(f"    ├─ Pkts/s : {f.Flow_Pkts_per_s:.2f}")
    print(f"    ├─ Byts/s : {f.Flow_Byts_per_s:.2f}")
    print(f"    ├─ Size   : {f.Pkt_Size_Avg:.1f}")
    print(f"    ├─ IAT    : {iat_micros:.2f} µs") 
    print(f"    ├─ ⏱️ AI Decision Time: {decision_time:.5f} sec ({decision_ms:.2f} ms)")
    print(f"    => {color}DECISION: {label.upper()} | ACTION: {action.upper()}\033[0m")
    
    return {"action": action, "label": label}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="warning")
