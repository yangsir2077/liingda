# 管理员后台 API
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, User, App, AppMember, Table, Record, Form
from datetime import datetime, timedelta
import calendar

admin_bp = Blueprint('admin', __name__)


def require_admin(user_id):
    """只有管理员才能访问"""
    user = User.query.get(user_id)
    return user and user.is_admin


@admin_bp.route('/admin/stats', methods=['GET'])
@jwt_required()
def stats():
    user_id = get_jwt_identity()
    if not require_admin(user_id):
        return jsonify({'error': '需要管理员权限'}), 403

    # 用户统计
    total_users = User.query.count()
    new_users_today = User.query.filter(
        db.func.date(User.created_at) == db.func.date('now')
    ).count()
    new_users_week = User.query.filter(
        User.created_at >= datetime.utcnow() - timedelta(days=7)
    ).count()
    verified_users = User.query.filter_by(email_verified=True).count()

    # 应用统计
    total_apps = App.query.count()

    # 数据表统计
    total_tables = Table.query.count()

    # 记录统计
    total_records = Record.query.count()

    # 公开表单统计
    total_forms = Form.query.count()

    # 每日新增用户（近7天）
    days = []
    for i in range(6, -1, -1):
        d = datetime.utcnow().date() - timedelta(days=i)
        count = User.query.filter(
            db.func.date(User.created_at) == d
        ).count()
        days.append({'date': d.isoformat(), 'count': count})

    return jsonify({
        'users': {
            'total': total_users,
            'verified': verified_users,
            'new_today': new_users_today,
            'new_week': new_users_week,
        },
        'apps': {'total': total_apps},
        'tables': {'total': total_tables},
        'records': {'total': total_records},
        'forms': {'total': total_forms},
        'user_chart': days,
    })


@admin_bp.route('/admin/users', methods=['GET'])
@jwt_required()
def list_users():
    user_id = get_jwt_identity()
    if not require_admin(user_id):
        return jsonify({'error': '需要管理员权限'}), 403

    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    search = request.args.get('search', '', type=str)

    query = User.query
    if search:
        query = query.filter(
            db.or_(
                User.email.contains(search),
                User.name.contains(search)
            )
        )

    pagination = query.order_by(User.created_at.desc()).paginate(
        page=page, per_page=per_page, error_out=False
    )

    # 获取每个用户的应用数量
    result = []
    for u in pagination.items:
        app_count = App.query.filter_by(user_id=u.id).count()
        result.append({
            'id': u.id,
            'email': u.email,
            'name': u.name,
            'email_verified': u.email_verified,
            'is_admin': u.is_admin,
            'app_count': app_count,
            'created_at': u.created_at.isoformat() if u.created_at else None,
        })

    return jsonify({
        'users': result,
        'total': pagination.total,
        'pages': pagination.pages,
        'page': page,
    })


@admin_bp.route('/admin/users/<int:uid>', methods=['GET'])
@jwt_required()
def get_user_detail(uid):
    user_id = get_jwt_identity()
    if not require_admin(user_id):
        return jsonify({'error': '需要管理员权限'}), 403

    user = User.query.get_or_404(uid)
    apps = App.query.filter_by(user_id=uid).all()
    app_list = []
    for a in apps:
        table_count = Table.query.filter_by(app_id=a.id).count()
        record_count = sum(r.count() for r in [Table.query.filter_by(app_id=a.id).first().records] if r)
        app_list.append({
            'id': a.id,
            'name': a.name,
            'table_count': table_count,
            'created_at': a.created_at.isoformat() if a.created_at else None,
        })

    return jsonify({
        'id': user.id,
        'email': user.email,
        'name': user.name,
        'email_verified': user.email_verified,
        'is_admin': user.is_admin,
        'created_at': user.created_at.isoformat() if user.created_at else None,
        'apps': app_list,
    })


@admin_bp.route('/admin/users/<int:uid>/toggle-admin', methods=['POST'])
@jwt_required()
def toggle_admin(uid):
    user_id = get_jwt_identity()
    if not require_admin(user_id):
        return jsonify({'error': '需要管理员权限'}), 403

    if uid == user_id:
        return jsonify({'error': '不能修改自己的管理员权限'}), 400

    user = User.query.get_or_404(uid)
    user.is_admin = not user.is_admin
    db.session.commit()
    return jsonify({'message': '操作成功', 'is_admin': user.is_admin})


@admin_bp.route('/admin/users/<int:uid>', methods=['DELETE'])
@jwt_required()
def delete_user(uid):
    user_id = get_jwt_identity()
    if not require_admin(user_id):
        return jsonify({'error': '需要管理员权限'}), 403

    if uid == user_id:
        return jsonify({'error': '不能删除自己'}), 400

    user = User.query.get_or_404(uid)
    db.session.delete(user)
    db.session.commit()
    return jsonify({'message': '用户已删除'})
