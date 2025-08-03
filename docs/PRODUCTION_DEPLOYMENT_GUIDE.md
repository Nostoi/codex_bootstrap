# Production Deployment Guide

## Overview
This guide provides step-by-step instructions for deploying the Codex Bootstrap application in a production environment with comprehensive security hardening.

## Security Features

### Container Security
- **Non-root execution**: All services run with non-root user (UID 1001)
- **Capability restrictions**: All capabilities dropped, only essential ones added back
- **Read-only root filesystem**: Prevents runtime file system modifications
- **Resource limits**: CPU and memory limits prevent resource exhaustion
- **Security options**: `no-new-privileges` prevents privilege escalation

### Network Security  
- **Network isolation**: Separate networks for frontend, backend, and monitoring
- **Custom subnets**: Isolated IP ranges for each network segment
- **No external networks**: All networks are internal to the Docker environment

### SSL/TLS Security
- **Strong cipher suites**: Only TLS 1.2+ with modern ECDHE ciphers
- **Perfect Forward Secrecy**: DHE key exchange with 2048-bit parameters
- **Security headers**: HSTS, CSP, X-Frame-Options, and other protective headers
- **OCSP stapling**: Certificate validation for enhanced security

### Monitoring & Observability
- **Falco runtime security**: Real-time threat detection and alerting
- **Comprehensive logging**: Structured JSON logs with rotation
- **Health checks**: Application and database health monitoring
- **Metrics collection**: Performance and security metrics

### Secrets Management
- **File-based secrets**: Database credentials stored in secure files
- **Proper permissions**: Secrets files restricted to 600 permissions
- **Environment isolation**: Production-specific environment configuration

## Pre-deployment Checklist

### 1. Update Configuration Files

**Update `.env.production`:**
```bash
# Replace placeholder values with production secrets
JWT_SECRET=your-super-secure-jwt-secret-change-in-production-2024
OAUTH2_CLIENT_ID=your-actual-oauth2-client-id
OAUTH2_CLIENT_SECRET=your-actual-oauth2-client-secret
GOOGLE_CLIENT_ID=your-actual-google-client-id
GOOGLE_CLIENT_SECRET=your-actual-google-client-secret
OPENAI_API_KEY=your-actual-openai-api-key
CORS_ORIGIN=https://yourdomain.com
```

**Update database secrets:**
```bash
# Update secrets/db_user.txt with your production database user
# Update secrets/db_password.txt with a strong production password
```

### 2. Generate Production SSL Certificates

**For production, replace self-signed certificates:**
```bash
# Remove test certificates
rm certs/privkey.pem certs/fullchain.pem

# Add your production certificates
# - privkey.pem: Your private key
# - fullchain.pem: Your certificate chain
# - dhparam.pem: Diffie-Hellman parameters (already generated)
```

### 3. Update Domain Configuration

**Update `nginx/nginx.conf`:**
```nginx
# Replace 'localhost' with your production domain
server_name yourdomain.com www.yourdomain.com;
```

### 4. Build Production Images

```bash
# Build backend image
docker build -f Dockerfile.backend -t codex-backend:latest .

# Build frontend image  
docker build -f Dockerfile.frontend -t codex-frontend:latest .
```

## Deployment Process

### 1. Run Security Validation
```bash
# Validate all security configurations
./test-production-security.sh
```

### 2. Start Production Services
```bash
# Start all services in background
docker-compose -f docker-compose.production-secure.yml up -d

# Check service status
docker-compose -f docker-compose.production-secure.yml ps
```

### 3. Verify Deployment
```bash
# Check service health
docker-compose -f docker-compose.production-secure.yml exec backend curl -f http://localhost:8000/health
docker-compose -f docker-compose.production-secure.yml exec frontend curl -f http://localhost:3000/api/health

# Verify SSL configuration
curl -I https://yourdomain.com

# Check security headers
curl -I https://yourdomain.com | grep -E "(Strict-Transport-Security|X-Frame-Options|Content-Security-Policy)"
```

### 4. Monitor Security Events
```bash
# Monitor Falco security alerts
docker-compose -f docker-compose.production-secure.yml logs -f falco

# Check application logs
docker-compose -f docker-compose.production-secure.yml logs -f backend frontend
```

## Post-Deployment Operations

### Service Management
```bash
# Stop services
docker-compose -f docker-compose.production-secure.yml stop

# Restart services
docker-compose -f docker-compose.production-secure.yml restart

# Update services (after image rebuild)
docker-compose -f docker-compose.production-secure.yml up -d --force-recreate
```

### Log Management
```bash
# View logs
docker-compose -f docker-compose.production-secure.yml logs -f [service-name]

# Log rotation is configured automatically (max 3 files, 10MB each)
```

### Backup Operations
```bash
# Backup database
docker-compose -f docker-compose.production-secure.yml exec db pg_dump -U codex_user codex_bootstrap_prod > backup.sql

# Backup volumes
docker run --rm -v codex_bootstrap_postgres_production_data:/data -v $(pwd):/backup ubuntu tar czf /backup/postgres_backup.tar.gz /data
```

### Security Monitoring
```bash
# Check Falco alerts
docker-compose -f docker-compose.production-secure.yml logs falco | grep -i "warning\|error\|critical"

# Monitor resource usage
docker stats $(docker-compose -f docker-compose.production-secure.yml ps -q)

# Check for security updates
docker-compose -f docker-compose.production-secure.yml pull
```

### Certificate Renewal
```bash
# When certificates expire, update files in certs/ directory
# Restart nginx to load new certificates
docker-compose -f docker-compose.production-secure.yml restart nginx
```

## Troubleshooting

### Common Issues

**Services not starting:**
```bash
# Check logs for errors
docker-compose -f docker-compose.production-secure.yml logs [service-name]

# Verify configuration
docker-compose -f docker-compose.production-secure.yml config
```

**Database connection issues:**
```bash
# Verify database is ready
docker-compose -f docker-compose.production-secure.yml exec db pg_isready

# Check database logs
docker-compose -f docker-compose.production-secure.yml logs db
```

**SSL/TLS issues:**
```bash
# Verify certificate validity
openssl x509 -in certs/fullchain.pem -text -noout

# Test SSL configuration
openssl s_client -connect yourdomain.com:443 -servername yourdomain.com
```

**Performance issues:**
```bash
# Check resource usage
docker stats

# Review resource limits
docker-compose -f docker-compose.production-secure.yml config | grep -A5 "resources:"
```

## Security Best Practices

1. **Regular Updates**: Keep base images and dependencies updated
2. **Secret Rotation**: Regularly rotate database passwords and API keys  
3. **Certificate Management**: Monitor certificate expiration dates
4. **Log Monitoring**: Regularly review Falco security alerts
5. **Backup Strategy**: Implement automated database and volume backups
6. **Network Security**: Use firewall rules to restrict network access
7. **Access Control**: Limit SSH and Docker daemon access
8. **Monitoring**: Set up alerting for security events and service health

## Compliance & Auditing

The production deployment includes features that support various compliance requirements:

- **Audit Logging**: All security events logged by Falco
- **Data Encryption**: TLS 1.2+ encryption for data in transit
- **Access Controls**: Non-root execution and capability restrictions
- **Network Segmentation**: Isolated networks for different service tiers
- **Security Monitoring**: Real-time threat detection and alerting

## Support

For deployment support or security questions:
1. Review logs for specific error messages
2. Run the security validation script: `./test-production-security.sh`
3. Check the troubleshooting section above
4. Verify all configuration files are properly updated for production

---

**Production Deployment Infrastructure - Complete**
- ✅ Security-hardened Docker Compose configuration
- ✅ Comprehensive SSL/TLS setup with modern ciphers
- ✅ Runtime security monitoring with Falco
- ✅ Network isolation and resource limiting
- ✅ Secrets management and access controls
- ✅ Complete testing and validation suite
- ✅ Production deployment guide and operations manual
