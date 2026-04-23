from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, App
import json

apps_bp = Blueprint('apps', __name__)


@apps_bp.route('', methods=['GET'])
@jwt_required()
def list_apps():
    user_id = get_jwt_identity()
    apps = App.query.filter_by(user_id=user_id).order_by(App.updated_at.desc()).all()
    return jsonify([a.to_dict() for a in apps])


@apps_bp.route('', methods=['POST'])
@jwt_required()
def create_app():
    user_id = get_jwt_identity()
    data = request.get_json()
    name = data.get('name', '').strip()
    if not name:
        return jsonify({'error': '应用名称不能为空'}), 400

    app = App(
        user_id=user_id,
        name=name,
        description=data.get('description', ''),
        icon=data.get('icon', '📋'),
    )
    db.session.add(app)
    db.session.commit()
    return jsonify(app.to_dict()), 201


@apps_bp.route('/<int:app_id>', methods=['GET'])
@jwt_required()
def get_app(app_id):
    user_id = get_jwt_identity()
    app = App.query.filter_by(id=app_id, user_id=user_id).first_or_404()
    result = app.to_dict()
    result['tables'] = [t.to_dict() for t in app.tables.all()]
    return jsonify(result)


@apps_bp.route('/<int:app_id>', methods=['PUT'])
@jwt_required()
def update_app(app_id):
    user_id = get_jwt_identity()
    app = App.query.filter_by(id=app_id, user_id=user_id).first_or_404()
    data = request.get_json()

    if 'name' in data:
        app.name = data['name'].strip()
    if 'description' in data:
        app.description = data['description']
    if 'icon' in data:
        app.icon = data['icon']
    if 'config' in data:
        app.config = json.dumps(data['config'])

    db.session.commit()
    return jsonify(app.to_dict())


@apps_bp.route('/<int:app_id>', methods=['DELETE'])
@jwt_required()
def delete_app(app_id):
    user_id = get_jwt_identity()
    app = App.query.filter_by(id=app_id, user_id=user_id).first_or_404()
    # Manually delete children to avoid SQLAlchemy cascade UPDATE issues
    from models import Form, Record, Table, AppMember
    for table in app.tables.all():
        Form.query.filter_by(table_id=table.id).delete()
        Record.query.filter_by(table_id=table.id).delete()
        Table.query.filter_by(id=table.id).delete()
    AppMember.query.filter_by(app_id=app_id).delete()
    db.session.delete(app)
    db.session.commit()
    return jsonify({'message': '删除成功'})
