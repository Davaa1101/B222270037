const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const User = require('../models/User');
const Item = require('../models/Item');
const Offer = require('../models/Offer');
const { Category } = require('../models/index');

const testDbUri = process.env.MONGO_URI_TEST || 'mongodb+srv://Davaa:fJD7O91OlRiRZOWw@cluster0.x6zwbmy.mongodb.net/barter-platform-test';

describe('Offers Integration Tests', () => {
  let ownerToken;
  let ownerUser;
  let offerorToken;
  let offerorUser;
  let testItem;
  let offerItem;
  let testCategory;

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(testDbUri, {
        useNewUrlParser: true,
        useUnifiedTopology: true
      });
    }

    // Create test category
    testCategory = await Category.findOneAndUpdate(
      { name: 'electronics' },
      {
        name: 'electronics',
        displayName: 'Электроник',
        sortOrder: 1,
        icon: 'fas fa-laptop'
      },
      { upsert: true, new: true }
    );
  });

  afterAll(async () => {
    await Offer.deleteMany({ message: /Test Offer/i });
    await Item.deleteMany({ title: /Test Offer Item/i });
    await User.deleteMany({ email: /testoffer.*@example\.com/ });
  });

  beforeEach(async () => {
    await Offer.deleteMany({ message: /Test Offer/i });
    await Item.deleteMany({ title: /Test Offer Item/i });
    await User.deleteMany({ email: /testoffer.*@example\.com/ });

    // Register item owner
    const ownerData = {
      name: 'Item Owner',
      email: 'testofferowner@example.com',
      password: 'TestPassword123',
      phone: '99112233'
    };

    const ownerResponse = await request(app)
      .post('/api/auth/register')
      .send(ownerData);

    ownerToken = ownerResponse.body.token;
    ownerUser = ownerResponse.body.user;

    // Register offeror
    const offerorData = {
      name: 'Offeror User',
      email: 'testofferofferor@example.com',
      password: 'TestPassword123',
      phone: '88112233'
    };

    const offerorResponse = await request(app)
      .post('/api/auth/register')
      .send(offerorData);

    offerorToken = offerorResponse.body.token;
    offerorUser = offerorResponse.body.user;

    // Create test item (owned by owner)
    testItem = await Item.create({
      title: 'Test Offer Item Owner',
      description: 'Item to receive offers',
      category: testCategory.name,
      condition: 'new',
      owner: ownerUser._id,
      status: 'active',
      location: { city: 'Улаанбаатар', district: 'Чингэлтэй' },
      wantedItems: {
        description: 'Looking for electronics',
        categories: [testCategory.name]
      }
    });

    // Create offer item (owned by offeror)
    offerItem = await Item.create({
      title: 'Test Offer Item Offeror',
      description: 'Item to offer',
      category: testCategory.name,
      condition: 'good',
      owner: offerorUser._id,
      status: 'active',
      location: { city: 'Улаанбаатар', district: 'Баянзүрх' },
      wantedItems: {
        description: 'Looking for trade',
        categories: [testCategory.name]
      }
    });
  });

  describe('POST /api/offers', () => {
    it('should create offer successfully', async () => {
      const offerData = {
        itemId: testItem._id.toString(),
        offeredItems: [offerItem._id.toString()],
        message: 'Test Offer Message'
      };

      const response = await request(app)
        .post('/api/offers')
        .set('Authorization', `Bearer ${offerorToken}`)
        .send(offerData)
        .expect(201);

      expect(response.body.message).toContain('success');
      expect(response.body.offer).toHaveProperty('_id');
      expect(response.body.offer.item.toString()).toBe(testItem._id.toString());
      expect(response.body.offer.offeror.toString()).toBe(offerorUser._id);
    });

    it('should return error when creating offer without authentication', async () => {
      const offerData = {
        itemId: testItem._id.toString(),
        offeredItems: [offerItem._id.toString()],
        message: 'Test Offer Unauthorized'
      };

      const response = await request(app)
        .post('/api/offers')
        .send(offerData)
        .expect(401);

      expect(response.body.message).toContain('token');
    });

    it('should return error when offering on own item', async () => {
      const offerData = {
        itemId: testItem._id.toString(),
        offeredItems: [offerItem._id.toString()],
        message: 'Test Offer Own Item'
      };

      const response = await request(app)
        .post('/api/offers')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send(offerData)
        .expect(400);

      expect(response.body.message).toContain('own item');
    });

    it('should return error for missing required fields', async () => {
      const offerData = {
        itemId: testItem._id.toString()
        // Missing offeredItems and message
      };

      const response = await request(app)
        .post('/api/offers')
        .set('Authorization', `Bearer ${offerorToken}`)
        .send(offerData)
        .expect(400);

      expect(response.body.message).toBeDefined();
    });

    it('should return error for non-existent item', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const offerData = {
        itemId: fakeId.toString(),
        offeredItems: [offerItem._id.toString()],
        message: 'Test Offer Non-existent'
      };

      const response = await request(app)
        .post('/api/offers')
        .set('Authorization', `Bearer ${offerorToken}`)
        .send(offerData)
        .expect(404);

      expect(response.body.message).toContain('not found');
    });
  });

  describe('GET /api/offers/sent', () => {
    beforeEach(async () => {
      // Create test offer
      await Offer.create({
        item: testItem._id,
        offeror: offerorUser._id,
        offeredItems: [offerItem._id],
        message: 'Test Offer Sent',
        status: 'pending'
      });
    });

    it('should get sent offers for authenticated user', async () => {
      const response = await request(app)
        .get('/api/offers/sent')
        .set('Authorization', `Bearer ${offerorToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('offers');
      expect(Array.isArray(response.body.offers)).toBe(true);
      expect(response.body.offers.length).toBeGreaterThanOrEqual(1);
      expect(response.body.offers[0].offeror._id).toBe(offerorUser._id);
    });

    it('should return error without authentication', async () => {
      const response = await request(app)
        .get('/api/offers/sent')
        .expect(401);

      expect(response.body.message).toContain('token');
    });

    it('should return empty array for user with no sent offers', async () => {
      const response = await request(app)
        .get('/api/offers/sent')
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200);

      expect(response.body.offers).toEqual([]);
    });
  });

  describe('GET /api/offers/received', () => {
    beforeEach(async () => {
      // Create test offer
      await Offer.create({
        item: testItem._id,
        offeror: offerorUser._id,
        offeredItems: [offerItem._id],
        message: 'Test Offer Received',
        status: 'pending'
      });
    });

    it('should get received offers for item owner', async () => {
      const response = await request(app)
        .get('/api/offers/received')
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('offers');
      expect(Array.isArray(response.body.offers)).toBe(true);
      expect(response.body.offers.length).toBeGreaterThanOrEqual(1);
    });

    it('should return error without authentication', async () => {
      const response = await request(app)
        .get('/api/offers/received')
        .expect(401);

      expect(response.body.message).toContain('token');
    });

    it('should return empty array for user with no received offers', async () => {
      const response = await request(app)
        .get('/api/offers/received')
        .set('Authorization', `Bearer ${offerorToken}`)
        .expect(200);

      expect(response.body.offers).toEqual([]);
    });
  });

  describe('GET /api/offers/:id', () => {
    let testOffer;

    beforeEach(async () => {
      testOffer = await Offer.create({
        item: testItem._id,
        offeror: offerorUser._id,
        offeredItems: [offerItem._id],
        message: 'Test Offer Detail',
        status: 'pending'
      });
    });

    it('should get offer details as item owner', async () => {
      const response = await request(app)
        .get(`/api/offers/${testOffer._id}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200);

      expect(response.body._id).toBe(testOffer._id.toString());
      expect(response.body.message).toBe('Test Offer Detail');
    });

    it('should get offer details as offeror', async () => {
      const response = await request(app)
        .get(`/api/offers/${testOffer._id}`)
        .set('Authorization', `Bearer ${offerorToken}`)
        .expect(200);

      expect(response.body._id).toBe(testOffer._id.toString());
    });

    it('should return error without authentication', async () => {
      const response = await request(app)
        .get(`/api/offers/${testOffer._id}`)
        .expect(401);

      expect(response.body.message).toContain('token');
    });

    it('should return 404 for non-existent offer', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .get(`/api/offers/${fakeId}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(404);

      expect(response.body.message).toContain('not found');
    });
  });

  describe('PUT /api/offers/:id/accept', () => {
    let testOffer;

    beforeEach(async () => {
      testOffer = await Offer.create({
        item: testItem._id,
        offeror: offerorUser._id,
        offeredItems: [offerItem._id],
        message: 'Test Offer Accept',
        status: 'pending'
      });
    });

    it('should accept offer as item owner', async () => {
      const response = await request(app)
        .put(`/api/offers/${testOffer._id}/accept`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200);

      expect(response.body.message).toContain('accepted');
      expect(response.body.offer.status).toBe('accepted');
    });

    it('should return error when non-owner tries to accept', async () => {
      const response = await request(app)
        .put(`/api/offers/${testOffer._id}/accept`)
        .set('Authorization', `Bearer ${offerorToken}`)
        .expect(403);

      expect(response.body.message).toContain('Not authorized');
    });

    it('should return error without authentication', async () => {
      const response = await request(app)
        .put(`/api/offers/${testOffer._id}/accept`)
        .expect(401);

      expect(response.body.message).toContain('token');
    });

    it('should return error for already accepted offer', async () => {
      // Accept first time
      await request(app)
        .put(`/api/offers/${testOffer._id}/accept`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200);

      // Try to accept again
      const response = await request(app)
        .put(`/api/offers/${testOffer._id}/accept`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(400);

      expect(response.body.message).toContain('already');
    });
  });

  describe('PUT /api/offers/:id/reject', () => {
    let testOffer;

    beforeEach(async () => {
      testOffer = await Offer.create({
        item: testItem._id,
        offeror: offerorUser._id,
        offeredItems: [offerItem._id],
        message: 'Test Offer Reject',
        status: 'pending'
      });
    });

    it('should reject offer as item owner', async () => {
      const response = await request(app)
        .put(`/api/offers/${testOffer._id}/reject`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200);

      expect(response.body.message).toContain('rejected');
      expect(response.body.offer.status).toBe('rejected');
    });

    it('should return error when non-owner tries to reject', async () => {
      const response = await request(app)
        .put(`/api/offers/${testOffer._id}/reject`)
        .set('Authorization', `Bearer ${offerorToken}`)
        .expect(403);

      expect(response.body.message).toContain('Not authorized');
    });

    it('should return error without authentication', async () => {
      const response = await request(app)
        .put(`/api/offers/${testOffer._id}/reject`)
        .expect(401);

      expect(response.body.message).toContain('token');
    });
  });

  describe('DELETE /api/offers/:id', () => {
    let testOffer;

    beforeEach(async () => {
      testOffer = await Offer.create({
        item: testItem._id,
        offeror: offerorUser._id,
        offeredItems: [offerItem._id],
        message: 'Test Offer Delete',
        status: 'pending'
      });
    });

    it('should delete offer as offeror', async () => {
      const response = await request(app)
        .delete(`/api/offers/${testOffer._id}`)
        .set('Authorization', `Bearer ${offerorToken}`)
        .expect(200);

      expect(response.body.message).toContain('deleted');

      // Verify deletion
      const deletedOffer = await Offer.findById(testOffer._id);
      expect(deletedOffer).toBeNull();
    });

    it('should return error when non-offeror tries to delete', async () => {
      const response = await request(app)
        .delete(`/api/offers/${testOffer._id}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(403);

      expect(response.body.message).toContain('Not authorized');
    });

    it('should return error without authentication', async () => {
      const response = await request(app)
        .delete(`/api/offers/${testOffer._id}`)
        .expect(401);

      expect(response.body.message).toContain('token');
    });

    it('should return 404 for non-existent offer', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .delete(`/api/offers/${fakeId}`)
        .set('Authorization', `Bearer ${offerorToken}`)
        .expect(404);

      expect(response.body.message).toContain('not found');
    });
  });
});
