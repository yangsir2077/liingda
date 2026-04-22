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
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    apps = db.relationship('App', backref='owner', lazy='dynamic', cascade='all,delete-orphan')

    def to_dict(self):
        return {
            'id': self.id,
            'email': self.email,
            'name': self.name,
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
    slug = db.Column(db.String(80), nullable=False)  # 用于API路径
    description = db.Column(db.Text, default='')
    # fields: [{"name":"标题","type":"text"},{"name":"状态","type":"select","options":["进行中","已完成"]}]
    fields = db.Column(db.Text, default='[]')
    # views: [{"id":"v1","type":"grid","name":"默认视图"}]
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
    # data: {"标题":"任务1","状态":"进行中","金额":100}
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
