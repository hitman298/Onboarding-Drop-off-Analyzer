from flask import Flask
from flask_cors import CORS
from api.routes.analysis import analysis_bp
from api.routes.data_ingestion import ingestion_bp
from api.routes.report import report_bp

app = Flask(__name__)
CORS(app)  # Allow cross-origin requests for frontend React

# Register blueprints
app.register_blueprint(analysis_bp, url_prefix='/api/analysis')
app.register_blueprint(ingestion_bp, url_prefix='/api/ingest')
app.register_blueprint(report_bp, url_prefix='/api/report')

@app.route('/')
def home():
    return 'Onboarding Drop-Off Analyzer Backend Running!'

if __name__ == '__main__':
    app.run(debug=True)
