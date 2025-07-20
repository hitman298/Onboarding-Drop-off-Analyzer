from flask import Blueprint, request, jsonify
from services.ai_nlp import get_ai_insights
from services.sentiment import get_sentiment_hf

analysis_bp = Blueprint('analysis', __name__)

@analysis_bp.route('/dropoff', methods=['POST'])
def analyze_dropoff():
    """
    Receives onboarding funnel/user session data.
    Returns funnel, insights, recommendations, and sentiment analysis.
    """
    data = request.get_json()
    funnel, insights, suggestions = get_ai_insights(data)

    user_sessions = data.get("user_sessions", [])
    sentiments = []
    for comment in user_sessions:
        sentiment = get_sentiment_hf(comment) if comment.strip() else "neutral"
        sentiments.append({"text": comment, "sentiment": sentiment})

    return jsonify({
        "funnel": funnel,
        "insights": insights,
        "recommendations": suggestions,
        "sentiment": sentiments
    })
