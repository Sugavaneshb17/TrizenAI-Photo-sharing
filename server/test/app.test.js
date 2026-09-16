const assert = require('node:assert/strict');
const { after, before, test } = require('node:test');
const mongoose = require('mongoose');
const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');

process.env.JWT_SECRET = 'test-secret';

const app = require('../src/app');

let mongoServer;
let adminToken;
let teamToken;
let eventId;
let photoId;
let galleryToken;

const validPngBuffer = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAF' +
  'c1fQAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJ0UkG' +
  'AAAAAAgIYQ7v/dQAAAABJRU5ErkJggg==',
  'base64',
);

const jsonRequest = (method, path, token, body) => {
  const requestBuilder = request(app)[method](path);
  if (token) requestBuilder.set('Authorization', `Bearer ${token}`);
  return body ? requestBuilder.send(body) : requestBuilder;
};

before(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());

  const adminResponse = await jsonRequest('post', '/api/auth/register', null, {
    name: 'Test Admin',
    email: 'test-admin@example.com',
    password: 'Password123!',
  });
  assert.equal(adminResponse.status, 201);
  adminToken = adminResponse.body.data.token;

  const eventResponse = await jsonRequest('post', '/api/events', adminToken, {
    name: 'Test Event',
    description: 'Integration test event',
    date: '2027-12-31',
  });
  assert.equal(eventResponse.status, 201);
  eventId = eventResponse.body.data.event._id;

  const teamResponse = await jsonRequest('post', '/api/users/team-members', adminToken, {
    name: 'Test Team Member',
    email: 'test-team@example.com',
    password: 'Password123!',
  });
  assert.equal(teamResponse.status, 201);

  const assignmentResponse = await jsonRequest('post', `/api/events/${eventId}/members`, adminToken, {
    email: 'test-team@example.com',
  });
  assert.equal(assignmentResponse.status, 200);

  const loginResponse = await jsonRequest('post', '/api/auth/login', null, {
    email: 'test-team@example.com',
    password: 'Password123!',
  });
  assert.equal(loginResponse.status, 200);
  teamToken = loginResponse.body.data.token;
});

after(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

test('allows reusing an existing team member email without creating a duplicate user', async () => {
  const response = await jsonRequest('post', '/api/users/team-members', adminToken, {
    name: 'Duplicate Team Member',
    email: 'duplicate-team@example.com',
    password: 'Password123!',
  });

  assert.equal(response.status, 201);

  const secondResponse = await jsonRequest('post', '/api/users/team-members', adminToken, {
    name: 'Duplicate Team Member',
    email: 'duplicate-team@example.com',
    password: 'Password123!',
  });

  assert.equal(secondResponse.status, 200);
  assert.equal(secondResponse.body.data.user.email, 'duplicate-team@example.com');
});

test('enforces event access and supports the complete gallery workflow', async () => {
  const eventResponse = await jsonRequest('get', `/api/events/${eventId}`, teamToken);
  assert.equal(eventResponse.status, 200);

  const privateEventResponse = await jsonRequest('post', '/api/events', adminToken, {
    name: 'Private Test Event',
    date: '2028-01-01',
  });
  const privateEventId = privateEventResponse.body.data.event._id;
  const forbiddenEventResponse = await jsonRequest('get', `/api/events/${privateEventId}`, teamToken);
  assert.equal(forbiddenEventResponse.status, 403);

  const uploadResponse = await request(app)
    .post(`/api/events/${eventId}/photos`)
    .set('Authorization', `Bearer ${teamToken}`)
    .attach('photos', validPngBuffer, { filename: 'test.png', contentType: 'image/png' });
  assert.equal(uploadResponse.status, 201);
  assert.equal(uploadResponse.body.data.photos.length, 1);
  photoId = uploadResponse.body.data.photos[0]._id;

  const teamSelectionResponse = await jsonRequest('patch', `/api/photos/${photoId}/select`, teamToken);
  assert.equal(teamSelectionResponse.status, 403);

  const teamPublishResponse = await jsonRequest('post', `/api/events/${eventId}/gallery/publish`, teamToken, { pin: '482917' });
  assert.equal(teamPublishResponse.status, 403);

  const selectionResponse = await jsonRequest('patch', `/api/photos/${photoId}/select`, adminToken);
  assert.equal(selectionResponse.status, 200);
  assert.equal(selectionResponse.body.data.photo.isSelected, true);

  const publishResponse = await jsonRequest('post', `/api/events/${eventId}/gallery/publish`, adminToken, { pin: '482917' });
  assert.equal(publishResponse.status, 200);
  assert.equal(publishResponse.body.data.selectedCount, 1);
  galleryToken = publishResponse.body.data.galleryUrl.split('/').pop();

  const invalidPinResponse = await jsonRequest('post', `/api/public/gallery/${galleryToken}/verify`, null, { pin: '000000' });
  assert.equal(invalidPinResponse.status, 401);

  const verifyResponse = await jsonRequest('post', `/api/public/gallery/${galleryToken}/verify`, null, { pin: '482917' });
  assert.equal(verifyResponse.status, 200);

  const publicPhotosResponse = await request(app)
    .get(`/api/public/gallery/${galleryToken}/photos`)
    .set('Authorization', `Bearer ${verifyResponse.body.data.accessToken}`);
  assert.equal(publicPhotosResponse.status, 200);
  assert.equal(publicPhotosResponse.body.data.event.name, 'Test Event');
  assert.equal(publicPhotosResponse.body.data.event.description, 'Integration test event');
  assert.equal(publicPhotosResponse.body.data.photos.length, 1);
  assert.equal(publicPhotosResponse.body.data.photos[0]._id, photoId);
});

test('rejects gallery photo access without a gallery access token', async () => {
  const response = await request(app).get(`/api/public/gallery/${galleryToken}/photos`);
  assert.equal(response.status, 401);
});