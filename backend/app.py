import os
import sys
from flask import Flask, jsonify
from flask_cors import CORS

# Add project root to sys.path so 'backend.*' imports resolve cleanly
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

from backend.models.database import init_db
from backend.services.vector_service import vector_service
from backend.routes.api import api_bp

def create_app():
    app = Flask(__name__)
    CORS(app, resources={r"/api/*": {"origins": "*"}})

    # App configuration
    app.config['MAX_CONTENT_LENGTH'] = 30 * 1024 * 1024  # 30 MB
    app.config['JSON_SORT_KEYS'] = False

    # Initialize SQLite database schema
    init_db()

    # Pre-initialize FAISS vector index
    try:
        vector_service.initialize_index()
    except Exception as e:
        print(f"Warning: Vector index initialization error: {e}")

    # Register blueprints
    app.register_blueprint(api_bp, url_prefix='/api')

    @app.errorhandler(404)
    def not_found(e):
        return jsonify({"success": False, "error": "Endpoint not found"}), 404

    @app.errorhandler(500)
    def server_error(e):
        return jsonify({"success": False, "error": "Internal server error"}), 500

    return app

app = create_app()

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    print(f"\n==========================================")
    print(f"  NoteWise AI Backend is starting on port {port}")
    print(f"  Health Check: http://127.0.0.1:{port}/api/health")
    print(f"==========================================\n")
    app.run(host='0.0.0.0', port=port, debug=True, use_reloader=False)
