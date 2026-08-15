# Excel Energy Subscription Platform: Production Hosting & Deployment Guide

This guide details the steps required to host the **Excel Energy Subscription Platform** (React Vite frontend + Node.js Express backend + MySQL database using Prisma ORM) on a production Ubuntu VPS with PM2, Nginx, and SSL encryption.

---

## 1. System Architecture Overview

The platform uses a decoupled client-server architecture:
*   **Frontend (Vite + React.js):** Served globally via CDN (Vercel, Netlify) or locally using Nginx. Communicates with the API server via secure HTTPS.
*   **Backend (Node.js + Express):** Handles REST API routes, schedules background tasks via `node-cron`, and listens to payment gateway webhooks.
*   **Database (MySQL + Prisma):** Prisma ORM handles object mapping. Can run on the same VPS, a managed database cluster (AWS RDS, Google Cloud SQL), or serverless instances (TiDB Cloud).
*   **External Integrations:** Razorpay (payments), Twilio/MSG91 (OTP SMS), Meta WhatsApp Business API (notifications), and SMTP (email receipts).

---

## 2. Database Provisioning & Schema Migration

Prisma ORM automatically provisions the database structures based on the schemas defined in `backend/prisma/schema.prisma`.

### Step 2.1: Spin Up a MySQL Database Instance
On Ubuntu VPS, install MySQL Server:
```bash
sudo apt update
sudo apt install mysql-server -y
sudo systemctl start mysql
sudo systemctl enable mysql
```

Secure the installation and create the database schema:
```bash
sudo mysql -u root -p
```
Run the following SQL commands:
```sql
CREATE DATABASE excel_energy;
CREATE USER 'excel_user'@'localhost' IDENTIFIED BY 'your_secure_password';
GRANT ALL PRIVILEGES ON excel_energy.* TO 'excel_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### Step 2.2: Configure the Backend Environment
Open `backend/.env` and update the connection URL:
```env
DATABASE_URL="mysql://excel_user:your_secure_password@localhost:3306/excel_energy"
```

### Step 2.3: Push Schema and Seed Database
Navigate to the `backend` folder and run the Prisma synchronization script:
```bash
cd backend
npx prisma db push
```
This commands creates all tables without needing manual SQL script executions. Populate the roles and default administrator credentials by running:
```bash
npx prisma db seed
```
*   **Default Admin Username:** `excel_admin`
*   **Default Admin Password:** `adminpassword123`
*(Note: Be sure to change the admin password immediately upon first login!)*

---

## 3. Backend REST API VPS Setup & PM2 Process Manager

To run the Node.js API server continuously in the background and survive server crashes or reboots, we use PM2.

### Step 3.1: Install Node.js and PM2
Execute the following on your Ubuntu VPS:
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
sudo npm install -g pm2
```

### Step 3.2: Configure Environment Variables
Create the production environment file `backend/.env` containing all relevant API secrets:
```env
PORT=5000
NODE_ENV=production
JWT_SECRET=supersecretjwtkey12345!@#
JWT_REFRESH_SECRET=supersecretrefreshjwtkey98765!@#
RAZORPAY_KEY_ID=rzp_live_your_live_key
RAZORPAY_KEY_SECRET=your_live_secret
WHATSAPP_PROVIDER=meta
WHATSAPP_ACCESS_TOKEN=your_meta_permanent_token
WHATSAPP_PHONE_NUMBER_ID=your_phone_id
EMAIL_PROVIDER=smtp
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=no-reply@excelenergy.com
SMTP_PASS=your_app_specific_password
```

### Step 3.3: Launch with PM2
Install production dependencies and launch the server application:
```bash
cd /var/www/excel-energy/backend
npm install --production
pm2 start src/server.js --name "excel-energy-backend"
pm2 save
```

### Step 3.4: Configure PM2 Startup Scripts
Generate a PM2 config script to execute processes automatically on system boot:
```bash
pm2 startup
```
Copy and paste the command outputted by the terminal, press Enter, and save the settings.

---

## 4. Nginx Reverse Proxy Configuration

Nginx acts as a reverse proxy, receiving external client traffic on port 80/443 and proxying it to Node's local port 5000.

### Step 4.1: Install Nginx
```bash
sudo apt update
sudo apt install nginx -y
sudo systemctl start nginx
sudo systemctl enable nginx
```

### Step 4.2: Create site block configuration
Create a new configuration block for the API backend subdomain:
```bash
sudo nano /etc/nginx/sites-available/api.excelenergy.com
```
Paste the following reverse proxy block (replace `api.excelenergy.com` with your API domain):
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

### Step 4.3: Enable virtual host and restart Nginx
```bash
sudo ln -s /etc/nginx/sites-available/api.excelenergy.com /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## 5. Let's Encrypt SSL Certificate Setup

All modern web browsers enforce HTTPS. Set up a secure SSL certificate using Certbot:

```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d api.excelenergy.com
```
Follow the interactive prompts. When asked, select **Redirect** to automatically update the Nginx configuration to rewrite all HTTP request headers to secure HTTPS. Verify the auto-renewal timer setup:
```bash
sudo systemctl status certbot.timer
```

---

## 6. Frontend Production Build & Hosting

The frontend Vite React code needs to be compiled to high-efficiency static assets (HTML/JS/CSS).

### Option A: Hosting on Vercel or Netlify (Recommended)
1.  Connect your Git repository (GitHub/GitLab) to your Vercel or Netlify dashboard.
2.  Configure build configuration settings:
    *   **Build Command:** `npm run build`
    *   **Output Directory:** `dist`
3.  Set the Environment Variables:
    *   `VITE_API_URL` = `https://api.excelenergy.com/api` (Points to Nginx secure VPS reverse proxy)
    *   Add your Firebase Web Configuration keys.
4.  Click **Deploy**.

### Option B: Hosting directly from Nginx (VPS)
If you want to serve the client static assets directly from your Ubuntu server instead of a CDN:
1.  Build the files locally or on your VPS by running:
    ```bash
    npm run build
    ```
2.  Upload the compiled `dist/` folder contents into `/var/www/excel-energy/frontend` on your server.
3.  Create an Nginx configuration block `/etc/nginx/sites-available/excelenergy.com`:
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
4.  Enable the block and obtain the SSL certificate:
    ```bash
    sudo ln -s /etc/nginx/sites-available/excelenergy.com /etc/nginx/sites-enabled/
    sudo nginx -t
    sudo systemctl restart nginx
    sudo certbot --nginx -d excelenergy.com -d www.excelenergy.com
    ```

---

## 7. Production Troubleshooting & Maintenance

*   **View server logs:** `pm2 logs excel-energy-backend`
*   **Restart application:** `pm2 restart excel-energy-backend`
*   **Database Admin Panel:** Access Prisma Studio locally to inspect database tables:
    ```bash
    npx prisma studio
    ```
*   **Nginx Error Diagnostics:** View logs at `/var/log/nginx/error.log` and `/var/log/nginx/access.log`.
