import os

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY', 'yida-platform-secret-2026')
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL', 'sqlite:///yida.db')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'yida-jwt-secret-2026')
    JWT_ACCESS_TOKEN_EXPIRES = 60 * 60 * 24 * 7  # 7天
