#!/bin/sh
# Start a lightweight local server to view the articles on Boox Go 10.3
PORT=8080
IP=$(python3 -c "import socket; s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM); s.connect(('8.8.8.8', 80)); print(s.getsockname()[0]); s.close()" 2>/dev/null || echo "127.0.0.1")

echo "=========================================================="
echo " Starting local web server for matt-learning articles..."
echo " On your Boox Go 10.3 browser, open:"
echo "   -> http://localhost:$PORT"
echo ""
echo " From any other device on your local Wi-Fi, open:"
echo "   -> http://$IP:$PORT"
echo "=========================================================="
echo "Press Ctrl+C to stop the server."
echo ""

cd "$(dirname "$0")" && exec python3 -m http.server $PORT
