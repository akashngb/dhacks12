"""
Simple HTTP server to serve toronto_news_latest.json on port 6767
"""

import json
import os
from http.server import HTTPServer, BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

# Get the directory where this script is located
SCRIPT_DIR = Path(__file__).parent
JSON_FILE = SCRIPT_DIR / "toronto_news_latest.json"


class NewsHandler(BaseHTTPRequestHandler):
    """HTTP request handler for serving the news JSON file"""
    
    def do_GET(self):
        """Handle GET requests"""
        if self.path == '/' or self.path == '/news' or self.path == '/toronto_news_latest.json':
            self.serve_json()
        elif self.path.startswith('/images/'):
            self.serve_image()
        else:
            self.send_error(404, "Not Found")
    
    def serve_json(self):
        """Serve the JSON file with proper headers"""
        try:
            if not JSON_FILE.exists():
                self.send_error(404, "JSON file not found")
                return
            
            with open(JSON_FILE, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            # Convert to JSON string
            json_str = json.dumps(data, indent=2, ensure_ascii=False)
            
            print(f"✓ Served: JSON ({len(json_str)} bytes)")
            
            # Send response
            self.send_response(200)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Access-Control-Allow-Methods', 'GET, OPTIONS')
            self.send_header('Access-Control-Allow-Headers', 'Content-Type')
            self.send_header('Content-Length', str(len(json_str.encode('utf-8'))))
            self.end_headers()
            self.wfile.write(json_str.encode('utf-8'))
            
        except BrokenPipeError:
            # Client closed connection, ignore
            print("Client closed connection")
            pass
        except Exception as e:
            print(f"✗ Error serving JSON: {e}")
            try:
                self.send_error(500, f"Server error")
            except:
                pass
    
    def serve_image(self):
        """Serve image files from the images directory"""
        try:
            # Extract image filename from path and remove query params
            image_path = self.path.split('?')[0].lstrip('/')
            image_file = SCRIPT_DIR / image_path
            
            # Security check: ensure the file is within the script directory
            try:
                resolved_image = image_file.resolve()
                resolved_script = SCRIPT_DIR.resolve()
                
                if not str(resolved_image).startswith(str(resolved_script)):
                    print(f"Security check failed for: {image_path}")
                    self.send_error(403, "Forbidden")
                    return
            except Exception as e:
                print(f"Error resolving path: {e}")
                self.send_error(400, "Bad Request")
                return
            
            # Check if file exists
            if not image_file.exists() or not image_file.is_file():
                print(f"Image not found: {image_path}")
                self.send_error(404, f"Image not found")
                return
            
            # Determine content type based on file extension
            content_type = 'image/png'  # default
            if image_file.suffix.lower() in ['.jpg', '.jpeg']:
                content_type = 'image/jpeg'
            elif image_file.suffix.lower() == '.gif':
                content_type = 'image/gif'
            elif image_file.suffix.lower() == '.webp':
                content_type = 'image/webp'
            
            # Read and serve the image
            with open(image_file, 'rb') as f:
                image_data = f.read()
            
            print(f"✓ Served: {image_file.name} ({len(image_data)} bytes)")
            
            self.send_response(200)
            self.send_header('Content-Type', content_type)
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Content-Length', str(len(image_data)))
            self.send_header('Cache-Control', 'public, max-age=3600')
            self.end_headers()
            self.wfile.write(image_data)
            
        except BrokenPipeError:
            # Client closed connection, ignore
            print("Client closed connection")
            pass
        except Exception as e:
            print(f"✗ Error serving image: {e}")
            try:
                self.send_error(500, f"Server error")
            except:
                pass
    
    def do_OPTIONS(self):
        """Handle CORS preflight requests"""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
    
    def log_message(self, format, *args):
        """Override to customize logging"""
        print(f"[{self.address_string()}] {format % args}")


def main():
    """Start the HTTP server"""
    port = 6767
    server_address = ('', port)
    
    # Use ThreadingHTTPServer to handle multiple requests concurrently
    httpd = ThreadingHTTPServer(server_address, NewsHandler)
    
    print("=" * 60)
    print("TORONTO NEWS JSON SERVER")
    print("=" * 60)
    print(f"Serving: {JSON_FILE}")
    print(f"JSON URL: http://localhost:{port}/news")
    print(f"Images URL: http://localhost:{port}/images/")
    print("=" * 60)
    print("Press Ctrl+C to stop the server")
    print("=" * 60)
    
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nServer stopped by user")
        httpd.server_close()


if __name__ == "__main__":
    main()
