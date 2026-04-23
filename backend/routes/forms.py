from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, App, Table, Form, Record
import json
import secrets
import string

forms_bp = Blueprint('forms', __name__)


def generate_key(length=16):
    chars = string.ascii_lowercase + string.digits
    return ''.join(secrets.choice(chars) for _ in range(length))


@forms_bp.route('/tables/<int:table_id>/forms', methods=['GET'])
@jwt_required()
def list_forms(table_id):
    user_id = get_jwt_identity()
    table = Table.query.get_or_404(table_id)
    App.query.filter_by(id=table.app_id, user_id=user_id).first_or_404()
    forms = Form.query.filter_by(table_id=table_id).order_by(Form.created_at.desc()).all()
    return jsonify([f.to_dict() for f in forms])


@forms_bp.route('/tables/<int:table_id>/forms', methods=['POST'])
@jwt_required()
def create_form(table_id):
    user_id = get_jwt_identity()
    table = Table.query.get_or_404(table_id)
    App.query.filter_by(id=table.app_id, user_id=user_id).first_or_404()
    data = request.get_json() or {}
    form_key = generate_key()
    # 默认允许所有文本类字段
    fields = json.loads(table.fields) if table.fields else []
    allowed = data.get('allowed_fields', [f['name'] for f in fields])
    form = Form(
        table_id=table_id,
        name=data.get('name', '默认表单'),
        description=data.get('description', ''),
        form_key=form_key,
        allowed_fields=json.dumps(allowed),
        config=json.dumps(data.get('config', {})),
    )
    db.session.add(form)
    db.session.commit()
    return jsonify(form.to_dict()), 201


@forms_bp.route('/forms/<int:form_id>', methods=['GET'])
@jwt_required()
def get_form(form_id):
    user_id = get_jwt_identity()
    form = Form.query.get_or_404(form_id)
    table = Table.query.get_or_404(form.table_id)
    App.query.filter_by(id=table.app_id, user_id=user_id).first_or_404()
    return jsonify(form.to_dict())


@forms_bp.route('/forms/<int:form_id>', methods=['PUT'])
@jwt_required()
def update_form(form_id):
    user_id = get_jwt_identity()
    form = Form.query.get_or_404(form_id)
    table = Table.query.get_or_404(form.table_id)
    App.query.filter_by(id=table.app_id, user_id=user_id).first_or_404()
    data = request.get_json() or {}
    if 'name' in data:
        form.name = data['name']
    if 'description' in data:
        form.description = data['description']
    if 'enabled' in data:
        form.enabled = data['enabled']
    if 'allowed_fields' in data:
        form.allowed_fields = json.dumps(data['allowed_fields'])
    if 'config' in data:
        form.config = json.dumps(data['config'])
    db.session.commit()
    return jsonify(form.to_dict())


@forms_bp.route('/forms/<int:form_id>', methods=['DELETE'])
@jwt_required()
def delete_form(form_id):
    user_id = get_jwt_identity()
    form = Form.query.get_or_404(form_id)
    table = Table.query.get_or_404(form.table_id)
    App.query.filter_by(id=table.app_id, user_id=user_id).first_or_404()
    db.session.delete(form)
    db.session.commit()
    return jsonify({'message': '删除成功'})


# ========== 公开表单提交（无需认证） ==========

@forms_bp.route('/public/forms/<form_key>', methods=['GET'])
def public_get_form(form_key):
    """获取公开表单定义（供外部用户填写）"""
    form = Form.query.filter_by(form_key=form_key, enabled=True).first_or_404()
    table = Table.query.get_or_404(form.table_id)
    fields = json.loads(table.fields) if table.fields else []
    allowed = json.loads(form.allowed_fields) if form.allowed_fields else []
    # 只返回允许的字段
    visible_fields = [f for f in fields if f['name'] in allowed]
    return jsonify({
        'id': form.id,
        'name': form.name,
        'description': form.description,
        'table_id': form.table_id,
        'fields': visible_fields,
        'config': json.loads(form.config) if form.config else {},
    })


@forms_bp.route('/public/forms/<form_key>', methods=['POST'])
def public_submit_form(form_key):
    """公开表单提交（无需登录）"""
    form = Form.query.filter_by(form_key=form_key, enabled=True).first_or_404()
    table = Table.query.get_or_404(form.table_id)
    data = request.get_json() or {}
    allowed = json.loads(form.allowed_fields) if form.allowed_fields else []
    # 只提取允许的字段
    allowed_data = {k: v for k, v in data.items() if k in allowed}
    record = Record(
        table_id=form.table_id,
        data=json.dumps(allowed_data),
        sort_order=0,
    )
    db.session.add(record)
    db.session.commit()
    return jsonify({'message': '提交成功', 'record_id': record.id}), 201
