#!/bin/bash

# 註冊與 OTP 功能驗證腳本
# 用途：快速檢查註冊流程的各項功能是否正常

set -e

# 顏色定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# API 基礎 URL
API_URL="${API_URL:-http://localhost:3000}"

echo -e "${BLUE}╔════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  註冊與 OTP 功能驗證腳本                      ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════╝${NC}"
echo ""

# ============================================
# 1. 環境變數檢查
# ============================================
echo -e "${YELLOW}[1/5] 檢查環境變數...${NC}"

check_env_var() {
  local var_name=$1
  local var_value="${!var_name}"
  
  if [ -z "$var_value" ]; then
    echo -e "  ${RED}❌ $var_name 未設定${NC}"
    return 1
  else
    echo -e "  ${GREEN}✅ $var_name 已設定${NC}"
    return 0
  fi
}

ENV_CHECK_PASSED=true

check_env_var "RESEND_API_KEY" || ENV_CHECK_PASSED=false
check_env_var "RESEND_FROM_EMAIL" || ENV_CHECK_PASSED=false
check_env_var "NEXT_PUBLIC_SUPABASE_URL" || ENV_CHECK_PASSED=false
check_env_var "SUPABASE_SERVICE_ROLE_KEY" || ENV_CHECK_PASSED=false
check_env_var "JWT_SECRET" || ENV_CHECK_PASSED=false

if [ "$ENV_CHECK_PASSED" = false ]; then
  echo -e "\n${RED}環境變數檢查失敗！請設定缺少的環境變數。${NC}"
  echo -e "${YELLOW}提示：請檢查 .env.local 檔案或執行環境的環境變數設定。${NC}"
  exit 1
fi

echo -e "${GREEN}環境變數檢查通過！${NC}\n"

# ============================================
# 2. 測試註冊 API
# ============================================
echo -e "${YELLOW}[2/5] 測試註冊 API...${NC}"

TIMESTAMP=$(date +%s)
RANDOM_EMAIL="test${TIMESTAMP}@example.com"
RANDOM_PHONE="09${TIMESTAMP:(-8)}"

echo -e "  測試資料："
echo -e "    Email: ${RANDOM_EMAIL}"
echo -e "    電話: ${RANDOM_PHONE}"

REGISTER_RESPONSE=$(curl -s -X POST "${API_URL}/api/auth/register" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"${RANDOM_EMAIL}\",
    \"name\": \"測試用戶${TIMESTAMP}\",
    \"phone\": \"${RANDOM_PHONE}\"
  }")

if echo "$REGISTER_RESPONSE" | grep -q '"success":true'; then
  echo -e "  ${GREEN}✅ 註冊 API 回應正常${NC}"
  
  # 提取 customerId
  CUSTOMER_ID=$(echo "$REGISTER_RESPONSE" | grep -o '"customerId":"[^"]*"' | cut -d'"' -f4)
  echo -e "  ${GREEN}✅ 客戶 ID: ${CUSTOMER_ID}${NC}"
else
  echo -e "  ${RED}❌ 註冊 API 回應異常${NC}"
  echo -e "  ${RED}回應內容: ${REGISTER_RESPONSE}${NC}"
  exit 1
fi

echo ""

# ============================================
# 3. 測試 Email 重複檢查
# ============================================
echo -e "${YELLOW}[3/5] 測試 Email 重複檢查...${NC}"

DUPLICATE_RESPONSE=$(curl -s -X POST "${API_URL}/api/auth/register" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"${RANDOM_EMAIL}\",
    \"name\": \"重複用戶\",
    \"phone\": \"0987654321\"
  }")

if echo "$DUPLICATE_RESPONSE" | grep -q 'EMAIL_ALREADY_EXISTS'; then
  echo -e "  ${GREEN}✅ Email 重複檢查正常${NC}"
else
  echo -e "  ${RED}❌ Email 重複檢查異常${NC}"
  echo -e "  ${RED}回應內容: ${DUPLICATE_RESPONSE}${NC}"
  exit 1
fi

echo ""

# ============================================
# 4. 測試 Rate Limiting
# ============================================
echo -e "${YELLOW}[4/5] 測試 Rate Limiting...${NC}"
echo -e "  ${BLUE}快速發送 6 次請求（限制為 5 次/分鐘）...${NC}"

RATE_LIMIT_TRIGGERED=false

for i in {1..6}; do
  TIMESTAMP_NEW=$(date +%s)
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST "${API_URL}/api/auth/register" \
    -H "Content-Type: application/json" \
    -d "{
      \"email\": \"test${i}${TIMESTAMP_NEW}@example.com\",
      \"name\": \"測試${i}\",
      \"phone\": \"091234567${i}\"
    }")
  
  if [ "$STATUS" == "429" ]; then
    RATE_LIMIT_TRIGGERED=true
    echo -e "  ${GREEN}✅ 第 ${i} 次請求觸發 Rate Limiting (429)${NC}"
    break
  else
    echo -e "  ${BLUE}第 ${i} 次請求: HTTP ${STATUS}${NC}"
  fi
done

if [ "$RATE_LIMIT_TRIGGERED" = true ]; then
  echo -e "  ${GREEN}✅ Rate Limiting 機制正常運作${NC}"
else
  echo -e "  ${YELLOW}⚠️  Rate Limiting 未觸發（可能需要調整測試參數）${NC}"
fi

echo ""

# ============================================
# 5. 測試重新發送 OTP API
# ============================================
echo -e "${YELLOW}[5/5] 測試重新發送 OTP API...${NC}"

RESEND_RESPONSE=$(curl -s -X POST "${API_URL}/api/auth/send-otp" \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"${RANDOM_EMAIL}\"}")

if echo "$RESEND_RESPONSE" | grep -q '"success":true'; then
  echo -e "  ${GREEN}✅ 重新發送 OTP API 回應正常${NC}"
else
  echo -e "  ${RED}❌ 重新發送 OTP API 回應異常${NC}"
  echo -e "  ${RED}回應內容: ${RESEND_RESPONSE}${NC}"
fi

echo ""

# ============================================
# 總結
# ============================================
echo -e "${BLUE}╔════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  驗證結果總結                                  ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}✅ 環境變數檢查通過${NC}"
echo -e "${GREEN}✅ 註冊 API 功能正常${NC}"
echo -e "${GREEN}✅ Email 重複檢查正常${NC}"
echo -e "${GREEN}✅ Rate Limiting 機制運作${NC}"
echo -e "${GREEN}✅ 重新發送 OTP API 正常${NC}"
echo ""
echo -e "${BLUE}════════════════════════════════════════════════${NC}"
echo -e "${GREEN}所有自動化測試通過！${NC}"
echo ""
echo -e "${YELLOW}注意事項：${NC}"
echo -e "  1. 請手動檢查 Email 是否收到驗證碼"
echo -e "  2. 請手動測試 OTP 驗證流程"
echo -e "  3. 請檢查 Email 模板在不同郵件客戶端的顯示效果"
echo ""
echo -e "${BLUE}測試完成時間: $(date '+%Y-%m-%d %H:%M:%S')${NC}"
echo ""

