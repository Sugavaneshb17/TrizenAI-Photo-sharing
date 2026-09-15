# TrizenAI Photo Sharing Platform

## Project Overview
This project is a full-stack MVP for a professional-event photo sharing platform. It supports admin-led event creation, team member upload workflows, photo review and selection, and customer-only access to selected published gallery images through a PIN-protected public gallery.

## Features
### Admin
- Create events
- Add team members to events
- Review upload activity
- Select/unselect photos
- Publish a gallery with a PIN
- Access dashboard and event management pages

### Team Member
- View assigned events
- Upload photos to assigned events
- View personal uploads only
- Cannot create events or publish galleries

### Customer
- Open a public gallery link
- Enter a PIN to verify access
- View only selected published photos

## Tech Stack
- React
- Vite
- Node.js
- Express
- MongoDB Atlas / Mongoose
- Cloudinary
- JWT
- bcryptjs
- Vercel
- Render

## Architecture
React
↓
Express REST API
↓
MongoDB

Express
↓
Cloudinary

## Database Design
- User: authenticated admin/team member records, roles, hashed passwords
- Event: event metadata and assigned team members
- Photo: Cloudinary metadata for uploaded images
- Gallery: public link metadata, generated token, and hashed PIN

## Authentication and Authorization
The app uses JWTs for authentication and stores only hashed passwords. Role-based checks are enforced on the backend, and event-level access is restricted so team members cannot access arbitrary event IDs.

## Image Storage
Actual images are uploaded to Cloudinary. MongoDB stores only metadata such as Cloudinary URL, public ID, event relation, original filename, uploader, and selection state.

## Environment Variables
Create a .env file in the server folder using the variables from .env.example.

For local development, the server can start without MongoDB or Cloudinary credentials by using its in-memory MongoDB and local fallback image URLs. For production, configure MongoDB Atlas and all Cloudinary variables; the fallback image URLs are intended only for local development.

## Local Setup
1. Clone the repo
2. Install dependencies for both client and server
3. Copy server/.env.example to server/.env and fill in values
4. Run:
   - client: npm run dev
   - server: npm run dev

## Deployment
- Frontend: Vercel
- Backend: Render
- Database: MongoDB Atlas
- Images: Cloudinary

Before submission, deploy both applications and record the live frontend URL, backend URL, demo admin credentials, demo team member credentials, demo gallery URL, and gallery PIN. Do not commit any credentials or `.env` files.

## Testing
Verify the major flows: admin registration/login, event creation, team assignment, uploads, photo selection, gallery publication, and public gallery PIN verification.

The frontend can be validated with `npm run build` and `npm run lint` from `client`. The backend exposes `GET /api/health` for a running-server smoke check, and `npm test` runs integration tests for authentication, event authorization, photo upload and selection, gallery publishing, and PIN-protected access.

## Known Limitations
- No advanced image editing
- No real-time upload progress
- No automatic AI tagging
- No advanced search or pagination

## Future Improvements
- AI-based photo tagging
- Duplicate detection
- Smart gallery search
- Thumbnail resizing
- CDN optimization
- Gallery expiration
- Bulk download
- CI/CD
