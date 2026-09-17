# Database Architecture

## Overview

TrizenAI Photo Sharing uses MongoDB with Mongoose. MongoDB stores users, events, uploaded-photo metadata, and published-gallery metadata. Image files are stored in Cloudinary in production; MongoDB stores the related image URL and Cloudinary public ID.

```text
React client
    |
    v
Express REST API
    |
    +--> MongoDB Atlas
    |      users, events, photos, galleries
    |
    +--> Cloudinary
           image binaries and delivery URLs
```

## Collections

### User

Stores authenticated application users.

| Field | Description |
| --- | --- |
| `name` | Display name. |
| `email` | Normalized, unique login email. |
| `passwordHash` | bcrypt password hash. Plain passwords are never stored. |
| `role` | `ADMIN` or `TEAM_MEMBER`. |
| `createdAt`, `updatedAt` | Mongoose timestamps. |

### Event

Stores event information and team assignments.

| Field | Description |
| --- | --- |
| `name` | Event name. |
| `description` | Optional event description. |
| `date` | Event date. |
| `createdBy` | Reference to the admin who created the event. |
| `teamMembers` | References to assigned team-member users. |
| `createdAt`, `updatedAt` | Mongoose timestamps. |

### Photo

Stores metadata for each uploaded image.

| Field | Description |
| --- | --- |
| `eventId` | Reference to the related event. |
| `uploadedBy` | Reference to the team member who uploaded the photo. |
| `originalName` | Original uploaded filename. |
| `storageUrl` | Cloudinary delivery URL or local development fallback URL. |
| `publicId` | Cloudinary public ID or local fallback identifier. |
| `fileSize` | Uploaded file size. |
| `isSelected` | Whether an admin selected the photo for publication. |
| `createdAt`, `updatedAt` | Mongoose timestamps. |

### Gallery

Stores the public gallery record for an event.

| Field | Description |
| --- | --- |
| `eventId` | Reference to the event. |
| `publicToken` | Random token used in the public gallery URL. |
| `pinHash` | bcrypt hash of the gallery PIN. |
| `published` | Whether the gallery is publicly available. |
| `publishedAt` | Publication timestamp. |
| `createdAt`, `updatedAt` | Mongoose timestamps. |

## Relationships

```text
User (ADMIN) 1 ---- many Event
User (TEAM_MEMBER) many ---- many Event
Event 1 ---- many Photo
User (TEAM_MEMBER) 1 ---- many Photo
Event 1 ---- 1 Gallery
```

- An admin owns the events they create.
- Team members are assigned to events through the event's `teamMembers` references.
- Each photo belongs to one event and one uploader.
- Each event can have one gallery record, which is updated when the admin republishes it.

## Access and Data Protection

- JWT middleware authenticates protected API requests.
- Role checks prevent team members from creating events or publishing galleries.
- Event-level checks prevent access to unrelated event IDs.
- Gallery PINs and user passwords are hashed with bcryptjs.
- Public gallery photo requests require a short-lived in-memory gallery access token after PIN verification.
- MongoDB connection strings and third-party credentials are supplied through environment variables and must not be committed.

## Storage Behavior

In production, image uploads are sent to Cloudinary and only their metadata is saved in MongoDB. During local testing, Cloudinary failures can use generated fallback image URLs so the application workflow remains testable. Fallback URLs are not intended for production storage.
