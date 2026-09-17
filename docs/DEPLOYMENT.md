# Deployment Guide

## Deployment Architecture

```text
Users
  |
  v
React/Vite frontend on Vercel
  |
  v
Express API on Render
  |                 \
  v                  v
MongoDB Atlas      Cloudinary
```

## Prerequisites

- GitHub repository containing the source code.
- MongoDB Atlas cluster and database user.
- Cloudinary account and API credentials.
- Render account for the backend.
- Vercel account for the frontend.

## Deploy the Backend to Render

1. Open the Render dashboard and create a new **Web Service**.
2. Connect the GitHub repository.
3. Select the `main` branch.
4. Set the root directory to `server`.
5. Select the Node runtime.
6. Set the build command to:

   ```text
   npm install
   ```

7. Set the start command to:

   ```text
   npm start
   ```

8. Add the following environment variables in Render:

   | Key | Value |
   | --- | --- |
   | `MONGO_URI` | MongoDB Atlas connection string. |
   | `JWT_SECRET` | Long random production secret. |
   | `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name. |
   | `CLOUDINARY_API_KEY` | Cloudinary API key. |
   | `CLOUDINARY_API_SECRET` | Cloudinary API secret. |
   | `CLIENT_URL` | Final Vercel frontend origin, without a path. |

9. Do not commit `.env` files or paste credentials into source files.
10. Deploy the service and test:

    ```text
    https://YOUR-RENDER-SERVICE.onrender.com/api/health
    ```

## Deploy the Frontend to Vercel

1. Create a new Vercel project from the same GitHub repository.
2. Set the root directory to `client`.
3. Use the Vite framework preset.
4. Confirm these build settings:

   ```text
   Install Command: npm install
   Build Command: npm run build
   Output Directory: dist
   ```

5. Add this environment variable for Production and Preview:

   ```text
   VITE_API_URL=https://YOUR-RENDER-SERVICE.onrender.com/api
   ```

6. Deploy the project.
7. Copy the generated Vercel URL.

The repository includes `client/vercel.json` so direct React routes such as `/gallery/:publicToken` are rewritten to `index.html` instead of returning a Vercel 404.

## Connect the Deployments

Return to Render and set:

```text
CLIENT_URL=https://YOUR-VERCEL-PROJECT.vercel.app
```

Do not include `/login`, `/gallery`, or `/api` in `CLIENT_URL`. Save and redeploy the Render service so CORS and generated gallery links use the deployed frontend.

## Production Verification

- Open the Vercel frontend URL.
- Register and log in as an admin.
- Create and assign a team member.
- Upload an image through the team-member account.
- Select the image as admin.
- Publish a PIN-protected gallery.
- Open the public gallery link directly and verify the PIN.
- Confirm event details and selected photos are visible.
- Test the Render health endpoint.
- Review Render logs for MongoDB connection and startup errors.

## Security Checklist

- Rotate credentials that were exposed during development or screenshots.
- Use a unique production `JWT_SECRET`.
- Restrict MongoDB Atlas access appropriately for the deployment environment.
- Keep `server/.env` ignored by Git.
- Never place MongoDB, Cloudinary, or JWT secrets in README files, commits, screenshots, or frontend variables.
- Use `VITE_API_URL` only for the public API base URL; do not put backend secrets in Vite variables.

## Operational Notes

- Render's free instance may sleep after inactivity and can take up to several seconds to wake.
- MongoDB Atlas and Cloudinary must be configured for persistent production data and real image storage.
- Gallery access tokens are held in server memory and expire after 15 minutes; a Render restart invalidates active tokens.
