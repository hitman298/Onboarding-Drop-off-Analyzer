import os
import requests

HF_API_TOKEN = os.getenv("HF_API_TOKEN")

def get_sentiment_hf(comment_text):
    headers = {"Authorization": f"Bearer {HF_API_TOKEN}"}
    data = {"inputs": comment_text}
    resp = requests.post(
        "https://api-inference.huggingface.co/models/distilbert-base-uncased-finetuned-sst-2-english",
        headers=headers, json=data, timeout=20
    )
    result = resp.json()
    if isinstance(result, list) and result:
        label = result[0].get('label', '').lower()
        if label == "positive":
            return "positive"
        elif label == "negative":
            return "negative"
    return "neutral"
