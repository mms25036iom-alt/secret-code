#!/bin/bash

echo "========================================"
echo " Generating HTTPS Certificates"
echo "========================================"
echo ""

# Check if mkcert is installed
if ! command -v mkcert &> /dev/null; then
    echo "ERROR: mkcert is not installed!"
    echo ""
    echo "Please install mkcert first:"
    echo "  Mac:   brew install mkcert"
    echo "  Linux: sudo apt install mkcert"
    echo ""
    echo "Or download from:"
    echo "  https://github.com/FiloSottile/mkcert/releases"
    echo ""
    exit 1
fi

echo "Step 1: Installing local Certificate Authority..."
mkcert -install
if [ $? -ne 0 ]; then
    echo "ERROR: Failed to install CA"
    exit 1
fi
echo "✓ CA installed successfully"
echo ""

echo "Step 2: Getting your local IP address..."
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    IP=$(ipconfig getifaddr en0)
    if [ -z "$IP" ]; then
        IP=$(ipconfig getifaddr en1)
    fi
else
    # Linux
    IP=$(hostname -I | awk '{print $1}')
fi

if [ -z "$IP" ]; then
    echo "Warning: Could not detect IP address automatically"
    echo "Please enter your local IP address (e.g., 192.168.1.100):"
    read IP
fi

echo "Your local IP: $IP"
echo ""

echo "Step 3: Generating certificates..."
echo "This will create certificates for:"
echo "  - localhost"
echo "  - 127.0.0.1"
echo "  - $IP"
echo "  - ::1 (IPv6)"
echo ""

mkcert localhost 127.0.0.1 $IP ::1
if [ $? -ne 0 ]; then
    echo "ERROR: Failed to generate certificates"
    exit 1
fi

echo ""
echo "========================================"
echo " ✓ Certificates Generated Successfully!"
echo "========================================"
echo ""
echo "Files created:"
echo "  - localhost+3.pem (certificate)"
echo "  - localhost+3-key.pem (private key)"
echo ""
echo "You can now access your app via HTTPS:"
echo "  - https://localhost:5173"
echo "  - https://127.0.0.1:5173"
echo "  - https://$IP:5173"
echo ""
echo "Next steps:"
echo "  1. Restart your dev server: npm run dev"
echo "  2. Access via HTTPS URL"
echo "  3. Camera and microphone will work!"
echo ""
