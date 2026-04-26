from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, App, Table, Record
import json as _json

def _json_loads_or(s, default):
    if not s:
        return default
    try:
        return _json.loads(s)
    except:
        return default

records_bp = Blueprint('records', __name__)


def _apply_filters(query, table_id, table_fields):
    """Apply column filters based on filter_<field> query params"""
    for key, val in request.args.items():
        if not key.startswith('filter_'):
            continue
        field_name = key[7:]  # strip 'filter_'
        # check field exists
        field = next((f for f in table_fields if f.get('name') == field_name), None)
        if not field:
            continue
        import json as _json
        try:
            records = Record.query.filter_by(table_id=table_id).all()
            filtered = []
            for r in records:
                d = _json.loads(r.data) if r.data else {}
                val_lower = val.lower()
                rec_val = str(d.get(field_name, '') or '').lower()
                if val == '' or val_lower == rec_val or (val_lower in rec_val and val_lower):
                    filtered.append(r.id)
            if filtered:
                query = query.filter(Record.id.in_(filtered))
            else:
                query = query.filter(Record.id == 0)  # no match
        except:
            pass
    return query


@records_bp.route('/tables/<int:table_id>/records', methods=['GET'])
@jwt_required()
def list_records(table_id):
    user_id = get_jwt_identity()
    table = Table.query.get_or_404(table_id)
    App.query.filter_by(id=table.app_id, user_id=user_id).first_or_404()
    table_fields = _json_loads_or(table.fields, [])

    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 50, type=int)
    sort = request.args.get('sort_field', request.args.get('sort', 'created_at'))
    order = request.args.get('sort_order', request.args.get('order', 'desc'))

    query = Record.query.filter_by(table_id=table_id)
    query = _apply_filters(query, table_id, table_fields)

    if sort == 'created_at':
        query = query.order_by(Record.created_at.desc() if order == 'desc' else Record.created_at.asc())
    elif sort == 'sort_order':
        query = query.order_by(Record.sort_order.asc() if order == 'asc' else Record.sort_order.desc())
    else:
        # dynamic sort by field - use data JSON
        pass  # keep default

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
    record_data = data.get('data', {})
    # 自动编号: 表名缩写+6位序号
    prefix = table.name[:2] if table.name else 'RD'
    count = table.records.count() + 1
    auto_id = f"{prefix}{str(count).zfill(6)}"
    if '编号' in (table.fields or []) and not record_data.get('编号'):
        record_data['编号'] = auto_id

    record = Record(
        table_id=table_id,
        data=json.dumps(record_data),
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


# 看板视图接口
@records_bp.route('/tables/<int:table_id>/kanban', methods=['GET'])
@jwt_required()
def kanban_view(table_id):
    """获取看板数据，按指定分组字段聚合所有记录"""
    user_id = get_jwt_identity()
    table = Table.query.get_or_404(table_id)
    App.query.filter_by(id=table.app_id, user_id=user_id).first_or_404()

    group_by = request.args.get('group_by', None)  # 字段名
    records = Record.query.filter_by(table_id=table_id).order_by(Record.sort_order.asc(), Record.created_at.desc()).all()

    if not group_by:
        return jsonify({'columns': [], 'records': [r.to_dict() for r in records], 'group_by': None})

    # 按分组字段值聚合成列
    from collections import OrderedDict
    columns = OrderedDict()
    fields = json.loads(table.fields) if table.fields else []
    field_meta = next((f for f in fields if f['name'] == group_by), None)

    for r in records:
        rd = json.loads(r.data) if r.data else {}
        key = rd.get(group_by, '未分类')
        if key not in columns:
            columns[key] = []
        columns[key].append(r.to_dict())

    return jsonify({
        'columns': list(columns.keys()),
        'records_by_column': columns,
        'group_by': group_by,
        'field_meta': field_meta,
    })


@records_bp.route('/records/<int:record_id>/kanban', methods=['PUT'])
@jwt_required()
def kanban_move(record_id):
    """看板中拖拽移动卡片：更新分组字段值和sort_order"""
    user_id = get_jwt_identity()
    record = Record.query.get_or_404(record_id)
    table = Table.query.get_or_404(record.table_id)
    App.query.filter_by(id=table.app_id, user_id=user_id).first_or_404()

    data = request.get_json() or {}
    rd = json.loads(record.data) if record.data else {}

    if 'group_value' in data:
        rd[data['group_field']] = data['group_value']
    if 'sort_order' in data:
        record.sort_order = data['sort_order']

    record.data = json.dumps(rd)
    db.session.commit()
    return jsonify(record.to_dict())


@records_bp.route('/tables/<int:table_id>/calendar', methods=['GET'])
@jwt_required()
def calendar_view(table_id):
    """获取日历数据，按日期字段聚合记录"""
    user_id = get_jwt_identity()
    table = Table.query.get_or_404(table_id)
    App.query.filter_by(id=table.app_id, user_id=user_id).first_or_404()

    date_field = request.args.get('date_field', None)
    year = request.args.get('year', type=int)
    month = request.args.get('month', type=int)

    records = Record.query.filter_by(table_id=table_id).order_by(Record.created_at.desc()).all()

    fields = json.loads(table.fields) if table.fields else []
    field_meta = next((f for f in fields if f['name'] == date_field), None) if date_field else None

    if not date_field:
        return jsonify({'events': [], 'date_field': None, 'field_meta': None})

    # 按日期分组
    from collections import defaultdict
    events_map = defaultdict(list)
    for r in records:
        rd = json.loads(r.data) if r.data else {}
        d = rd.get(date_field, None)
        if d:
            events_map[d].append(r.to_dict())

    return jsonify({
        'events': [{'date': k, 'records': v} for k, v in events_map.items()],
        'date_field': date_field,
        'field_meta': field_meta,
    })


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
