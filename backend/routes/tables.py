from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, App, Table
import json
import re

tables_bp = Blueprint('tables', __name__)


def slugify(name):
    """把名称转成合法的 slug"""
    s = name.lower().strip()
    s = re.sub(r'[^\w\u4e00-\u9fff-]', '', s)  # 保留中文
    s = re.sub(r'[-\s]+', '-', s)
    return s[:80]


@tables_bp.route('/apps/<int:app_id>/tables', methods=['GET'])
@jwt_required()
def list_tables(app_id):
    user_id = get_jwt_identity()
    app = App.query.filter_by(id=app_id, user_id=user_id).first_or_404()
    tables = Table.query.filter_by(app_id=app_id).order_by(Table.created_at).all()
    return jsonify([t.to_dict() for t in tables])


@tables_bp.route('/apps/<int:app_id>/tables', methods=['POST'])
@jwt_required()
def create_table(app_id):
    user_id = get_jwt_identity()
    app = App.query.filter_by(id=app_id, user_id=user_id).first_or_404()
    data = request.get_json()

    name = data.get('name', '').strip()
    if not name:
        return jsonify({'error': '表名不能为空'}), 400

    slug = data.get('slug', '').strip() or slugify(name)
    # 防止重复 slug
    existing = Table.query.filter_by(app_id=app_id, slug=slug).first()
    if existing:
        slug = f"{slug}-{Table.query.filter_by(app_id=app_id).count() + 1}"

    # 默认字段
    default_fields = data.get('fields', [
        {'name': '标题', 'type': 'text', 'required': True},
        {'name': '状态', 'type': 'select', 'options': ['进行中', '已完成']},
    ])

    # 默认视图
    default_views = [
        {'id': 'grid-1', 'type': 'grid', 'name': '默认视图'},
    ]

    table = Table(
        app_id=app_id,
        name=name,
        slug=slug,
        description=data.get('description', ''),
        fields=json.dumps(default_fields),
        views=json.dumps(default_views),
    )
    db.session.add(table)
    db.session.commit()
    return jsonify(table.to_dict()), 201


@tables_bp.route('/tables/<int:table_id>', methods=['GET'])
@jwt_required()
def get_table(table_id):
    user_id = get_jwt_identity()
    table = Table.query.get_or_404(table_id)
    app = App.query.filter_by(id=table.app_id, user_id=user_id).first_or_404()
    result = table.to_dict()
    result['app_name'] = app.name
    return jsonify(result)


@tables_bp.route('/tables/<int:table_id>', methods=['PUT'])
@jwt_required()
def update_table(table_id):
    user_id = get_jwt_identity()
    table = Table.query.get_or_404(table_id)
    App.query.filter_by(id=table.app_id, user_id=user_id).first_or_404()
    data = request.get_json()

    if 'name' in data:
        table.name = data['name'].strip()
    if 'description' in data:
        table.description = data['description']
    if 'fields' in data:
        table.fields = json.dumps(data['fields'])
    if 'views' in data:
        table.views = json.dumps(data['views'])

    db.session.commit()
    return jsonify(table.to_dict())


@tables_bp.route('/tables/<int:table_id>', methods=['DELETE'])
@jwt_required()
def delete_table(table_id):
    user_id = get_jwt_identity()
    table = Table.query.get_or_404(table_id)
    App.query.filter_by(id=table.app_id, user_id=user_id).first_or_404()
    db.session.delete(table)
    db.session.commit()
    return jsonify({'message': '删除成功'})
