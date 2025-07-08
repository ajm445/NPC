#!/usr/bin/env python3
import http.server
import socketserver
import os
import sys

class MyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', '*')
        super().end_headers()

def main():
    # 현재 디렉토리를 서버 루트로 설정
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    
    PORT = 8000
    
    # 포트가 사용 중인 경우 다른 포트 시도
    for port in range(8000, 8010):
        try:
            with socketserver.TCPServer(("", port), MyHTTPRequestHandler) as httpd:
                PORT = port
                print(f"🎮 동물의 숲 게임 서버가 시작되었습니다!")
                print(f"🌐 브라우저에서 http://localhost:{PORT} 를 열어주세요")
                print(f"📂 파일 경로: {os.getcwd()}")
                print("🛑 서버를 중지하려면 Ctrl+C를 누르세요")
                httpd.serve_forever()
                break
        except OSError:
            continue
    else:
        print("사용 가능한 포트를 찾을 수 없습니다.")
        sys.exit(1)

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n🛑 서버가 종료되었습니다.")
        sys.exit(0)