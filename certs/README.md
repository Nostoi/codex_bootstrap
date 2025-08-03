# TLS Certificates Directory

This directory contains the TLS certificates for the production deployment.

## Required Files:

- `fullchain.pem` - Full certificate chain including intermediate certificates
- `privkey.pem` - Private key file (keep secure!)

## Certificate Generation:

For production, use Let's Encrypt with certbot:

```bash
# Install certbot
sudo apt-get install certbot

# Generate certificates
sudo certbot certonly --standalone -d your-domain.com -d www.your-domain.com

# Copy certificates to this directory
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem ./certs/
sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem ./certs/
sudo chown $USER:$USER ./certs/*.pem
sudo chmod 644 ./certs/fullchain.pem
sudo chmod 600 ./certs/privkey.pem
```

## Development/Testing:

For development and testing, you can generate self-signed certificates:

```bash
# Generate self-signed certificate
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout ./certs/privkey.pem \
  -out ./certs/fullchain.pem \
  -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"

chmod 644 ./certs/fullchain.pem
chmod 600 ./certs/privkey.pem
```

## Security Notes:

- Never commit private keys to version control
- Use proper file permissions (600 for private key, 644 for certificate)
- Rotate certificates before expiration
- Monitor certificate expiration dates
