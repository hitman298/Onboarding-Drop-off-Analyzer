import os
import requests

def get_ai_insights(data):
    """
    Analyze onboarding funnel/user session data using AI.
    Start with mock results, add Hugging Face, Cohere, etc. later.
    """
    funnel = data.get('funnel', [
        {"step": "Create Account", "users": 100},
        {"step": "Verify Email", "users": 62},
        {"step": "Finish Profile", "users": 28},
    ])
    sessions = data.get('user_sessions', [])
    # --- MOCK AI Section (replace with real API call later) ---
    insights = [
        "High drop-off at 'Verify Email'—users may find OTP confusing.",
        "Many sessions show rage-clicking on 'Resend OTP' button."
    ]
    suggestions = [
        "Add animated guide for email verification",
        "Make 'Resend OTP' button more visible and add loading feedback"
    ]
    # --- Example: Here’s how to call Hugging Face Inference API (add your token) ---
    # response = requests.post(
    #     "https://api-inference.huggingface.co/models/<model>",
    #     headers={"Authorization": f"Bearer {os.getenv('HF_API_KEY')}"},
    #     json={"inputs": "\n".join([s['notes'] for s in sessions])}
    # )
    # If using, parse response.json() to extract real insights
    return funnel, insights, suggestions
