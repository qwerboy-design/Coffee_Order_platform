export function formatPhone(phone: string): string {
  // 移除所有非數字字元
  const cleaned = phone.replace(/\D/g, '');
  
  // 台灣手機號碼格式 (09XX-XXX-XXX)
  if (cleaned.length === 10 && cleaned.startsWith('09')) {
    return `${cleaned.slice(0, 4)}-${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  }
  
  // 其他格式保持原樣
  return phone;
}

export function formatPickupMethod(method: string): string {
  const map: Record<string, string> = {
    self_pickup: '自取',
    delivery: '外送',
  };
  return map[method] || method;
}

export function formatPaymentMethod(method: string): string {
  const map: Record<string, string> = {
    cash: '現金',
    transfer: '轉帳',
    credit_card: '信用卡',
  };
  return map[method] || method;
}

export function formatOrderStatus(status: string): string {
  const map: Record<string, string> = {
    pending: '待處理',
    processing: '製作中',
    completed: '已完成',
    picked_up: '已取貨',
    cancelled: '已取消',
  };
  return map[status] || status;
}

export function formatGrindOption(option: string): string {
  const map: Record<string, string> = {
    none: '不磨',
    hand_drip: '磨手沖',
    espresso: '磨義式',
  };
  return map[option] || option;
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('zh-TW', {
    style: 'currency',
    currency: 'TWD',
    minimumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(dateString: string | undefined): string {
  if (!dateString) return '';
  return new Date(dateString).toLocaleString('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

