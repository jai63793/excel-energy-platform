# Excel Energy Subscription Platform Documentation & Deployment Guide

This repository contains the complete production-ready source code for the **Excel Energy Subscription Platform**, a dynamic React + Vite frontend coupled with a Node.js + Express.js REST API backend using MySQL and Prisma ORM.

---

## 🏗️ Architecture & Folder Structure

```text
excel_energy/
├── backend/                   # Node.js + Express.js API
│   ├── prisma/                # Prisma ORM Schemas & Database Seeds
│   │   ├── schema.prisma      # MySQL Database models definitions
│   │   └── seed.js            # Initial Roles, Settings & Admin creation script
│   ├── src/
│   │   ├── config/            # Prisma connection clients
│   │   ├── controllers/       # Route request handlers
│   │   ├── middleware/        # JWT Authentication, permissions & rate limits
│   │   ├── routes/            # REST endpoint routers mappings
│   │   ├── services/          # Razorpay, SMS/WhatsApp integrations & Node Cron
│   │   ├── utils/             # OTP generators & JWT Token signing helpers
│   │   ├── app.js             # Express settings initialization
│   │   └── server.js          # Startup listeners and safety catch-alls
│   ├── .env.example           # Backend environment configuration template
│   └── package.json           # Backend dependencies and scripts
│
├── src/                       # React.js Vite Frontend
│   ├── components/            # UI header, footer, custom cards
│   ├── pages/                 # Home, About, Contact, Login, Dashboard, Admin
│   ├── services/              # Axios HTTP client with JWT interceptors
│   ├── store/                 # Redux Toolkit global auth slices
│   ├── App.jsx                # Protected client routers
│   └── main.jsx               # Entry points wrapping Redux & Toast notifications
```

---

## 🛠️ REST API Documentation

### 1. Authentication Endpoints (`/api/auth`)

*   **`POST /request-otp`**: Requests a 6-digit verification code. Generates code, invalidates old entries, writes to DB, and sends SMS.
    *   *Payload*: `{ "phone": "+919876543210" }`
*   **`POST /register`**: Registers a new customer after verifying OTP. Generates a unique username and returns authentication tokens.
    *   *Payload*: `{ "name": "Practitioner", "phone": "+919876543210", "email": "user@example.com", "address": "Bengaluru", "otpCode": "123456" }`
*   **`POST /login-otp`**: Verifies login OTP for registered users and returns JWT tokens.
    *   *Payload*: `{ "phone": "+919876543210", "otpCode": "123456" }`
*   **`POST /admin-login`**: Sign-in endpoint for administrator panel using username and password.
    *   *Payload*: `{ "username": "excel_admin", "password": "adminpassword123" }`
*   **`POST /refresh`**: Issues a new short-lived access token using the httpOnly cookie refresh token.
*   **`GET /me`** *(Protected)*: Synchronizes current authenticated profile.
*   **`PUT /profile`** *(Protected)*: Updates profile settings (Name, email, address).
*   **`PUT /change-password`** *(Protected)*: Sets or changes login credentials password.
*   **`POST /logout`** *(Protected)*: Closes login session and clears browser cookies.

### 2. Payment & Billing Endpoints (`/api/payments`)

*   **`POST /create-order`** *(Protected)*: Configures billing calculations (₹1500 base + 18% GST = ₹1770) and issues a pending Razorpay Order ID.
*   **`POST /verify-payment`** *(Protected)*: Verifies Razorpay signatures (HMAC SHA256). On success, it issues a 30-day subscription (extended from current expiry if active, or from today if expired), issues a GST Invoice number, and dispatches WhatsApp/SMS receipts.
    *   *Payload*: `{ "razorpay_order_id": "...", "razorpay_payment_id": "...", "razorpay_signature": "..." }`
*   **`GET /my-history`** *(Protected)*: Fetches successful invoice payment history for the user.
*   **`POST /webhook`**: Catch-all Razorpay webhook for server-to-server captures, fails, and refund logs.

### 3. User Notifications (`/api/notifications`)

*   **`GET /my-notifications`** *(Protected)*: Fetches dashboard notices.
*   **`PUT /mark-read/:id`** *(Protected)*: Updates single notification status to read.
*   **`PUT /mark-all-read`** *(Protected)*: Marks all notices read.

### 4. Public Contacts (`/api/contacts`)

*   **`POST /submit`**: Saves contact inquiries to the database for admin review.
    *   *Payload*: `{ "name": "Guest", "email": "guest@test.com", "phone": "+919876543210", "message": "Inquiry text" }`

### 5. Administrative Control Panel (`/api/admin`)

*   **`GET /stats`**: Aggregates users counts, revenue logs, expiring warnings, and activity records.
*   **`GET /users`**: Paginated list of registered users.
*   **`PUT /users/suspend/:id`**: Suspends user access.
*   **`PUT /users/activate/:id`**: Re-activates user access.
*   **`PUT /users/reset-password/:id`**: Reset password, returning a new temporary credential.
*   **`DELETE /users/:id`**: Deletes user account.
*   **`GET /payments`**: Logs successful payments and downloads.
*   **`GET /revenue-report`**: Weekly, monthly, and daily revenue statistics.
*   **`POST /notify-bulk`**: Broadcast custom WhatsApp messages and dashboard warnings to ALL, PAID, or UNPAID user groups.
*   **`POST /notify-live`**: Broadcasts YouTube Live meditation links to paid members.
*   **`GET /settings` & `PUT /settings`**: Retrieves and updates API parameters (Razorpay keys, address, phone numbers).

---

## ⚙️ Initial Setup & Local Run Instructions

### 1. Database Configuration
1. Install and start a MySQL Server instance locally or use a cloud database provider.
2. Create an empty database schema named `excel_energy`.

### 2. Backend Installation & Run
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install npm dependencies:
   ```bash
   npm install
   ```
3. Copy the configuration file:
   ```bash
   cp .env.example .env
   ```
4. Open the `.env` file and set your database connection:
   ```env
   DATABASE_URL="mysql://username:password@localhost:3306/excel_energy"
   ```
5. Run the Prisma database migrations:
   ```bash
   npx prisma migrate dev --name init
   ```
6. Populate initial roles and administrator credentials (`excel_admin` / `adminpassword123`):
   ```bash
   npx prisma db seed
   ```
7. Start the backend server in development mode:
   ```bash
   npm run dev
   ```

### 3. Frontend Installation & Run
1. From the project root (`excel_energy`), install frontend packages:
   ```bash
   npm install
   ```
2. Start the Vite React development server:
   ```bash
   npm run dev
   ```
3. Open `http://localhost:5173` in your browser.

---

## 🚀 Production Deployment Guide

### Frontend Deployment (Vercel / Netlify)
1. Commit the React client to your Git repository (GitHub / GitLab).
2. Connect the repository to Vercel.
3. Set the build environment variable `VITE_API_URL` to point to your deployed VPS backend URL (e.g. `https://api.excelenergy.com/api`).
4. Trigger the deployment. Vercel will output a global edge CDN link.

### Backend VPS Deployment (Ubuntu / Nginx / PM2 / SSL)

#### 1. Setup Node.js and PM2
1. SSH into your Linux VPS server.
2. Install Node.js (Version 18 or newer).
3. Install the PM2 process manager globally:
   ```bash
   sudo npm install -g pm2
   ```
4. Move your backend code to the server directory (e.g., `/var/www/excel-energy-api`).
5. Run `npm install` and verify the `.env` settings are updated with live credentials.
6. Start the API application using PM2:
   ```bash
   pm2 start src/server.js --name "excel-energy-api"
   ```
7. Configure PM2 to start automatically on VPS boot:
   ```bash
   pm2 startup
   pm2 save
   ```

#### 2. Nginx Reverse Proxy Configuration
1. Install Nginx:
   ```bash
   sudo apt update
   sudo apt install nginx
   ```
2. Create an Nginx server configuration block:
   ```bash
   sudo nano /etc/nginx/sites-available/api.excelenergy.com
   ```
3. Paste the proxy configuration:
   ```nginx
   server {
       listen 80;
       server_name api.excelenergy.com;

       location / {
           proxy_pass http://localhost:5000; # Points to backend PORT
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```
4. Link configuration block to enable site:
   ```bash
   sudo ln -s /etc/nginx/sites-available/api.excelenergy.com /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

#### 3. Secure Backend using SSL
1. Install Certbot client:
   ```bash
   sudo apt install certbot python3-certbot-nginx
   ```
2. Fetch SSL certificate and configure HTTPS redirect automatically:
   ```bash
   sudo certbot --nginx -d api.excelenergy.com
   ```
3. Verify that the certificate auto-renew crontab is set correctly. Your REST API server is now secure and production-ready!
