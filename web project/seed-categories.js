const mongoose = require('mongoose');
const { Category } = require('./models/index');

// Database connection
const connectDB = async () => {
  try {
    await mongoose.connect('mongodb+srv://Davaa:fJD7O91OlRiRZOWw@cluster0.x6zwbmy.mongodb.net/barter-platform', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('MongoDB connected successfully');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  }
};

const categories = [
  { name: 'electronics', displayName: 'Электроник', sortOrder: 1, icon: 'fas fa-laptop' },
  { name: 'clothing', displayName: 'Хувцас', sortOrder: 2, icon: 'fas fa-tshirt' },
  { name: 'books', displayName: 'Ном', sortOrder: 3, icon: 'fas fa-book' },
  { name: 'home_garden', displayName: 'Гэр ахуй, цэцэрлэг', sortOrder: 4, icon: 'fas fa-home' },
  { name: 'sports_outdoors', displayName: 'Спорт, гадаа', sortOrder: 5, icon: 'fas fa-football-ball' },
  { name: 'toys_games', displayName: 'Тоглоом', sortOrder: 6, icon: 'fas fa-gamepad' },
  { name: 'collectibles', displayName: 'Цуглуулга', sortOrder: 7, icon: 'fas fa-coins' },
  { name: 'automotive', displayName: 'Автомашин', sortOrder: 8, icon: 'fas fa-car' },
  { name: 'music_instruments', displayName: 'Хөгжмийн зэмсэг', sortOrder: 9, icon: 'fas fa-music' },
  { name: 'art_crafts', displayName: 'Урлаг, гар урлал', sortOrder: 10, icon: 'fas fa-palette' },
  { name: 'tools', displayName: 'Багаж хэрэгсэл', sortOrder: 11, icon: 'fas fa-tools' },
  { name: 'other', displayName: 'Бусад', sortOrder: 12, icon: 'fas fa-ellipsis-h' }
];

const seedCategories = async () => {
  try {
    console.log('Seeding categories...');

    // Clear existing categories
    await Category.deleteMany({});
    console.log('Existing categories cleared');

    // Insert new categories
    const createdCategories = await Category.insertMany(categories);
    console.log(`${createdCategories.length} categories created successfully`);

    console.log('Categories seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding categories:', error);
    process.exit(1);
  }
};

// Run the seeding
const run = async () => {
  await connectDB();
  await seedCategories();
};

run();