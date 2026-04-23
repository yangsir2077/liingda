"""
零搭 (LingDa) NoCode Platform - Backend API
Flask + SQLAlchemy + JWT
"""
import os
from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS
from flask_jwt_extended import JWTManager

from config import Config
from models import db
from routes.apps import apps_bp
from routes.tables import tables_bp
from routes.records import records_bp
from routes.admin import admin_bp
from routes.forms import forms_bp
from routes.members import members_bp

# 认证 Blueprint
from flask import Blueprint, request
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from models import User
from werkzeug.security import generate_password_hash, check_password_hash
from utils.email import send_verification_email, send_password_reset_email
from datetime import datetime, timedelta
import random
import string

auth_bp = Blueprint('auth', __name__)



def gen_code(length=6):
    """生成纯数字验证码"""
    return ''.join(random.choices(string.digits, k=length))


@auth_bp.route('/register', methods=['POST'])
def register():
    """用户注册：创建账号并发送邮箱验证"""
    data = request.get_json()
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')
    name = data.get('name', '').strip()

    if not email or not password:
        return jsonify({'error': '邮箱和密码不能为空'}), 400
    if len(password) < 6:
        return jsonify({'error': '密码至少6位'}), 400

    existing = User.query.filter_by(email=email).first()
    if existing:
        if not existing.email_verified:
            # 已注册但未验证，重新发送验证码
            code = gen_code()
            existing.verification_code = code
            existing.verification_expires = datetime.utcnow() + timedelta(minutes=15)
            db.session.commit()
            send_verification_email(email, code)
            return jsonify({
                'message': '该邮箱已注册但未验证，验证码已重新发送',
                'need_verify': True,
                'email': email,
            }), 200
        return jsonify({'error': '该邮箱已注册，请直接登录'}), 409

    # 生成验证码
    code = gen_code()
    user = User(
        email=email,
        password_hash=generate_password_hash(password),
        name=name or email.split('@')[0],
        verification_code=code,
        verification_expires=datetime.utcnow() + timedelta(minutes=15),
        email_verified=False,
    )
    db.session.add(user)
    db.session.commit()

    # 发送验证邮件
    send_verification_email(email, code)

    return jsonify({
        'message': '注册成功，验证码已发送到您的邮箱',
        'need_verify': True,
        'email': email,
    }), 201


@auth_bp.route('/verify-email', methods=['POST'])
def verify_email():
    """验证邮箱验证码"""
    data = request.get_json()
    email = data.get('email', '').strip().lower()
    code = data.get('code', '').strip()

    if not email or not code:
        return jsonify({'error': '邮箱和验证码不能为空'}), 400

    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({'error': '用户不存在'}), 404
    if user.email_verified:
        token = create_access_token(identity=user.id)
        return jsonify({'token': token, 'user': user.to_dict()})

    if not user.verification_code or user.verification_code != code:
        return jsonify({'error': '验证码错误'}), 400
    if not user.verification_expires or user.verification_expires < datetime.utcnow():
        return jsonify({'error': '验证码已过期，请重新发送'}), 400

    user.email_verified = True
    user.verification_code = None
    user.verification_expires = None
    db.session.commit()

    token = create_access_token(identity=user.id)
    return jsonify({
        'token': token,
        'user': user.to_dict(),
    })


@auth_bp.route('/resend-verify', methods=['POST'])
def resend_verify():
    """重新发送验证邮件"""
    data = request.get_json()
    email = data.get('email', '').strip().lower()
    if not email:
        return jsonify({'error': '邮箱不能为空'}), 400

    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({'error': '该邮箱未注册'}), 404
    if user.email_verified:
        return jsonify({'error': '该邮箱已验证，无需重复验证'}), 400

    code = gen_code()
    user.verification_code = code
    user.verification_expires = datetime.utcnow() + timedelta(minutes=15)
    db.session.commit()

    ok = send_verification_email(email, code)
    if not ok:
        return jsonify({'error': '邮件发送失败，请检查邮箱地址是否正确'}), 500

    return jsonify({'message': '验证码已发送，请查收邮件', 'email': email})


@auth_bp.route('/login', methods=['POST'])
def login():
    """用户登录"""
    data = request.get_json()
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')

    if not email or not password:
        return jsonify({'error': '邮箱和密码不能为空'}), 400

    user = User.query.filter_by(email=email).first()
    if not user or not check_password_hash(user.password_hash, password):
        return jsonify({'error': '邮箱或密码错误'}), 401

    if not user.email_verified:
        return jsonify({
            'error': '请先验证邮箱',
            'need_verify': True,
            'email': email,
        }), 403

    token = create_access_token(identity=user.id)
    return jsonify({
        'token': token,
        'user': user.to_dict(),
    })


@auth_bp.route('/send-reset-code', methods=['POST'])
def send_reset_code():
    """发送密码重置验证码"""
    data = request.get_json()
    email = data.get('email', '').strip().lower()
    if not email:
        return jsonify({'error': '邮箱不能为空'}), 400

    user = User.query.filter_by(email=email).first()
    if not user:
        # 安全起见，不管存不存在都返回成功，防止通过枚举攻击探测用户
        return jsonify({'message': '如果该邮箱已注册，重置链接已发送'}), 200

    code = gen_code()
    user.reset_code = code
    user.reset_expires = datetime.utcnow() + timedelta(minutes=15)
    db.session.commit()

    ok = send_password_reset_email(email, code)
    if not ok:
        return jsonify({'error': '邮件发送失败，请稍后重试'}), 500

    return jsonify({'message': '验证码已发送到您的邮箱', 'email': email})



@auth_bp.route('/reset-password', methods=['POST'])
def reset_password():
    """使用验证码重置密码"""
    data = request.get_json()
    email = data.get('email', '').strip().lower()
    code = data.get('code', '').strip()
    new_password = data.get('new_password', '')

    if not all([email, code, new_password]):
        return jsonify({'error': '邮箱、验证码、新密码都不能为空'}), 400
    if len(new_password) < 6:
        return jsonify({'error': '新密码至少6位'}), 400

    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({'error': '用户不存在'}), 404

    if not user.reset_code or user.reset_code != code:
        return jsonify({'error': '验证码错误'}), 400
    if not user.reset_expires or user.reset_expires < datetime.utcnow():
        return jsonify({'error': '验证码已过期，请重新获取'}), 400

    user.password_hash = generate_password_hash(new_password)
    user.reset_code = None
    user.reset_expires = None
    db.session.commit()

    return jsonify({'message': '密码重置成功，请使用新密码登录'})


@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def me():
    user_id = get_jwt_identity()
    user = User.query.get_or_404(user_id)
    return jsonify(user.to_dict())


@auth_bp.route('/export-data', methods=['GET'])
@jwt_required()
def export_data():
    """导出用户所有数据（合规要求）"""
    user_id = get_jwt_identity()
    user = User.query.get_or_404(user_id)
    apps = App.query.filter_by(user_id=user_id).all()
    result = {
        'user': user.to_dict(),
        'apps': [],
        'exported_at': datetime.utcnow().isoformat(),
    }
    for app in apps:
        app_data = app.to_dict()
        app_data['tables'] = []
        for table in app.tables:
            table_data = table.to_dict()
            table_data['records'] = [r.to_dict() for r in table.records.all()]
            app_data['tables'].append(table_data)
        result['apps'].append(app_data)
    return jsonify(result)


@auth_bp.route('/delete-account', methods=['POST'])
@jwt_required()
def delete_account():
    """注销账号（合规要求，会删除所有关联数据）"""
    user_id = get_jwt_identity()
    data = request.get_json() or {}
    password = data.get('password', '')
    user = User.query.get_or_404(user_id)
    if not check_password_hash(user.password_hash, password):
        return jsonify({'error': '密码错误，无法删除账号'}), 400
    # 删除关联数据（级联）
    App.query.filter_by(user_id=user_id).delete()
    AppMember.query.filter_by(user_id=user_id).delete()
    db.session.delete(user)
    db.session.commit()
    return jsonify({'message': '账号已注销，所有数据已删除'})


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # 初始化扩展
    CORS(app, origins=['*'], supports_credentials=True)
    JWTManager(app)
    db.init_app(app)

    # 注册蓝图
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(apps_bp, url_prefix='/api/apps')
    app.register_blueprint(tables_bp, url_prefix='/api')
    app.register_blueprint(records_bp, url_prefix='/api')
    app.register_blueprint(forms_bp, url_prefix='/api')
    app.register_blueprint(members_bp, url_prefix='/api')
    app.register_blueprint(admin_bp, url_prefix='/api')

    # 健康检查
    @app.route('/api/health')
    def health():
        return jsonify({'status': 'ok', 'service': 'lingda-platform'})

    # 全局错误处理
    # 前端静态文件
    frontend_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'frontend')
    @app.route('/')
    def serve_index():
        return send_from_directory(frontend_dir, 'index.html')
    @app.route('/<path:filename>')
    def serve_static(filename):
        from flask import make_response
        resp = make_response(send_from_directory(frontend_dir, filename))
        if filename.endswith('.js'):
            resp.headers['Content-Type'] = 'text/javascript; charset=utf-8'
        elif filename.endswith('.css'):
            resp.headers['Content-Type'] = 'text/css; charset=utf-8'
        elif filename.endswith('.html'):
            resp.headers['Content-Type'] = 'text/html; charset=utf-8'
        return resp
    @app.errorhandler(404)
    def not_found(e):
        if request.path.startswith('/api/'):
            return jsonify({'error': '资源不存在'}), 404
        return send_from_directory(frontend_dir, 'index.html')

    @app.errorhandler(500)
    def server_error(e):
        return jsonify({'error': '服务器错误'}), 500

    # 创建数据库表
    with app.app_context():
        db.create_all()

    return app


if __name__ == '__main__':
    app = create_app()
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('FLASK_DEBUG', '0') == '1'
    app.run(host='0.0.0.0', port=port, debug=debug, use_reloader=False)
