from flask import Blueprint, request, jsonify

ingestion_bp = Blueprint('data_ingestion', __name__)

@ingestion_bp.route('/upload', methods=['POST'])
def upload_data():
    """
    Receives onboarding session data (CSV/JSON upload).
    Currently stores or logs data only (expand as needed).
    """
    data = request.get_json()
    # For demo, just return what was received
    return jsonify({"message": "Data received!", "data": data})
