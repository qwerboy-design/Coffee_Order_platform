/**
 * 環境變數檢查腳本
 * 檢查遷移所需的所有環境變數是否已設定
 */

// 載入環境變數
import { config as loadEnv } from 'dotenv';
import { resolve } from 'path';

// 嘗試載入 .env.local
const envPath = resolve(process.cwd(), '.env.local');
loadEnv({ path: envPath });

console.log('\n╔═══════════════════════════════════════════════════════╗');
console.log('║                                                       ║');
console.log('║           環境變數檢查工具                           ║');
console.log('║                                                       ║');
console.log('╚═══════════════════════════════════════════════════════╝\n');

interface EnvCheck {
  name: string;
  required: boolean;
  description: string;
  example?: string;
}

const envVars: EnvCheck[] = [
  {
    name: 'AIRTABLE_API_KEY',
    required: true,
    description: 'Airtable API Key',
    example: 'patXXXXXXXXXXXXXX'
  },
  {
    name: 'AIRTABLE_BASE_ID',
    required: true,
    description: 'Airtable Base ID',
    example: 'appXXXXXXXXXXXXXX'
  },
  {
    name: 'NEXT_PUBLIC_SUPABASE_URL',
    required: true,
    description: 'Supabase Project URL',
    example: 'https://xxxxx.supabase.co'
  },
  {
    name: 'SUPABASE_SERVICE_ROLE_KEY',
    required: true,
    description: 'Supabase Service Role Key (用於繞過 RLS)',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
  },
  {
    name: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    required: false,
    description: 'Supabase Anon Key (遷移不需要，但應用程式需要)',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
  },
  {
    name: 'MIGRATION_DRY_RUN',
    required: false,
    description: '是否為 Dry Run 模式 (建議先設為 true 測試)',
    example: 'true'
  },
  {
    name: 'MIGRATION_VERBOSE',
    required: false,
    description: '是否顯示詳細日誌',
    example: 'true'
  },
  {
    name: 'MIGRATION_CONTINUE_ON_ERROR',
    required: false,
    description: '遇到錯誤時是否繼續執行',
    example: 'false'
  }
];

let allPassed = true;
let missingRequired: string[] = [];

console.log('📋 檢查環境變數...\n');

envVars.forEach(envVar => {
  const value = process.env[envVar.name];
  const isSet = value !== undefined && value !== '';
  
  if (envVar.required) {
    if (isSet) {
      // 顯示部分內容 (隱藏敏感資訊)
      let displayValue = value;
      if (value.length > 20) {
        displayValue = value.substring(0, 15) + '...' + value.substring(value.length - 5);
      }
      
      console.log(`✅ ${envVar.name}`);
      console.log(`   ${envVar.description}`);
      console.log(`   值: ${displayValue}`);
    } else {
      console.log(`❌ ${envVar.name}`);
      console.log(`   ${envVar.description}`);
      console.log(`   ⚠️  未設定 (必填)`);
      console.log(`   範例: ${envVar.example}`);
      allPassed = false;
      missingRequired.push(envVar.name);
    }
  } else {
    if (isSet) {
      console.log(`✅ ${envVar.name}`);
      console.log(`   ${envVar.description}`);
      console.log(`   值: ${value}`);
    } else {
      console.log(`ℹ️  ${envVar.name}`);
      console.log(`   ${envVar.description}`);
      console.log(`   未設定 (可選)`);
      if (envVar.example) {
        console.log(`   建議值: ${envVar.example}`);
      }
    }
  }
  
  console.log('');
});

console.log('═'.repeat(60));

if (allPassed) {
  console.log('✅ 所有必要的環境變數都已設定！');
  console.log('');
  console.log('📝 下一步:');
  console.log('   1. 確認 Supabase Schema 已建立');
  console.log('   2. 執行 Dry Run 測試:');
  console.log('      MIGRATION_DRY_RUN=true npm run migrate:all');
  console.log('');
} else {
  console.log('❌ 缺少必要的環境變數！');
  console.log('');
  console.log('請在 .env.local 中設定以下變數:');
  missingRequired.forEach(varName => {
    const envVar = envVars.find(e => e.name === varName);
    console.log(`   ${varName}=${envVar?.example || 'your_value_here'}`);
  });
  console.log('');
  console.log('📖 參考文件:');
  console.log('   - scripts/migration/QUICKSTART.md (步驟 2)');
  console.log('   - scripts/migration/.env.example');
  console.log('');
}

console.log('═'.repeat(60));
console.log('');

// 如果有設定 Supabase URL，嘗試測試連線
if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.log('🔗 測試 Supabase 連線...\n');
  
  import('@supabase/supabase-js').then(({ createClient }) => {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    // 測試連線
    supabase
      .from('products')
      .select('count', { count: 'exact', head: true })
      .then(({ error, count }) => {
        if (error) {
          console.log('❌ Supabase 連線失敗:');
          console.log(`   ${error.message}`);
          
          if (error.message.includes('relation') || error.message.includes('does not exist')) {
            console.log('');
            console.log('💡 看起來 Supabase Schema 尚未建立');
            console.log('   請參考 SUPABASE_MIGRATION_PLAN.md 建立資料表');
          }
        } else {
          console.log('✅ Supabase 連線成功！');
          console.log(`   products 表目前有 ${count || 0} 筆資料`);
        }
        console.log('');
      })
      .catch(err => {
        console.log('❌ 連線測試失敗:', err.message);
        console.log('');
      });
  }).catch(() => {
    console.log('⚠️  無法載入 @supabase/supabase-js');
    console.log('   請執行: npm install @supabase/supabase-js');
    console.log('');
  });
}

// 如果有設定 Airtable，嘗試測試連線
if (process.env.AIRTABLE_API_KEY && process.env.AIRTABLE_BASE_ID) {
  console.log('🔗 測試 Airtable 連線...\n');
  
  import('airtable').then((Airtable) => {
    const base = new (Airtable.default || Airtable)({
      apiKey: process.env.AIRTABLE_API_KEY
    }).base(process.env.AIRTABLE_BASE_ID!);
    
    // 測試連線
    base('Products')
      .select({ maxRecords: 1 })
      .firstPage()
      .then(records => {
        console.log('✅ Airtable 連線成功！');
        console.log(`   Products 表可存取`);
        console.log('');
      })
      .catch(error => {
        console.log('❌ Airtable 連線失敗:');
        console.log(`   ${error.message}`);
        console.log('');
        console.log('💡 請檢查:');
        console.log('   - API Key 是否正確');
        console.log('   - Base ID 是否正確');
        console.log('   - API Key 是否有該 Base 的存取權限');
        console.log('');
      });
  }).catch(() => {
    console.log('⚠️  無法載入 airtable');
    console.log('   Airtable SDK 應該已安裝在專案中');
    console.log('');
  });
}

process.exit(allPassed ? 0 : 1);
