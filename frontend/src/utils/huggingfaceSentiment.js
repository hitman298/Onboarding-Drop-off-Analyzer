// Place this in src/utils/huggingfaceSentiment.js
export async function analyzeSentimentHuggingFace(text) {
  const API_URL = "https://api-inference.huggingface.co/models/cardiffnlp/twitter-roberta-base-sentiment-latest";
  const headers = {
    Authorization: `Bearer ${process.env.REACT_APP_HF_API_KEY}`,
    'Content-Type': 'application/json',
  };

  const response = await fetch(API_URL, {
    method: "POST",
    headers,
    body: JSON.stringify({ inputs: text }),
  });

  if (!response.ok) return { label: "😶 Neutral", score: 0.0 };

  const [result] = await response.json();
  const emojiMap = {
    LABEL_0: "🤬 Negative",   NEGATIVE: "🤬 Negative",
    LABEL_1: "😶 Neutral",    NEUTRAL: "😶 Neutral",
    LABEL_2: "😃 Positive",   POSITIVE: "😃 Positive"
  };
  return {
    label: emojiMap[result.label] || "😶 Neutral",
    score: result.score
  };
}
