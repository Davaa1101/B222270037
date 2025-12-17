const axios = require('axios');

/**
 * Гүйцэтгэлийн туршилт хийх класс
 * Performance Testing Class
 */
class PerformanceTester {
  constructor(baseUrl, options = {}) {
    this.baseUrl = baseUrl;
    this.numRequests = options.numRequests || 100;
    this.concurrentUsers = options.concurrentUsers || 10;
    this.timeout = options.timeout || 5000;
    this.responseTimes = [];
    this.errors = [];
    this.successCount = 0;
    this.failureCount = 0;
  }

  /**
   * Нэг HTTP хүсэлт илгээх
   */
  async makeRequest(endpoint, method = 'GET', data = null, headers = {}) {
    const startTime = Date.now();
    
    try {
      const config = {
        method,
        url: `${this.baseUrl}${endpoint}`,
        headers,
        timeout: this.timeout,
        data
      };

      const response = await axios(config);
      const endTime = Date.now();
      const responseTime = endTime - startTime;

      this.responseTimes.push(responseTime);
      this.successCount++;

      return {
        success: true,
        statusCode: response.status,
        responseTime,
        dataSize: JSON.stringify(response.data).length
      };
    } catch (error) {
      const endTime = Date.now();
      const responseTime = endTime - startTime;

      this.failureCount++;
      this.errors.push({
        message: error.message,
        endpoint,
        responseTime
      });

      return {
        success: false,
        error: error.message,
        responseTime
      };
    }
  }

  /**
   * Олон хэрэглэгчтэй хүсэлтүүдийг зэрэг ажиллуулах
   */
  async runConcurrentRequests(endpoint, method = 'GET', data = null, headers = {}) {
    const requestsPerUser = Math.floor(this.numRequests / this.concurrentUsers);
    const promises = [];

    for (let i = 0; i < this.concurrentUsers; i++) {
      for (let j = 0; j < requestsPerUser; j++) {
        promises.push(this.makeRequest(endpoint, method, data, headers));
      }
    }

    return Promise.all(promises);
  }

  /**
   * Статистик тооцоолох
   */
  calculateStatistics() {
    if (this.responseTimes.length === 0) {
      return null;
    }

    const sortedTimes = [...this.responseTimes].sort((a, b) => a - b);
    const sum = sortedTimes.reduce((acc, time) => acc + time, 0);
    const avg = sum / sortedTimes.length;
    const min = sortedTimes[0];
    const max = sortedTimes[sortedTimes.length - 1];
    
    // Median
    const mid = Math.floor(sortedTimes.length / 2);
    const median = sortedTimes.length % 2 === 0
      ? (sortedTimes[mid - 1] + sortedTimes[mid]) / 2
      : sortedTimes[mid];

    // 95th percentile
    const p95Index = Math.floor(sortedTimes.length * 0.95);
    const p95 = sortedTimes[p95Index];

    // 99th percentile
    const p99Index = Math.floor(sortedTimes.length * 0.99);
    const p99 = sortedTimes[p99Index];

    return {
      totalRequests: this.numRequests,
      successCount: this.successCount,
      failureCount: this.failureCount,
      avgResponseTime: avg.toFixed(2),
      medianResponseTime: median.toFixed(2),
      minResponseTime: min,
      maxResponseTime: max,
      p95ResponseTime: p95,
      p99ResponseTime: p99,
      successRate: ((this.successCount / this.numRequests) * 100).toFixed(2)
    };
  }

  /**
   * Туршилт ажиллуулах
   */
  async runTest(testConfig) {
    console.log('\n=== Гүйцэтгэлийн туршилт эхэллээ ===');
    console.log(`Endpoint: ${testConfig.endpoint}`);
    console.log(`Method: ${testConfig.method || 'GET'}`);
    console.log(`Нийт хүсэлт: ${this.numRequests}`);
    console.log(`Зэрэг ажиллах хэрэглэгч: ${this.concurrentUsers}`);
    console.log('-----------------------------------\n');

    const startTime = Date.now();

    await this.runConcurrentRequests(
      testConfig.endpoint,
      testConfig.method,
      testConfig.data,
      testConfig.headers
    );

    const endTime = Date.now();
    const totalTime = (endTime - startTime) / 1000;

    const stats = this.calculateStatistics();
    
    if (!stats) {
      console.log('❌ Туршилт амжилтгүй боллоо');
      return;
    }

    console.log('=== Үр дүн ===');
    console.log(`Нийт хугацаа: ${totalTime.toFixed(2)} секунд`);
    console.log(`Амжилттай хүсэлт: ${stats.successCount}`);
    console.log(`Амжилтгүй хүсэлт: ${stats.failureCount}`);
    console.log(`Амжилтын хувь: ${stats.successRate}%`);
    console.log(`\nХариу өгөх хугацаа:`);
    console.log(`  - Дундаж: ${stats.avgResponseTime}ms`);
    console.log(`  - Median: ${stats.medianResponseTime}ms`);
    console.log(`  - Хамгийн бага: ${stats.minResponseTime}ms`);
    console.log(`  - Хамгийн их: ${stats.maxResponseTime}ms`);
    console.log(`  - 95 percentile: ${stats.p95ResponseTime}ms`);
    console.log(`  - 99 percentile: ${stats.p99ResponseTime}ms`);
    console.log(`\nСекунд тутамд: ${(this.successCount / totalTime).toFixed(2)} хүсэлт`);

    if (this.errors.length > 0) {
      console.log(`\n⚠️ Алдаанууд (эхний 5):`);
      this.errors.slice(0, 5).forEach((error, index) => {
        console.log(`  ${index + 1}. ${error.endpoint}: ${error.message}`);
      });
    }

    return stats;
  }

  /**
   * Олон endpoint-ийг туршах
   */
  async runMultipleTests(testConfigs) {
    const results = [];

    for (const config of testConfigs) {
      this.responseTimes = [];
      this.errors = [];
      this.successCount = 0;
      this.failureCount = 0;

      const result = await this.runTest(config);
      results.push({
        endpoint: config.endpoint,
        ...result
      });

      // Дараагийн тест хүртэл хүлээх
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    return results;
  }
}

/**
 * Хэрэглээний жишээ
 */
async function runPerformanceTests() {
  // Production болон Development орчны URL
  const API_URL = process.env.API_URL || 'http://localhost:3000';

  const tester = new PerformanceTester(API_URL, {
    numRequests: 100,
    concurrentUsers: 10,
    timeout: 5000
  });

  // Туршилт хийх endpoint-үүд
  const testConfigs = [
    {
      name: 'Public items endpoint',
      endpoint: '/api/items',
      method: 'GET'
    },
    {
      name: 'Categories endpoint',
      endpoint: '/api/items/categories',
      method: 'GET'
    },
    {
      name: 'Health check',
      endpoint: '/api/health',
      method: 'GET'
    }
  ];

  const results = await tester.runMultipleTests(testConfigs);

  console.log('\n=== Эцсийн дүгнэлт ===');
  results.forEach((result, index) => {
    console.log(`\n${index + 1}. ${testConfigs[index].name}`);
    console.log(`   Амжилтын хувь: ${result.successRate}%`);
    console.log(`   Дундаж хугацаа: ${result.avgResponseTime}ms`);
  });
}

// Export
module.exports = {
  PerformanceTester,
  runPerformanceTests
};

// Командын мөрөөс ажиллуулах
if (require.main === module) {
  runPerformanceTests()
    .then(() => {
      console.log('\n✅ Бүх туршилт дууслаа');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Алдаа гарлаа:', error.message);
      process.exit(1);
    });
}
