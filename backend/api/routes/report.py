from flask import Blueprint, request, jsonify

report_bp = Blueprint('report', __name__)

@report_bp.route('/send', methods=['POST'])
def send_report():
    """
    Sends a summary report to Slack/Notion (stub for now).
    """
    # TODO: Integrate with Slack/Notion in integrations/
    return jsonify({"message": "Report sent (stub)!"})
