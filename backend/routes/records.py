from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, App, Table, Record
import json

records_bp = Blueprint('records', __name__)


@records_bp.route('/tables/<int:table_id>/records', methods=['GET'])
@jwt_required()
def list_records(table_id):
    user_id = get_jwt_identity()
    table = Table.query.get_or_404(table_id)
    App.query.filter_by(id=table.app_id, user_id=user_id).first_or_404()

    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 50, type=int)
    sort = request.args.get('sort', 'created_at')
    order = request.args.get('order', 'desc')

    query = Record.query.filter_by(table_id=table_id)
    if sort == 'created_at':
        query = query.order_by(Record.created_at.desc() if order == 'desc' else Record.created_at)
    elif sort == 'sort_order':
        query = query.order_by(Record.sort_order.asc() if order == 'asc' else Record.sort_order.desc())
    else:
        query = query.order_by(Record.created_at.desc())

    pagination = query.paginate(page=page, per_page=per_page, error_out=False)
    return jsonify({
        'records': [r.to_dict() for r in pagination.items],
        'total': pagination.total,
        'page': page,
        'pages': pagination.pages,
    })


@records_bp.route('/tables/<int:table_id>/records', methods=['POST'])
@jwt_required()
def create_record(table_id):
    user_id = get_jwt_identity()
    table = Table.query.get_or_404(table_id)
    App.query.filter_by(id=table.app_id, user_id=user_id).first_or_404()

    data = request.get_json() or {}
    record = Record(
        table_id=table_id,
        data=json.dumps(data.get('data', {})),
        sort_order=data.get('sort_order', 0),
    )
    db.session.add(record)
    db.session.commit()
    return jsonify(record.to_dict()), 201


@records_bp.route('/records/<int:record_id>', methods=['GET'])
@jwt_required()
def get_record(record_id):
    user_id = get_jwt_identity()
    record = Record.query.get_or_404(record_id)
    table = Table.query.get_or_404(record.table_id)
    App.query.filter_by(id=table.app_id, user_id=user_id).first_or_404()
    return jsonify(record.to_dict())


@records_bp.route('/records/<int:record_id>', methods=['PUT'])
@jwt_required()
def update_record(record_id):
    user_id = get_jwt_identity()
    record = Record.query.get_or_404(record_id)
    table = Table.query.get_or_404(record.table_id)
    App.query.filter_by(id=table.app_id, user_id=user_id).first_or_404()

    data = request.get_json() or {}
    if 'data' in data:
        record.data = json.dumps(data['data'])
    if 'sort_order' in data:
        record.sort_order = data['sort_order']

    db.session.commit()
    return jsonify(record.to_dict())


@records_bp.route('/records/<int:record_id>', methods=['DELETE'])
@jwt_required()
def delete_record(record_id):
    user_id = get_jwt_identity()
    record = Record.query.get_or_404(record_id)
    table = Table.query.get_or_404(record.table_id)
    App.query.filter_by(id=table.app_id, user_id=user_id).first_or_404()
    db.session.delete(record)
    db.session.commit()
    return jsonify({'message': '删除成功'})


# 批量操作
@records_bp.route('/tables/<int:table_id>/records/batch', methods=['POST'])
@jwt_required()
def batch_records(table_id):
    user_id = get_jwt_identity()
    table = Table.query.get_or_404(table_id)
    App.query.filter_by(id=table.app_id, user_id=user_id).first_or_404()

    data = request.get_json() or {}
    action = data.get('action')
    ids = data.get('ids', [])

    if action == 'delete':
        Record.query.filter(Record.id.in_(ids), Record.table_id == table_id).delete(
            synchronize_session=False)
        db.session.commit()
        return jsonify({'message': f'删除了 {len(ids)} 条记录'})

    return jsonify({'error': '未知操作'}), 400
