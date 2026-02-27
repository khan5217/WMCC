# WMCC Cricket Club Website — Deployment Guide

## AWS Cloud Deployment

### Architecture Overview

```
Internet → CloudFront CDN → ALB (Load Balancer) → ECS (Docker Container)
                                                  → RDS PostgreSQL
                                                  → S3 (Media/Docs)
Twilio → SMS OTPs → Users
Stripe → Payments → Webhooks → API
```

---

## Step 1: AWS Setup

### 1.1 Create RDS PostgreSQL Database
```bash
# In AWS Console → RDS → Create database
# Engine: PostgreSQL 16
# Instance: db.t3.micro (free tier) or db.t3.small
# Database name: wmcc_db
# Username: wmcc_user
# Enable: Multi-AZ (production), automated backups
```

### 1.2 Create S3 Bucket
```bash
# AWS Console → S3 → Create bucket
# Name: wmcc-media-bucket (must be globally unique)
# Region: eu-west-2 (London)
# Block all public access: ON (use presigned URLs for documents)
# Enable versioning for documents
```

### 1.3 Create IAM User for App
```bash
# AWS Console → IAM → Users → Create user
# Attach policy: AmazonS3FullAccess (scope to your bucket)
# Save: Access Key ID + Secret Access Key
```

---

## Step 2: Twilio Setup

1. Create account at https://www.twilio.com
2. Go to Console → Phone Numbers → Get a UK number
3. Copy: Account SID, Auth Token, Phone Number
4. Verify test numbers during trial

---

## Step 3: Stripe Setup

1. Go to https://dashboard.stripe.com
2. Activate your account (requires business details)
3. Get API Keys (use Test keys first)
4. Add Webhook endpoint: `https://wmcc.co.uk/api/payments/webhook`
5. Events to subscribe: `checkout.session.completed`, `payment_intent.payment_failed`
6. Copy Webhook Signing Secret

---

## Step 4: Configure Environment

```bash
cp .env.example .env.local
# Fill in all values
```

---

## Step 5: Deploy to AWS ECS

### Option A: AWS ECS with Fargate (Recommended)

```bash
# 1. Build and push Docker image to ECR
aws ecr create-repository --repository-name wmcc-website --region eu-west-2

aws ecr get-login-password --region eu-west-2 | \
  docker login --username AWS --password-stdin \
  YOUR_ACCOUNT_ID.dkr.ecr.eu-west-2.amazonaws.com

docker build -t wmcc-website .
docker tag wmcc-website:latest YOUR_ACCOUNT_ID.dkr.ecr.eu-west-2.amazonaws.com/wmcc-website:latest
docker push YOUR_ACCOUNT_ID.dkr.ecr.eu-west-2.amazonaws.com/wmcc-website:latest

# 2. Create ECS Cluster → Task Definition → Service
# Use environment variables from Secrets Manager
```

### Option B: EC2 with Docker Compose (Simpler)

```bash
# On your EC2 instance (Ubuntu 22.04):
sudo apt update && sudo apt install -y docker.io docker-compose-v2 git

git clone your-repo /opt/wmcc
cd /opt/wmcc
cp .env.example .env.local
# Edit .env.local with your values

# Run database migrations
docker compose run --rm web npx prisma migrate deploy
docker compose run --rm web npm run db:seed

# Start everything
docker compose up -d

# SSL with Let's Encrypt
sudo apt install -y certbot
sudo certbot certonly --standalone -d wmcc.co.uk -d www.wmcc.co.uk
# Certs go to /etc/letsencrypt/live/wmcc.co.uk/
# Symlink to nginx/ssl/
```

---

## Step 6: Database Migration

```bash
# Run once on first deployment
docker compose run --rm web npx prisma migrate deploy
docker compose run --rm web npm run db:seed

# For subsequent deployments
docker compose run --rm web npx prisma migrate deploy
```

---

## Step 7: Domain Setup

1. Point DNS A record to your server/ALB IP
2. Add CNAME for www → main domain
3. Update `NEXT_PUBLIC_SITE_URL` in `.env.local`

---

## Step 8: Post-Launch

1. **Change admin password** immediately after first login
2. **Test Stripe** in test mode before going live
3. **Test Twilio** SMS to your phone number
4. **Upload your logo** via Admin → Settings
5. **Add team info, players, fixtures** via Admin panel
6. **Enable monitoring** with AWS CloudWatch

---

## Monitoring

- Application: AWS CloudWatch Logs
- Uptime: AWS Route 53 Health Checks or UptimeRobot
- Database: RDS Performance Insights

## Backups

- Database: RDS automated daily snapshots (7 day retention)
- S3: Versioning enabled, cross-region replication optional
- Code: Git repository

---

## Security Checklist

- [ ] JWT_SECRET is at least 64 random characters
- [ ] Database password is strong and unique
- [ ] S3 bucket is private (not public)
- [ ] Stripe webhook secret is set
- [ ] .env.local is NOT in git
- [ ] SSL certificate is valid
- [ ] Admin password changed from default seed
- [ ] Nginx rate limiting is active
