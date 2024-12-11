from flask import Blueprint, request, jsonify
from .models import Certificate, db
from .tasks import check_certificate
import pandas as pd
from io import StringIO
from datetime import datetime
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

api_bp = Blueprint('api', __name__)

@api_bp.route('/certificates', methods=['GET'])
def list_certificates():
    try:
        certificates = Certificate.query.all()
        return jsonify([cert.to_dict() for cert in certificates])
    except Exception as e:
        logger.error(f"Error listing certificates: {str(e)}")
        return jsonify({'error': str(e)}), 500

@api_bp.route('/certificates', methods=['POST'])
def add_certificate():
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No JSON data provided'}), 400

        url = data.get('url')
        if not url:
            return jsonify({'error': 'URL is required'}), 400

        logger.info(f"Adding certificate for URL: {url}")

        existing = Certificate.query.filter_by(url=url).first()
        if existing:
            return jsonify({'error': 'URL already exists'}), 409

        cert = Certificate(
            url=url,
            status='pending',
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        db.session.add(cert)
        db.session.commit()

        # Trigger async certificate check
        logger.info(f"Triggering certificate check for ID: {cert.id}")
        check_certificate.apply_async(args=[cert.id], task_id=f'check_certificate_{cert.id}', queue='celery')

        return jsonify(cert.to_dict()), 201
    except Exception as e:
        logger.error(f"Error adding certificate: {str(e)}")
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@api_bp.route('/certificates/import', methods=['POST'])
def import_certificates():
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file uploaded'}), 400

        file = request.files['file']
        if file.filename == '' or not file.filename.endswith('.csv'):
            return jsonify({'error': 'Invalid file format'}), 400

        content = file.read().decode('utf-8')
        df = pd.read_csv(StringIO(content))
        
        if 'url' not in df.columns:
            return jsonify({'error': 'CSV must contain a "url" column'}), 400

        results = {
            'added': 0,
            'skipped': 0,
            'errors': []
        }

        for url in df['url']:
            try:
                existing = Certificate.query.filter_by(url=url).first()
                if existing:
                    results['skipped'] += 1
                    continue

                cert = Certificate(
                    url=url,
                    status='pending',
                    created_at=datetime.utcnow(),
                    updated_at=datetime.utcnow()
                )
                db.session.add(cert)
                db.session.commit()

                # Trigger async certificate check
                check_certificate.apply_async(args=[cert.id], task_id=f'check_certificate_{cert.id}', queue='celery')
                
                results['added'] += 1
            except Exception as e:
                results['errors'].append(f'Error adding {url}: {str(e)}')
                db.session.rollback()

        return jsonify(results), 201

    except Exception as e:
        logger.error(f"Error importing certificates: {str(e)}")
        return jsonify({'error': f'Error processing CSV: {str(e)}'}), 400

# Get certificate by ID
@api_bp.route('/certificates/<int:cert_id>', methods=['GET'])
def get_certificate(cert_id):
    try:
        cert = Certificate.query.get(cert_id)
        if not cert:
            return jsonify({'error': 'Certificate not found'}), 404
        return jsonify(cert.to_dict())
    except Exception as e:
        logger.error(f"Error getting certificate {cert_id}: {str(e)}")
        return jsonify({'error': str(e)}), 500

# Delete certificate by ID
@api_bp.route('/certificates/<int:cert_id>/delete', methods=['DELETE'])
def delete_certificate(cert_id):
    try:
        cert = Certificate.query.get(cert_id)
        if not cert:
            return jsonify({'error': 'Certificate not found'}), 404
        db.session.delete(cert)
        db.session.commit()
        return jsonify({'message': 'Certificate deleted successfully'})
    except Exception as e:
        logger.error(f"Error deleting certificate {cert_id}: {str(e)}")
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@api_bp.route('/certificates/<int:cert_id>/refresh', methods=['POST'])
def refresh_certificate(cert_id):
    try:
        cert = Certificate.query.get_or_404(cert_id)
        check_certificate.apply_async(args=[cert.id], task_id=f'check_certificate_{cert.id}', queue='celery')
        return jsonify({'message': 'Certificate refresh scheduled'})
    except Exception as e:
        logger.error(f"Error refreshing certificate {cert_id}: {str(e)}")
        return jsonify({'error': str(e)}), 500

# Add a debug endpoint to check database connection
@api_bp.route('/debug/db-test', methods=['GET'])
def test_db():
    try:
        cert_count = Certificate.query.count()
        return jsonify({
            'status': 'success',
            'message': 'Database connection successful',
            'certificate_count': cert_count
        })
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

# Add new endpoint for updating refresh interval
@api_bp.route('/settings/refresh-interval', methods=['POST'])
def update_refresh_interval():
    try:
        data = request.get_json()
        if not data or 'interval' not in data:
            return jsonify({'error': 'Interval is required'}), 400

        interval = int(data['interval'])
        if interval not in [1, 4, 8, 12, 16, 24]:
            return jsonify({'error': 'Invalid interval value'}), 400

        # Update Celery beat schedule
        app.conf.beat_schedule = {
            'check-certificates-every-n-hours': {
                'task': 'app.tasks.check_all_certificates',
                'schedule': interval * 3600,  # Convert hours to seconds
            },
        }

        return jsonify({'message': f'Check interval updated to {interval} hours'}), 200
    except Exception as e:
        logger.error(f"Error updating refresh interval: {str(e)}")
        return jsonify({'error': str(e)}), 500
