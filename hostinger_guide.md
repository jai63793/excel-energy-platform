# Excel Energy: Step-by-Step Hostinger VPS Deployment Guide

This document describes how to deploy the Excel Energy platform on a **Hostinger VPS** using Ubuntu, Node.js, PM2, Nginx, MySQL, and SSL.

---

## 1. Domain DNS & Hostinger Firewall Configuration

### Step 1.1: Configure A-Records on Hostinger hPanel
Point your custom domains to your Hostinger VPS IP address (e.g., `185.119.173.55`):
1.  Log in to your **Hostinger hPanel**.
2.  Navigate to **Domain** -> select your domain -> **DNS / Nameservers**.
3.  Add/modify the following records:
    *   **A-Record:** `@` (points to your VPS IP, e.g., `185.119.173.55`)
    *   **A-Record:** `api` (points to your VPS IP, e.g., `185.119.173.55`)

### Step 1.2: Hostinger VPS Firewall Rules
Manage port access inside the Hostinger security dashboard:
1.  Go to **VPS** -> **Manage VPS** -> **Security** -> **Firewall**.
2.  Select/Create your profile and add these rules:
    *   **Port 22 (SSH):** Allow incoming traffic (for server access).
    *   **Port 80 (HTTP):** Allow incoming traffic (for Nginx HTTP & Certbot validations).
    *   **Port 443 (HTTPS):** Allow incoming traffic (for secure Nginx HTTPS web traffic).

---

## 2. SSH Connection & MySQL Setup

### Step 2.1: SSH into Hostinger VPS
Open your command terminal (Powershell or macOS terminal) and connect as root:
```bash
ssh root@your_hostinger_vps_ip
```
*(Enter the root password you configured during VPS setup).*

### Step 2.2: Install & Configure MySQL
Update system repositories and install MySQL:
```bash
sudo apt update
sudo apt upgrade -y
sudo apt install mysql-server -y
sudo systemctl start mysql
sudo systemctl enable mysql
```
Initialize database security guidelines:
```bash
sudo mysql_secure_installation
```
Log in to MySQL as root and create the database schema:
```bash
sudo mysql -u root -p
```
Run the following SQL queries to instantiate tables and configure permissions:
```sql
CREATE DATABASE excel_energy;
CREATE USER 'excel_admin'@'localhost' IDENTIFIED BY 'HostingerSecureDB_2026!';
GRANT ALL PRIVILEGES ON excel_energy.* TO 'excel_admin'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

---

## 3. Node.js Environment & PM2 Background Process

### Step 3.1: Install Node.js
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
```

### Step 3.2: Copy Project Files & Configure Environment
Clone your GitHub repository into `/var/www/excel-energy`:
```bash
sudo mkdir -p /var/www/excel-energy
sudo chown -R root:root /var/www/excel-energy
git clone <your_github_repo_url> /var/www/excel-energy
cd /var/www/excel-energy/backend
```
Create a new environment parameter file:
```bash
sudo nano .env
```
Paste your production settings:
```env
PORT=5000
NODE_ENV=production
DATABASE_URL="mysql://excel_admin:HostingerSecureDB_2026!@localhost:3306/excel_energy"
JWT_SECRET=HostingerJWTSecretKey_Excel_2026
JWT_REFRESH_SECRET=HostingerJWTRefreshSecretKey_Excel_2026
RAZORPAY_KEY_ID=rzp_live_yourkey
RAZORPAY_KEY_SECRET=yourkeysecret
WHATSAPP_PROVIDER=meta
WHATSAPP_ACCESS_TOKEN=yourpermanenttoken
WHATSAPP_PHONE_NUMBER_ID=yourphoneid
EMAIL_PROVIDER=smtp
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=no-reply@excelenergy.com
SMTP_PASS=gmailappspecificpassword
```

### Step 3.3: Launch Server App with PM2
Install backend dependencies, push schemas, seed admin accounts, and startup the PM2 manager:
```bash
npm install --production
npx prisma db push
npx prisma db seed
sudo npm install -g pm2
pm2 start src/server.js --name "excel-energy-backend"
pm2 save
pm2 startup ubuntu
```
*(Copy and paste the custom output command provided by PM2 to enable autostart on system boot).*

---

## 4. Nginx Reverse Proxy Setup

Nginx intercepts incoming client request headers and forwards them internally to the Express server running on port 5000.

### Step 4.1: Install & Set Up Nginx
```bash
sudo apt install nginx -y
sudo systemctl start nginx
sudo systemctl enable nginx
sudo nano /etc/nginx/sites-available/api.excelenergy.com
```
Add the reverse proxy setup:
```nginx
server {
    listen 80;
    server_name api.excelenergy.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Step 4.2: Enable Site Configuration
```bash
sudo ln -s /etc/nginx/sites-available/api.excelenergy.com /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## 5. Enable HTTPS Encryption (SSL Certbot)

Run Certbot to fetch SSL certificates and configure Nginx redirects:
```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d api.excelenergy.com
```
Confirm the automated SSL redirection request when prompted.

---

## 6. Compile & Host React Frontend

### Step 6.1: Build React Assets
Update your frontend environment config locally or on your server to target the new secure VPS URL:
```env
VITE_API_URL="https://api.excelenergy.com/api"
VITE_FIREBASE_API_KEY="AIzaSy..."
```
Run the build script:
```bash
npm run build
```
This generates a static output directory named `dist/`. Upload this folder onto your Hostinger VPS under `/var/www/excel-energy/frontend`.

### Step 6.2: Add Nginx Configuration block for Main Domain
Create the site block for your main client address:
```bash
sudo nano /etc/nginx/sites-available/excelenergy.com
```
Add the routing redirect fallback configuration for React SPA routers:
```nginx
server {
    listen 80;
    server_name excelenergy.com www.excelenergy.com;
    root /var/www/excel-energy/frontend;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```
Link configuration, restart Nginx, and activate SSL certificates:
```bash
sudo ln -s /etc/nginx/sites-available/excelenergy.com /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
sudo certbot --nginx -d excelenergy.com -d www.excelenergy.com
```

---

## 7. Diagnostics & Logging Checks

*   **View backend output:** `pm2 logs excel-energy-backend`
*   **Monitor server states:** `pm2 status`
*   **Check web request routing:** `tail -f /var/log/nginx/access.log`
*   **Check web gateway errors:** `tail -f /var/log/nginx/error.log`
