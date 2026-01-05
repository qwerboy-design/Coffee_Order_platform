#!/usr/bin/env node

/**
 * DNS 記錄檢查腳本
 * 
 * 用途：檢查 Resend Email 服務所需的 DNS 記錄是否正確設定
 * 
 * 使用方法：
 *   node scripts/check-dns-records.js yourdomain.com
 */

const { spawn } = require('child_process');

// 檢查是否提供網域參數
const domain = process.argv[2];

if (!domain) {
  console.error('❌ 請提供網域名稱');
  console.error('使用方法: node scripts/check-dns-records.js yourdomain.com');
  process.exit(1);
}

console.log(`\n🔍 檢查網域: ${domain}\n`);

// 檢查 SPF 記錄
console.log('1️⃣ 檢查 SPF 記錄...');
checkDNS(domain, 'TXT', (output) => {
  if (output.includes('v=spf1') && output.includes('resend.com')) {
    console.log('   ✅ SPF 記錄已設定');
  } else {
    console.log('   ⚠️  未找到 SPF 記錄');
    console.log('   需要添加: v=spf1 include:resend.com ~all');
  }
});

// 檢查 DKIM 記錄
console.log('\n2️⃣ 檢查 DKIM 記錄...');
checkDNS(`resend._domainkey.${domain}`, 'TXT', (output) => {
  if (output.includes('k=rsa') || output.includes('p=')) {
    console.log('   ✅ DKIM 記錄已設定');
  } else {
    console.log('   ⚠️  未找到 DKIM 記錄');
    console.log('   請到 Resend Dashboard 獲取完整的 DKIM 記錄');
  }
});

// 檢查 DMARC 記錄
console.log('\n3️⃣ 檢查 DMARC 記錄...');
checkDNS(`_dmarc.${domain}`, 'TXT', (output) => {
  if (output.includes('v=DMARC1')) {
    console.log('   ✅ DMARC 記錄已設定');
  } else {
    console.log('   ⚠️  未找到 DMARC 記錄');
    console.log('   需要添加: v=DMARC1; p=none; rua=mailto:dmarc@' + domain);
  }
});

/**
 * 檢查 DNS 記錄
 */
function checkDNS(hostname, type, callback) {
  // Windows 使用 nslookup，Linux/Mac 使用 dig
  const isWindows = process.platform === 'win32';
  
  let command, args;
  
  if (isWindows) {
    command = 'nslookup';
    args = ['-type=' + type, hostname];
  } else {
    command = 'dig';
    args = ['+short', hostname, type];
  }
  
  const proc = spawn(command, args);
  let output = '';
  
  proc.stdout.on('data', (data) => {
    output += data.toString();
  });
  
  proc.stderr.on('data', (data) => {
    console.error('   ⚠️  查詢錯誤:', data.toString());
  });
  
  proc.on('close', () => {
    callback(output);
  });
  
  // 處理命令不存在的情況
  proc.on('error', (err) => {
    if (err.code === 'ENOENT') {
      console.log('   ⚠️  無法執行 DNS 查詢命令');
      console.log('   請手動使用線上工具檢查: https://mxtoolbox.com');
    }
  });
}

// 延遲執行，讓所有檢查有時間完成
setTimeout(() => {
  console.log('\n📌 建議使用線上工具進行更詳細的檢查:');
  console.log(`   - https://mxtoolbox.com/SuperTool.aspx?action=txt:${domain}`);
  console.log(`   - https://dnschecker.org/#TXT/${domain}`);
  console.log(`   - https://www.whatsmydns.net/#TXT/${domain}`);
  console.log('\n');
}, 3000);

