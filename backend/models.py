from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import json

db = SQLAlchemy()


class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(256), nullable=False)
    name = db.Column(db.String(80), nullable=True)
    email_verified = db.Column(db.Boolean, default=False)          # 邮箱是否已验证
    is_admin = db.Column(db.Boolean, default=False)                   # 是否为管理员
    verification_code = db.Column(db.String(6), nullable=True)       # 邮箱验证码
    verification_expires = db.Column(db.DateTime, nullable=True)     # 验证码过期时间
    reset_code = db.Column(db.String(6), nullable=True)              # 密码重置验证码
    reset_expires = db.Column(db.DateTime, nullable=True)           # 重置验证码过期时间
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    apps = db.relationship('App', backref='owner', lazy='dynamic', cascade='all,delete-orphan')

    def to_dict(self):
        return {
            'id': self.id,
            'email': self.email,
            'name': self.name,
            'email_verified': self.email_verified,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }


class App(db.Model):
    __tablename__ = 'apps'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    name = db.Column(db.String(120), nullable=False)
    description = db.Column(db.Text, default='')
    icon = db.Column(db.String(40), default='📋')
    config = db.Column(db.Text, default='{}')  # JSON
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    tables = db.relationship('Table', backref='app', lazy='dynamic', cascade='all,delete-orphan')

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'name': self.name,
            'description': self.description,
            'icon': self.icon,
            'config': json.loads(self.config) if self.config else {},
            'table_count': self.tables.count(),
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }


class Table(db.Model):
    __tablename__ = 'tables'
    id = db.Column(db.Integer, primary_key=True)
    app_id = db.Column(db.Integer, db.ForeignKey('apps.id'), nullable=False)
    name = db.Column(db.String(120), nullable=False)
    slug = db.Column(db.String(80), nullable=False)
    description = db.Column(db.Text, default='')
    # fields: [{"name":"标题","type":"text"},{"name":"状态","type":"select","options":["进行中","已完成"]}]
    fields = db.Column(db.Text, default='[]')
    views = db.Column(db.Text, default='[]')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    records = db.relationship('Record', backref='table_', lazy='dynamic', cascade='all,delete-orphan')

    def to_dict(self, include_records=False):
        result = {
            'id': self.id,
            'app_id': self.app_id,
            'name': self.name,
            'slug': self.slug,
            'description': self.description,
            'fields': json.loads(self.fields) if self.fields else [],
            'views': json.loads(self.views) if self.views else [],
            'record_count': self.records.count(),
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }
        return result


class Record(db.Model):
    __tablename__ = 'records'
    id = db.Column(db.Integer, primary_key=True)
    table_id = db.Column(db.Integer, db.ForeignKey('tables.id'), nullable=False)
    data = db.Column(db.Text, default='{}')
    sort_order = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'table_id': self.table_id,
            'data': json.loads(self.data) if self.data else {},
            'sort_order': self.sort_order,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }


class AppMember(db.Model):
    """应用成员（协作权限）"""
    __tablename__ = 'app_members'
    id = db.Column(db.Integer, primary_key=True)
    app_id = db.Column(db.Integer, db.ForeignKey('apps.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    role = db.Column(db.String(20), default='viewer')   # owner / editor / viewer
    invited_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship('User', foreign_keys=[user_id], backref='memberships')
    inviter = db.relationship('User', foreign_keys=[invited_by])
    app = db.relationship('App', backref='members')

    __table_args__ = (db.UniqueConstraint('app_id', 'user_id', name='uq_app_member'),)

    def to_dict(self):
        return {
            'id': self.id,
            'app_id': self.app_id,
            'user_id': self.user_id,
            'role': self.role,
            'user_name': self.user.name if self.user else None,
            'user_email': self.user.email if self.user else None,
            'invited_by': self.invited_by,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }


class Form(db.Model):
    __tablename__ = 'forms'
    id = db.Column(db.Integer, primary_key=True)
    table_id = db.Column(db.Integer, db.ForeignKey('tables.id'), nullable=False)
    name = db.Column(db.String(120), nullable=False)
    description = db.Column(db.Text, default='')
    form_key = db.Column(db.String(32), unique=True, nullable=False, index=True)
    enabled = db.Column(db.Boolean, default=True)
    allowed_fields = db.Column(db.Text, default='[]')
    config = db.Column(db.Text, default='{}')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    table = db.relationship('Table', backref='forms')

    def to_dict(self):
        return {
            'id': self.id,
            'table_id': self.table_id,
            'name': self.name,
            'description': self.description,
            'form_key': self.form_key,
            'enabled': self.enabled,
            'allowed_fields': json.loads(self.allowed_fields) if self.allowed_fields else [],
            'config': json.loads(self.config) if self.config else {},
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }
