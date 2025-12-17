const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const User = require('../models/User');
const Item = require('../models/Item');
const { Category } = require('../models/index');

const testDbUri = process.env.MONGO_URI_TEST || 'mongodb+srv://Davaa:fJD7O91OlRiRZOWw@cluster0.x6zwbmy.mongodb.net/barter-platform-test';

describe('Items Integration Tests', () => {
  let authToken;
  let testUser;
  let testCategory;

  beforeAll(async () => {
    // Connect to test database
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
    // Clean up
    await Item.deleteMany({ title: /Test Item/i });
    await User.deleteMany({ email: /testitem.*@example\.com/ });
  });

  beforeEach(async () => {
    // Clean up items before each test
    await Item.deleteMany({ title: /Test Item/i });
    await User.deleteMany({ email: /testitem.*@example\.com/ });

    // Register user and get token
    const userData = {
      name: 'Test Item User',
      email: 'testitem@example.com',
      password: 'TestPassword123',
      phone: '99112233'
    };

    const response = await request(app)
      .post('/api/auth/register')
      .send(userData);

    authToken = response.body.token;
    testUser = response.body.user;
  });

  describe('GET /api/items', () => {
    beforeEach(async () => {
      // Create test items
      const items = [
        {
          title: 'Test Item 1',
          description: 'Test description 1',
          category: testCategory.name,
          condition: 'new',
          owner: testUser._id,
          status: 'active',
          location: { city: 'Улаанбаатар', district: 'Чингэлтэй' },
          wantedItems: {
            description: 'Looking for similar items',
            categories: [testCategory.name]
          }
        },
        {
          title: 'Test Item 2',
          description: 'Test description 2',
          category: testCategory.name,
          condition: 'good',
          owner: testUser._id,
          status: 'active',
          location: { city: 'Улаанбаатар', district: 'Баянзүрх' },
          wantedItems: {
            description: 'Looking for exchange items',
            categories: [testCategory.name]
          }
        }
      ];

      await Item.insertMany(items);
    });

    it('should return all items with pagination', async () => {
      const response = await request(app)
        .get('/api/items')
        .expect(200);

      expect(response.body).toHaveProperty('items');
      expect(response.body).toHaveProperty('pagination');
      expect(Array.isArray(response.body.items)).toBe(true);
      expect(response.body.items.length).toBeGreaterThanOrEqual(2);
    });

    it('should filter items by category', async () => {
      const response = await request(app)
        .get(`/api/items?category=${testCategory.name}`)
        .expect(200);

      expect(response.body.items.length).toBeGreaterThanOrEqual(2);
      response.body.items.forEach(item => {
        expect(item.category).toBe(testCategory.name);
      });
    });

    it('should filter items by condition', async () => {
      const response = await request(app)
        .get('/api/items?condition=new')
        .expect(200);

      response.body.items.forEach(item => {
        expect(item.condition).toBe('new');
      });
    });

    it('should search items by title', async () => {
      const response = await request(app)
        .get('/api/items?search=Test Item 1')
        .expect(200);

      expect(response.body.items.length).toBeGreaterThanOrEqual(1);
      expect(response.body.items[0].title).toContain('Test Item 1');
    });

    it('should paginate results', async () => {
      const response = await request(app)
        .get('/api/items?page=1&limit=1')
        .expect(200);

      expect(response.body.items.length).toBe(1);
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(1);
    });
  });

  describe('GET /api/items/:id', () => {
    let testItem;

    beforeEach(async () => {
      testItem = await Item.create({
        title: 'Test Item Detail',
        description: 'Test description detail',
        category: testCategory.name,
        condition: 'new',
        owner: testUser._id,
        status: 'active',
        location: { city: 'Улаанбаатар', district: 'Чингэлтэй' },
        wantedItems: {
          description: 'Looking for items to trade',
          categories: [testCategory.name]
        }
      });
    });

    it('should return item details by ID', async () => {
      const response = await request(app)
        .get(`/api/items/${testItem._id}`)
        .expect(200);

      expect(response.body.title).toBe(testItem.title);
      expect(response.body.description).toBe(testItem.description);
      expect(response.body).toHaveProperty('owner');
    });

    it('should return 404 for non-existent item ID', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .get(`/api/items/${fakeId}`)
        .expect(404);

      expect(response.body.message).toContain('not found');
    });

    it('should return 400 for invalid item ID format', async () => {
      const response = await request(app)
        .get('/api/items/invalid-id')
        .expect(400);

      expect(response.body.message).toContain('Invalid');
    });
  });

  describe('POST /api/items', () => {
    it('should create new item with authentication', async () => {
      const newItem = {
        title: 'Test Item New',
        description: 'Test description new',
        category: testCategory.name,
        condition: 'new',
        location: { city: 'Улаанбаатар', district: 'Чингэлтэй' },
        wantedItems: {
          description: 'Looking for trade items',
          categories: [testCategory.name]
        }
      };

      const response = await request(app)
        .post('/api/items')
        .set('Authorization', `Bearer ${authToken}`)
        .send(newItem)
        .expect(201);

      expect(response.body.title).toBe(newItem.title);
      expect(response.body.description).toBe(newItem.description);
      expect(response.body.owner).toBe(testUser._id);
      expect(response.body.status).toBe('active');
    });

    it('should return error without authentication', async () => {
      const newItem = {
        title: 'Test Item Unauthorized',
        description: 'Test description',
        category: testCategory.name,
        condition: 'new'
      };

      const response = await request(app)
        .post('/api/items')
        .send(newItem)
        .expect(401);

      expect(response.body.message).toContain('token');
    });

    it('should return error for missing required fields', async () => {
      const newItem = {
        title: 'Test Item Incomplete'
        // Missing description, category, condition
      };

      const response = await request(app)
        .post('/api/items')
        .set('Authorization', `Bearer ${authToken}`)
        .send(newItem)
        .expect(400);

      expect(response.body.message).toBeDefined();
    });

    it('should return error for invalid category', async () => {
      const newItem = {
        title: 'Test Item Invalid Category',
        description: 'Test description',
        category: 'invalid-category',
        condition: 'new'
      };

      const response = await request(app)
        .post('/api/items')
        .set('Authorization', `Bearer ${authToken}`)
        .send(newItem)
        .expect(400);

      expect(response.body.message).toContain('Invalid category');
    });
  });

  describe('PUT /api/items/:id', () => {
    let testItem;

    beforeEach(async () => {
      testItem = await Item.create({
        title: 'Test Item Update',
        description: 'Test description update',
        category: testCategory.name,
        condition: 'new',
        owner: testUser._id,
        status: 'active',
        location: { city: 'Улаанбаатар', district: 'Чингэлтэй' },
        wantedItems: {
          description: 'Looking for items',
          categories: [testCategory.name]
        }
      });
    });

    it('should update item successfully', async () => {
      const updates = {
        title: 'Test Item Updated Title',
        description: 'Updated description',
        condition: 'good'
      };

      const response = await request(app)
        .put(`/api/items/${testItem._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updates)
        .expect(200);

      expect(response.body.title).toBe(updates.title);
      expect(response.body.description).toBe(updates.description);
      expect(response.body.condition).toBe('good');
    });

    it('should return error when updating without authentication', async () => {
      const updates = { title: 'Unauthorized Update' };

      const response = await request(app)
        .put(`/api/items/${testItem._id}`)
        .send(updates)
        .expect(401);

      expect(response.body.message).toContain('token');
    });

    it('should return error when updating item owned by another user', async () => {
      // Create another user
      const otherUserData = {
        name: 'Other User',
        email: 'testitemother@example.com',
        password: 'TestPassword123',
        phone: '88112233'
      };

      const otherUserResponse = await request(app)
        .post('/api/auth/register')
        .send(otherUserData);

      const otherToken = otherUserResponse.body.token;

      const updates = { title: 'Trying to update someone elses item' };

      const response = await request(app)
        .put(`/api/items/${testItem._id}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .send(updates)
        .expect(403);

      expect(response.body.message).toContain('Not authorized');
    });

    it('should return 404 for non-existent item', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const updates = { title: 'Update Non-existent' };

      const response = await request(app)
        .put(`/api/items/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updates)
        .expect(404);

      expect(response.body.message).toContain('not found');
    });
  });

  describe('DELETE /api/items/:id', () => {
    let testItem;

    beforeEach(async () => {
      testItem = await Item.create({
        title: 'Test Item Delete',
        description: 'Test description delete',
        category: testCategory.name,
        condition: 'new',
        owner: testUser._id,
        status: 'active',
        location: { city: 'Улаанбаатар', district: 'Чингэлтэй' },
        wantedItems: {
          description: 'Looking for items',
          categories: [testCategory.name]
        }
      });
    });

    it('should delete item successfully', async () => {
      const response = await request(app)
        .delete(`/api/items/${testItem._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.message).toContain('deleted');

      // Verify item is deleted
      const deletedItem = await Item.findById(testItem._id);
      expect(deletedItem).toBeNull();
    });

    it('should return error when deleting without authentication', async () => {
      const response = await request(app)
        .delete(`/api/items/${testItem._id}`)
        .expect(401);

      expect(response.body.message).toContain('token');
    });

    it('should return error when deleting item owned by another user', async () => {
      // Create another user
      const otherUserData = {
        name: 'Other Delete User',
        email: 'testitemdelete@example.com',
        password: 'TestPassword123',
        phone: '77112233'
      };

      const otherUserResponse = await request(app)
        .post('/api/auth/register')
        .send(otherUserData);

      const otherToken = otherUserResponse.body.token;

      const response = await request(app)
        .delete(`/api/items/${testItem._id}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .expect(403);

      expect(response.body.message).toContain('Not authorized');
    });

    it('should return 404 for non-existent item', async () => {
      const fakeId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .delete(`/api/items/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.message).toContain('not found');
    });
  });
});
