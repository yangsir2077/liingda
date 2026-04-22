#!/usr/bin/env python3
"""易搭平台 - 合并服务器（API + 前端静态文件）"""
import os
import sys

# 添加 backend 目录到路径
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import create_app
from flask import send_from_directory, request, Response
import threading

FRONTEND_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'frontend')

def serve_frontend():
    """单独启动前端 HTTP 服务器"""
    import http.server, socketserver
    class Handler(http.server.SimpleHTTPRequestHandler):
        def __init__(self, *args, **kwargs):
            super().__init__(*args, directory=FRONTEND_DIR, **kwargs)
        def log_message(self, format, *args):
            pass  # 静默日志
    with socketserver.TCPServer(('', 3000), Handler) as httpd:
        print(f'[Frontend] 静态文件服务 http://localhost:3000')
        httpd.serve_forever()

if __name__ == '__main__':
    # 启动 Flask API
    app = create_app()
    port = int(os.environ.get('PORT', 5000))

    # 单独线程跑前端
    frontend_thread = threading.Thread(target=serve_frontend, daemon=True)
    frontend_thread.start()

    print(f'')
    print(f'  易搭 NoCode Platform')
    print(f'  后端 API:  http://localhost:{port}')
    print(f'  前端界面:  http://localhost:3000')
    print(f'')
    print(f'  打开 http://localhost:3000 开始使用')
    print(f'')

    # 禁用 Flask reloader，避免和前端服务器冲突
    app.run(host='0.0.0.0', port=port, debug=False, threaded=True)
