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
from routes.forms import forms_bp

# 认证 Blueprint
from flask import Blueprint, request
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from models import User
from werkzeug.security import generate_password_hash, check_password_hash

auth_bp = Blueprint('auth', __name__)


@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')
    name = data.get('name', '').strip()

    if not email or not password:
        return jsonify({'error': '邮箱和密码不能为空'}), 400
    if len(password) < 6:
        return jsonify({'error': '密码至少6位'}), 400
    if User.query.filter_by(email=email).first():
        return jsonify({'error': '该邮箱已注册'}), 409

    user = User(
        email=email,
        password_hash=generate_password_hash(password),
        name=name or email.split('@')[0],
    )
    db.session.add(user)
    db.session.commit()

    token = create_access_token(identity=user.id)
    return jsonify({
        'token': token,
        'user': user.to_dict(),
    }), 201


@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')

    if not email or not password:
        return jsonify({'error': '邮箱和密码不能为空'}), 400

    user = User.query.filter_by(email=email).first()
    if not user or not check_password_hash(user.password_hash, password):
        return jsonify({'error': '邮箱或密码错误'}), 401

    token = create_access_token(identity=user.id)
    return jsonify({
        'token': token,
        'user': user.to_dict(),
    })


@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def me():
    user_id = get_jwt_identity()
    user = User.query.get_or_404(user_id)
    return jsonify(user.to_dict())


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
