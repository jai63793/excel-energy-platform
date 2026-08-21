# Excel Energy online deployment



## Frontend

Deploy the repository root to Netlify with build command `npm run build` and publish directory `dist`. Set `VITE_API_URL` in Netlify environment variables to the public backend URL followed by `/api`, such as `https://your-backend.example.com/api`. Do not put database credentials in Netlify variables.



## Backend

Deploy the `backend` directory as a Node web service. The included `render.yaml` is a deployment template. Set `DATABASE_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, and `CLIENT_URL` as backend environment variables. The database URL must match the Prisma datasource in `backend/prisma/schema.prisma`.



After the backend starts, verify `https://your-backend.example.com/api/health`. Then set the Netlify `VITE_API_URL` value to that backend URL and redeploy the frontend.



## Signup checklist

The browser must never use `http://localhost:5000/api` in production. The frontend now uses the configured `VITE_API_URL`, with a safe `/api` fallback. Signup also requires the backend database URL, JWT secrets, CORS frontend URL, and OTP provider variables to be present on the backend host.