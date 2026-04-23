# 应用成员（权限管理）路由
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, App, AppMember, User
from werkzeug.security import generate_password_hash

members_bp = Blueprint('members', __name__)


def get_member_role(app_id, user_id):
    """获取用户在应用中的角色：owner / editor / viewer / None"""
    app = App.query.get(app_id)
    if not app:
        return None
    if app.user_id == user_id:
        return 'owner'
    member = AppMember.query.filter_by(app_id=app_id, user_id=user_id).first()
    return member.role if member else None


def check_permission(app_id, user_id, required='viewer'):
    """检查权限，owner > editor > viewer"""
    role = get_member_role(app_id, user_id)
    if not role:
        return False
    order = {'owner': 3, 'editor': 2, 'viewer': 1}
    return order.get(role, 0) >= order.get(required, 0)


@members_bp.route('/apps/<int:app_id>/members', methods=['GET'])
@jwt_required()
def list_members(app_id):
    user_id = get_jwt_identity()
    if not check_permission(app_id, user_id, 'viewer'):
        return jsonify({'error': '无权限访问'}), 403

    members = AppMember.query.filter_by(app_id=app_id).all()
    app = App.query.get(app_id)
    result = [{
        'id': m.id,
        'user_id': m.user_id,
        'role': m.role,
        'user_name': m.user.name if m.user else None,
        'user_email': m.user.email if m.user else None,
        'created_at': m.created_at.isoformat() if m.created_at else None,
    } for m in members]
    # 加上所有者
    result.insert(0, {
        'id': None,
        'user_id': app.user_id,
        'role': 'owner',
        'user_name': app.owner.name if app.owner else None,
        'user_email': app.owner.email if app.owner else None,
        'created_at': app.created_at.isoformat() if app.created_at else None,
    })
    return jsonify(result)


@members_bp.route('/apps/<int:app_id>/members', methods=['POST'])
@jwt_required()
def invite_member(app_id):
    user_id = get_jwt_identity()
    if not check_permission(app_id, user_id, 'owner'):
        return jsonify({'error': '只有所有者可以邀请成员'}), 403

    data = request.get_json()
    email = data.get('email', '').strip().lower()
    role = data.get('role', 'viewer')
    if role not in ('editor', 'viewer'):
        return jsonify({'error': '角色只能是 editor 或 viewer'}), 400

    if not email:
        return jsonify({'error': '邮箱不能为空'}), 400

    invitee = User.query.filter_by(email=email).first()
    if not invitee:
        return jsonify({'error': '该用户尚未注册，请先邀请其注册'}), 404

    app = App.query.get(app_id)
    if invitee.id == app.user_id:
        return jsonify({'error': '应用所有者无需邀请'}), 400

    existing = AppMember.query.filter_by(app_id=app_id, user_id=invitee.id).first()
    if existing:
        existing.role = role
        db.session.commit()
        return jsonify({'message': '已更新成员权限', 'member': existing.to_dict()})

    member = AppMember(
        app_id=app_id,
        user_id=invitee.id,
        role=role,
        invited_by=user_id,
    )
    db.session.add(member)
    db.session.commit()
    return jsonify({'message': '邀请成功', 'member': member.to_dict()}), 201


@members_bp.route('/apps/<int:app_id>/members/<int:member_id>', methods=['PUT'])
@jwt_required()
def update_member(app_id, member_id):
    user_id = get_jwt_identity()
    if not check_permission(app_id, user_id, 'owner'):
        return jsonify({'error': '只有所有者可以修改成员权限'}), 403

    member = AppMember.query.get_or_404(member_id)
    if member.app_id != app_id:
        return jsonify({'error': '成员不存在'}), 404

    data = request.get_json()
    role = data.get('role')
    if role not in ('editor', 'viewer'):
        return jsonify({'error': '角色只能是 editor 或 viewer'}), 400

    member.role = role
    db.session.commit()
    return jsonify({'message': '权限已更新', 'member': member.to_dict()})


@members_bp.route('/apps/<int:app_id>/members/<int:member_id>', methods=['DELETE'])
@jwt_required()
def remove_member(app_id, member_id):
    user_id = get_jwt_identity()
    if not check_permission(app_id, user_id, 'owner'):
        return jsonify({'error': '只有所有者可以移除成员'}), 403

    member = AppMember.query.get_or_404(member_id)
    if member.app_id != app_id:
        return jsonify({'error': '成员不存在'}), 404

    db.session.delete(member)
    db.session.commit()
    return jsonify({'message': '成员已移除'})