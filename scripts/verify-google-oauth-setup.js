/**
 * Google OAuth 設置驗證腳本
 * 檢查所有必要的環境變數和檔案是否正確設置
 */

const fs = require('fs');
const path = require('path');

// 載入環境變數
try {
  require('dotenv').config({ path: '.env.local' });
} catch (error) {
  // dotenv 未安裝，嘗試直接讀取 .env.local
  const fs = require('fs');
  const path = require('path');
  try {
    const envPath = path.join(process.cwd(), '.env.local');
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf-8');
      envContent.split('\n').forEach(line => {
        const match = line.match(/^([^=:#]+)=(.*)$/);
        if (match) {
          const key = match[1].trim();
          const value = match[2].trim();
          process.env[key] = value;
        }
      });
    }
  } catch (readError) {
    // 無法讀取 .env.local，繼續執行檢查
  }
}

console.log('\n🔍 Google OAuth 設置驗證\n');
console.log('='.repeat(50));

let hasErrors = false;

// 1. 檢查環境變數
console.log('\n📋 檢查環境變數:');
console.log('-'.repeat(50));

const requiredEnvVars = [
  'NEXT_PUBLIC_GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
];

requiredEnvVars.forEach(varName => {
  const value = process.env[varName];
  if (!value) {
    console.log(`❌ ${varName}: 未設定`);
    hasErrors = true;
  } else {
    // 隱藏敏感資訊，只顯示前後幾個字元
    const maskedValue = value.length > 20 
      ? `${value.substring(0, 10)}...${value.substring(value.length - 10)}`
      : value.substring(0, 5) + '...';
    console.log(`✅ ${varName}: ${maskedValue}`);
  }
});

// 2. 檢查 Google Client ID 格式
if (process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID) {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  if (clientId.endsWith('.apps.googleusercontent.com')) {
    console.log('✅ Client ID 格式正確');
  } else {
    console.log('⚠️  Client ID 格式可能不正確（應該以 .apps.googleusercontent.com 結尾）');
  }
}

// 3. 檢查必要檔案
console.log('\n📁 檢查必要檔案:');
console.log('-'.repeat(50));

const requiredFiles = [
  'app/api/auth/google/route.ts',
  'app/api/auth/link-google/route.ts',
  'app/api/auth/unlink-google/route.ts',
  'app/api/auth/me/route.ts',
  'components/auth/GoogleLoginButton.tsx',
  'components/auth/LinkGoogleButton.tsx',
  'app/(customer)/profile/page.tsx',
  'supabase/migrations/005_add_oauth_id.sql',
];

requiredFiles.forEach(filePath => {
  const fullPath = path.join(process.cwd(), filePath);
  if (fs.existsSync(fullPath)) {
    console.log(`✅ ${filePath}`);
  } else {
    console.log(`❌ ${filePath}: 檔案不存在`);
    hasErrors = true;
  }
});

// 4. 檢查 package.json 依賴
console.log('\n📦 檢查套件依賴:');
console.log('-'.repeat(50));

try {
  const packageJson = JSON.parse(
    fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf-8')
  );
  
  const requiredPackages = {
    'google-auth-library': 'dependencies',
    '@supabase/supabase-js': 'dependencies',
    'jose': 'dependencies',
  };
  
  Object.entries(requiredPackages).forEach(([pkg, type]) => {
    const deps = packageJson[type] || {};
    if (deps[pkg]) {
      console.log(`✅ ${pkg}: ${deps[pkg]}`);
    } else {
      console.log(`❌ ${pkg}: 未安裝`);
      hasErrors = true;
    }
  });
} catch (error) {
  console.log(`❌ 無法讀取 package.json: ${error.message}`);
  hasErrors = true;
}

// 5. 檢查 TypeScript 類型定義
console.log('\n🔧 檢查類型定義:');
console.log('-'.repeat(50));

try {
  const customerTypes = fs.readFileSync(
    path.join(process.cwd(), 'types/customer.ts'),
    'utf-8'
  );
  
  if (customerTypes.includes('oauth_id?:')) {
    console.log('✅ Customer 類型包含 oauth_id 欄位');
  } else {
    console.log('⚠️  Customer 類型可能缺少 oauth_id 欄位');
  }
  
  if (customerTypes.includes("'google'")) {
    console.log('✅ AuthProvider 包含 google 選項');
  } else {
    console.log('⚠️  AuthProvider 可能缺少 google 選項');
  }
} catch (error) {
  console.log(`❌ 無法讀取 types/customer.ts: ${error.message}`);
}

// 6. 檢查資料庫遷移檔案內容
console.log('\n🗄️  檢查資料庫遷移:');
console.log('-'.repeat(50));

try {
  const migration = fs.readFileSync(
    path.join(process.cwd(), 'supabase/migrations/005_add_oauth_id.sql'),
    'utf-8'
  );
  
  if (migration.includes('oauth_id')) {
    console.log('✅ 遷移檔案包含 oauth_id 欄位定義');
  } else {
    console.log('❌ 遷移檔案缺少 oauth_id 欄位定義');
    hasErrors = true;
  }
  
  if (migration.includes('CREATE INDEX')) {
    console.log('✅ 遷移檔案包含索引建立');
  } else {
    console.log('⚠️  遷移檔案可能缺少索引建立');
  }
} catch (error) {
  console.log(`❌ 無法讀取遷移檔案: ${error.message}`);
}

// 總結
console.log('\n' + '='.repeat(50));
console.log('\n📊 驗證結果:');
console.log('-'.repeat(50));

if (hasErrors) {
  console.log('❌ 發現錯誤，請修正後再測試');
  console.log('\n💡 建議動作:');
  if (!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    console.log('   1. 前往 Google Cloud Console 建立 OAuth 憑證');
    console.log('   2. 更新 .env.local 檔案');
  }
  console.log('   3. 執行 npm install 安裝缺少的套件');
  console.log('   4. 在 Supabase 執行資料庫遷移');
  console.log('\n📚 詳細設定請參考: .cursor/GOOGLE_OAUTH_SETUP_GUIDE.md\n');
  process.exit(1);
} else {
  console.log('✅ 所有檢查通過！');
  console.log('\n🚀 下一步:');
  console.log('   1. 確認已在 Supabase 執行資料庫遷移');
  console.log('   2. 執行 npm run dev 啟動開發伺服器');
  console.log('   3. 開啟 http://localhost:3000/login 測試 Google 登入');
  console.log('\n📚 測試指南: .cursor/GOOGLE_OAUTH_QUICK_TEST.md\n');
  process.exit(0);
}

