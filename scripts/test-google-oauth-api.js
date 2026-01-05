/**
 * Google OAuth API 端點測試腳本
 * 測試 API 是否正確響應（不包含實際的 Google Token）
 */

const http = require('http');

console.log('\n🧪 Google OAuth API 端點測試\n');
console.log('='.repeat(50));

// 檢查開發伺服器是否運行
function checkServerRunning() {
  return new Promise((resolve) => {
    const req = http.request({
      hostname: 'localhost',
      port: 3000,
      path: '/',
      method: 'GET',
      timeout: 2000
    }, (res) => {
      resolve(true);
    });

    req.on('error', () => {
      resolve(false);
    });

    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });

    req.end();
  });
}

async function testEndpoint(name, path, method = 'GET', body = null) {
  return new Promise((resolve) => {
    console.log(`\n🔍 測試: ${name}`);
    console.log(`   路徑: ${method} ${path}`);

    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 5000
    };

    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          console.log(`   狀態: ${res.statusCode}`);
          
          if (res.statusCode === 401 || res.statusCode === 400) {
            console.log(`   ✅ 端點存在且正確驗證（預期的錯誤回應）`);
            console.log(`   回應: ${json.error || json.message}`);
            resolve(true);
          } else if (res.statusCode === 200) {
            console.log(`   ✅ 端點正常回應`);
            resolve(true);
          } else {
            console.log(`   ⚠️  非預期狀態碼: ${res.statusCode}`);
            resolve(false);
          }
        } catch (error) {
          console.log(`   ❌ 無法解析 JSON 回應: ${error.message}`);
          resolve(false);
        }
      });
    });

    req.on('error', (error) => {
      console.log(`   ❌ 請求失敗: ${error.message}`);
      resolve(false);
    });

    req.on('timeout', () => {
      console.log(`   ❌ 請求逾時`);
      req.destroy();
      resolve(false);
    });

    if (body) {
      req.write(JSON.stringify(body));
    }

    req.end();
  });
}

async function runTests() {
  // 1. 檢查伺服器是否運行
  console.log('\n📡 檢查開發伺服器...');
  const isRunning = await checkServerRunning();
  
  if (!isRunning) {
    console.log('❌ 開發伺服器未運行');
    console.log('\n💡 請先執行: npm run dev\n');
    process.exit(1);
  }
  
  console.log('✅ 開發伺服器正在運行');

  // 2. 測試各個端點
  const tests = [
    {
      name: 'Google OAuth 登入 API',
      path: '/api/auth/google',
      method: 'POST',
      body: { idToken: 'test_token' } // 故意用錯誤的 token 測試驗證邏輯
    },
    {
      name: '綁定 Google 帳號 API',
      path: '/api/auth/link-google',
      method: 'POST',
      body: { idToken: 'test_token' }
    },
    {
      name: '解綁 Google 帳號 API',
      path: '/api/auth/unlink-google',
      method: 'POST'
    },
    {
      name: '取得當前用戶 API',
      path: '/api/auth/me',
      method: 'GET'
    },
  ];

  let passCount = 0;
  for (const test of tests) {
    const passed = await testEndpoint(
      test.name,
      test.path,
      test.method,
      test.body
    );
    if (passed) passCount++;
    await new Promise(resolve => setTimeout(resolve, 500)); // 延遲避免過多請求
  }

  // 3. 測試前端頁面
  console.log('\n🌐 測試前端頁面...');
  
  const pages = [
    { name: '登入頁面', path: '/login' },
    { name: '註冊頁面', path: '/register' },
    { name: '個人資料頁面', path: '/profile' },
  ];

  for (const page of pages) {
    const result = await testEndpoint(page.name, page.path, 'GET');
    if (result) passCount++;
    await new Promise(resolve => setTimeout(resolve, 300));
  }

  // 總結
  console.log('\n' + '='.repeat(50));
  console.log('\n📊 測試結果:');
  console.log('-'.repeat(50));
  console.log(`   通過: ${passCount}/${tests.length + pages.length}`);
  
  if (passCount === tests.length + pages.length) {
    console.log('\n✅ 所有 API 端點和頁面都正常運作！');
    console.log('\n🎉 您可以開始使用瀏覽器進行實際測試:');
    console.log('   1. 開啟 http://localhost:3000/login');
    console.log('   2. 點擊「使用 Google 登入」');
    console.log('   3. 選擇 Google 帳號授權');
    console.log('\n📚 完整測試指南: .cursor/ACCOUNT_LINKING_TEST.md\n');
    process.exit(0);
  } else {
    console.log('\n⚠️  部分端點可能有問題，請檢查伺服器日誌');
    console.log('\n💡 建議動作:');
    console.log('   1. 檢查終端機的錯誤訊息');
    console.log('   2. 確認所有必要的套件已安裝');
    console.log('   3. 確認環境變數已正確設定\n');
    process.exit(1);
  }
}

// 執行測試
runTests().catch(error => {
  console.error('\n❌ 測試執行失敗:', error);
  process.exit(1);
});

