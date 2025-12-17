/**
 * Долоо хоног 13: Аюулгүй байдлын туршилт
 * Week 13: Security Testing Examples
 */

const axios = require('axios');

class SecurityTester {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
    this.vulnerabilities = [];
  }

  /**
   * SQL Injection туршилт
   * Өгөгдлийн санд хууль бус query илгээх оролдлого
   */
  async testSQLInjection() {
    console.log('\n=== SQL Injection Туршилт ===');
    
    const sqlPayloads = [
      "' OR '1'='1",
      "admin' --",
      "' OR '1'='1' --",
      "1' UNION SELECT NULL--",
      "' DROP TABLE users--"
    ];

    for (const payload of sqlPayloads) {
      try {
        const response = await axios.post(`${this.baseUrl}/api/auth/login`, {
          email: `test${payload}@example.com`,
          password: payload
        });

        // Хэрэв амжилттай нэвтэрсэн бол - сул талтай!
        if (response.status === 200 && response.data.token) {
          this.vulnerabilities.push({
            type: 'SQL Injection',
            severity: 'CRITICAL',
            endpoint: '/api/auth/login',
            payload: payload,
            description: 'SQL injection амжилттай - Маш ноцтой эрсдэл!'
          });
          console.log(`❌ АНХААР: SQL injection илэрлээ - ${payload}`);
        } else {
          console.log(`✅ Хамгаалагдсан: ${payload}`);
        }
      } catch (error) {
        // Алдаа гарах нь хэвийн - хамгаалагдсан гэсэн үг
        console.log(`✅ Хамгаалагдсан: ${payload}`);
      }
    }
  }

  /**
   * XSS (Cross-Site Scripting) туршилт
   * JavaScript код оруулах оролдлого
   */
  async testXSS(authToken) {
    console.log('\n=== XSS Туршилт ===');
    
    const xssPayloads = [
      '<script>alert("XSS")</script>',
      '<img src=x onerror=alert("XSS")>',
      '<svg onload=alert("XSS")>',
      'javascript:alert("XSS")',
      '<iframe src="javascript:alert(\'XSS\')"></iframe>'
    ];

    for (const payload of xssPayloads) {
      try {
        const response = await axios.post(
          `${this.baseUrl}/api/items`,
          {
            title: payload,
            description: `Test item with XSS payload: ${payload}`,
            category: 'test',
            condition: 'new',
            city: 'UB',
            district: 'test'
          },
          {
            headers: { Authorization: `Bearer ${authToken}` }
          }
        );

        // Хэрэв payload-г escape хийгээгүй бол - эрсдэлтэй!
        if (response.data.item && response.data.item.title === payload) {
          this.vulnerabilities.push({
            type: 'XSS',
            severity: 'HIGH',
            endpoint: '/api/items',
            payload: payload,
            description: 'XSS payload escape хийгдээгүй байна'
          });
          console.log(`⚠️ АНХААР: XSS эрсдэл - ${payload.substring(0, 30)}...`);
        } else {
          console.log(`✅ Хамгаалагдсан: ${payload.substring(0, 30)}...`);
        }
      } catch (error) {
        console.log(`✅ Хамгаалагдсан: ${payload.substring(0, 30)}...`);
      }
    }
  }

  /**
   * Authentication bypass туршилт
   * Нэвтрэлт тойрч гарах оролдлого
   */
  async testAuthBypass() {
    console.log('\n=== Authentication Bypass Туршилт ===');

    const testCases = [
      {
        name: 'Токенгүй хандалт',
        headers: {},
        endpoint: '/api/items/my-items'
      },
      {
        name: 'Буруу токен',
        headers: { Authorization: 'Bearer invalid_token_12345' },
        endpoint: '/api/items/my-items'
      },
      {
        name: 'Хуучирсан токен',
        headers: { Authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.expired' },
        endpoint: '/api/items/my-items'
      }
    ];

    for (const test of testCases) {
      try {
        const response = await axios.get(
          `${this.baseUrl}${test.endpoint}`,
          { headers: test.headers }
        );

        // 200 хариу ирвэл - хамгаалалт ажиллаагүй!
        if (response.status === 200) {
          this.vulnerabilities.push({
            type: 'Authentication Bypass',
            severity: 'CRITICAL',
            endpoint: test.endpoint,
            description: `${test.name} - Хамгаалалт ажиллаагүй`
          });
          console.log(`❌ АНХААР: ${test.name} амжилттай боллоо!`);
        }
      } catch (error) {
        if (error.response && error.response.status === 401) {
          console.log(`✅ Хамгаалагдсан: ${test.name}`);
        } else {
          console.log(`⚠️ Алдаа: ${test.name} - ${error.message}`);
        }
      }
    }
  }

  /**
   * Brute Force туршилт
   * Нууц үг таах оролдлого
   */
  async testBruteForce() {
    console.log('\n=== Brute Force Protection Туршилт ===');

    const passwords = ['123456', 'password', 'admin', 'test123', '12345678'];
    let successCount = 0;
    let blockedCount = 0;

    for (let i = 0; i < 20; i++) {
      try {
        const response = await axios.post(`${this.baseUrl}/api/auth/login`, {
          email: 'test@example.com',
          password: passwords[i % passwords.length]
        });

        successCount++;
      } catch (error) {
        if (error.response) {
          if (error.response.status === 429) {
            // Rate limit ажиллаж байна - сайн!
            blockedCount++;
            console.log(`✅ Rate limit ажиллалаа - ${i + 1} оролдлого`);
            break;
          } else if (error.response.status === 401) {
            // Хэвийн буруу нууц үг
            console.log(`Оролдлого ${i + 1}: Буруу нууц үг`);
          }
        }
      }
    }

    if (blockedCount === 0) {
      this.vulnerabilities.push({
        type: 'Brute Force',
        severity: 'HIGH',
        endpoint: '/api/auth/login',
        description: 'Rate limiting байхгүй - brute force халдлагад эрсдэлтэй'
      });
      console.log('⚠️ АНХААР: Rate limiting ажиллаагүй!');
    }
  }

  /**
   * CORS туршилт
   */
  async testCORS() {
    console.log('\n=== CORS Configuration Туршилт ===');

    try {
      const response = await axios.get(`${this.baseUrl}/api/items`, {
        headers: {
          'Origin': 'http://malicious-site.com'
        }
      });

      if (response.headers['access-control-allow-origin'] === '*') {
        this.vulnerabilities.push({
          type: 'CORS Misconfiguration',
          severity: 'MEDIUM',
          description: 'Бүх domain-ээс хандах боломжтой (wildcard CORS)'
        });
        console.log('⚠️ АНХААР: CORS wildcard (*) тохируулагдсан байна');
      } else {
        console.log('✅ CORS зөв тохируулагдсан байна');
      }
    } catch (error) {
      console.log('✅ CORS хамгаалагдсан');
    }
  }

  /**
   * Бүх туршилтыг ажиллуулах
   */
  async runAllTests(authToken = null) {
    console.log('╔══════════════════════════════════════╗');
    console.log('║   Аюулгүй Байдлын Туршилт Эхэллээ   ║');
    console.log('╚══════════════════════════════════════╝');

    await this.testSQLInjection();
    
    if (authToken) {
      await this.testXSS(authToken);
    } else {
      console.log('\n⚠️ Auth token байхгүй тул XSS туршилт алгасав');
    }
    
    await this.testAuthBypass();
    await this.testBruteForce();
    await this.testCORS();

    this.printReport();
  }

  /**
   * Тайлан хэвлэх
   */
  printReport() {
    console.log('\n');
    console.log('╔══════════════════════════════════════╗');
    console.log('║      Аюулгүй Байдлын Тайлан         ║');
    console.log('╚══════════════════════════════════════╝');

    if (this.vulnerabilities.length === 0) {
      console.log('\n✅ Ямар ч сул тал илрээгүй!');
      console.log('Таны систем аюулгүй байдлын үндсэн шаардлагыг хангасан байна.\n');
    } else {
      console.log(`\n⚠️ ${this.vulnerabilities.length} сул тал илэрлээ:\n`);
      
      this.vulnerabilities.forEach((vuln, index) => {
        console.log(`${index + 1}. [${vuln.severity}] ${vuln.type}`);
        console.log(`   Endpoint: ${vuln.endpoint || 'N/A'}`);
        console.log(`   Тайлбар: ${vuln.description}`);
        if (vuln.payload) {
          console.log(`   Payload: ${vuln.payload}`);
        }
        console.log('');
      });

      console.log('Зөвлөмж:');
      console.log('- CRITICAL эсвэл HIGH түвшний сул талуудыг яаралтай засах');
      console.log('- Input validation, sanitization сайжруулах');
      console.log('- Rate limiting нэмэх');
      console.log('- CORS тохиргоог хатуу болгох\n');
    }
  }
}

/**
 * Туршилт ажиллуулах
 */
async function runSecurityTests() {
  const API_URL = process.env.API_URL || 'http://localhost:3000';
  
  const tester = new SecurityTester(API_URL);
  
  // Хэрэв та нэвтэрсэн token байгаа бол энд оруулна уу
  const authToken = process.env.TEST_AUTH_TOKEN || null;
  
  await tester.runAllTests(authToken);
}

module.exports = {
  SecurityTester,
  runSecurityTests
};

// Командын мөрөөс ажиллуулах
if (require.main === module) {
  runSecurityTests()
    .then(() => {
      console.log('✅ Аюулгүй байдлын туршилт дууслаа\n');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Алдаа гарлаа:', error.message);
      process.exit(1);
    });
}
