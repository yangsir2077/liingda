#!/usr/bin/env python3
"""易搭平台 - 合并服务器（API + 前端静态文件）"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import create_app
from flask import send_from_directory, request

FRONTEND_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'frontend')

app = create_app()

@app.route('/')
def index():
    return send_from_directory(FRONTEND_DIR, 'index.html')

@app.route('/<path:filename>')
def static_files(filename):
    return send_from_directory(FRONTEND_DIR, filename)

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    print(f'')
    print(f'  易搭 NoCode Platform')
    print(f'  访问:  http://localhost:{port}')
    print(f'')
    app.run(host='0.0.0.0', port=port, debug=False, threaded=True)
