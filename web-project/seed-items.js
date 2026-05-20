const mongoose = require('mongoose');
const Item = require('./models/Item');
const User = require('./models/User');
require('dotenv').config();

const sampleItems = [
  {
    title: 'iPhone 12 Pro',
    description: 'Сайн байдалтай iPhone 12 Pro, 128GB санах ой. Бүх функц ажиллах байдалтай.',
    category: 'electronics',
    condition: 'good',
    location: {
      city: 'Улаанбаатар',
      district: 'Сүхбаатар'
    },
    wantedItems: {
      description: 'Samsung Galaxy S21 эсвэл Android утас',
      categories: ['electronics']
    },
    images: []
  },
  {
    title: 'Номнууд олон төрөл',
    description: 'Монгол болон англи хэл дээрх номнууд. Уран зохиол, сурах бичиг зэрэг.',
    category: 'books',
    condition: 'good',
    location: {
      city: 'Дархан',
      district: 'Дархан'
    },
    wantedItems: {
      description: 'Компьютерийн ном эсвэл техникийн ном',
      categories: ['books']
    },
    images: []
  },
  {
    title: 'Спортын кроссовок',
    description: 'Nike Air Max, 42 хэмжээ. Хэд хэдэн удаа өмссөн, сайн байдалтай.',
    category: 'clothing',
    condition: 'like_new',
    location: {
      city: 'Улаанбаатар',
      district: 'Чингэлтэй'
    },
    wantedItems: {
      description: 'Adidas кроссовок эсвэл спортын хувцас',
      categories: ['clothing', 'sports_outdoors']
    },
    images: []
  }
];

async function seedItems() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://Davaa:fJD7O91OlRiRZOWw@cluster0.x6zwbmy.mongodb.net/barter-platform');
    console.log('Connected to MongoDB');
    
    // Find a test user or create one
    let testUser = await User.findOne({ email: 'test@example.com' });
    if (!testUser) {
      testUser = new User({
        name: 'Test User',
        email: 'test@example.com',
        password: 'hashedpassword123',
        phone: '99112233',
        location: {
          city: 'Улаанбаатар',
          district: 'Чингэлтэй'
        }
      });
      await testUser.save();
      console.log('Created test user');
    }
    
    // Clear existing items
    await Item.deleteMany({});
    console.log('Cleared existing items');
    
    // Create items with owner
    const itemsWithOwner = sampleItems.map(item => ({
      ...item,
      owner: testUser._id
    }));
    
    await Item.insertMany(itemsWithOwner);
    console.log(`Inserted ${sampleItems.length} items`);
    
    // Display the items
    const savedItems = await Item.find().populate('owner', 'name');
    console.log('\nSaved items:');
    savedItems.forEach(item => {
      console.log(`- ${item.title} by ${item.owner.name}`);
    });
    
    console.log('\nItem seeding completed successfully!');
  } catch (error) {
    console.error('Error seeding items:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    process.exit(0);
  }
}

seedItems();