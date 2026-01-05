'use client';

import { useState, useEffect } from 'react';

interface CountdownTimerProps {
  initialSeconds?: number;
  onComplete?: () => void;
  onResend?: () => Promise<void>;
  resendLabel?: string;
}

/**
 * 倒數計時器元件
 * 顯示倒數時間，結束後顯示重新發送按鈕
 */
export function CountdownTimer({
  initialSeconds = 120,
  onComplete,
  onResend,
  resendLabel = '重新發送驗證碼',
}: CountdownTimerProps) {
  const [seconds, setSeconds] = useState(initialSeconds);
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    if (seconds <= 0) {
      onComplete?.();
      return;
    }

    const timer = setTimeout(() => {
      setSeconds(seconds - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [seconds, onComplete]);

  const handleResend = async () => {
    if (!onResend || isResending) return;

    setIsResending(true);
    try {
      await onResend();
      setSeconds(initialSeconds); // 重置倒數
    } catch (error) {
      console.error('Error resending:', error);
    } finally {
      setIsResending(false);
    }
  };

  const formatTime = (totalSeconds: number): string => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (seconds > 0) {
    return (
      <div className="text-center text-sm text-gray-600">
        {resendLabel} ({formatTime(seconds)})
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={handleResend}
      disabled={isResending || !onResend}
      className={`
        text-center text-sm font-medium
        text-amber-600 hover:text-amber-700
        disabled:text-gray-400 disabled:cursor-not-allowed
        transition-colors
      `}
    >
      {isResending ? '發送中...' : resendLabel}
    </button>
  );
}





