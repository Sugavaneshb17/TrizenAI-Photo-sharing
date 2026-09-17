# Testing

## Test Strategy

Testing covers the primary API workflows and verifies that authentication, authorization, uploads, photo selection, gallery publication, and public PIN access work together.

The backend integration suite uses:

- Node.js built-in test runner
- Supertest for HTTP requests
- MongoDB Memory Server for isolated test data

The frontend is validated through linting and a production build.

## Run Backend Tests

From the repository root:

```powershell
cd server
npm test
```

The test command runs `server/test/app.test.js`.

## Run Frontend Validation

```powershell
cd client
npm run lint
npm run build
```

`npm run lint` checks the React source, while `npm run build` verifies that Vite can create a production bundle.

## Covered Backend Scenarios

The integration tests verify:

1. Admin registration and authentication.
2. Team-member creation and login.
3. Reusing an existing team-member email without creating duplicates.
4. Event access restrictions for assigned and unassigned team members.
5. Team-member photo upload authorization.
6. Image upload handling with a valid multipart image.
7. Admin photo selection and unselection authorization.
8. Gallery publication with a PIN.
9. Rejection of an invalid gallery PIN.
10. Public gallery event details and selected-photo retrieval after PIN verification.
11. Rejection of public gallery photo requests without a valid gallery access token.

## Manual Production Smoke Test

After deployment, verify the complete user flow:

1. Open the deployed Vercel frontend.
2. Register an admin account and log in.
3. Create a team member.
4. Create an event and assign the team member.
5. Log in as the team member and upload an image.
6. Log in as the admin and select the uploaded photo.
7. Publish the gallery with a PIN.
8. Open the generated public gallery URL in an incognito window.
9. Enter the PIN and confirm the event name, date, description, and selected photo are visible.
10. Refresh the direct gallery URL and confirm it still loads.

## Health Check

The backend exposes:

```text
GET /api/health
```

A healthy response is:

```json
{
  "success": true,
  "data": {
    "status": "ok"
  }
}
```

## Known Test Notes

- Cloudinary may be unavailable during local tests; the server can use its local fallback image URL behavior.
- MongoDB Memory Server creates isolated temporary database data for the test run.
- Render's free instance can take longer to respond after inactivity, so the first production request may be slow.
