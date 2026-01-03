'use client';

import { useRef, useState, KeyboardEvent, ClipboardEvent, ChangeEvent } from 'react';

interface OTPInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  error?: boolean;
}

/**
 * OTP 輸入元件
 * 6 個分離的輸入框，支援自動跳轉、貼上、鍵盤導航
 */
export function OTPInput({
  length = 6,
  value,
  onChange,
  disabled = false,
  error = false,
}: OTPInputProps) {
  const [focusedIndex, setFocusedIndex] = useState<number | null>(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // 處理輸入變化
  const handleChange = (index: number, newValue: string) => {
    // 只允許數字
    const numericValue = newValue.replace(/[^0-9]/g, '');

    if (numericValue.length > 1) {
      // 貼上多個數字時，分散到各個輸入框
      const values = numericValue.split('').slice(0, length);
      const newValues = [...value.split('')];
      
      values.forEach((val, i) => {
        if (index + i < length) {
          newValues[index + i] = val;
        }
      });

      onChange(newValues.join('').padEnd(length, ' ').slice(0, length));
      
      // 聚焦到最後一個填入的輸入框
      const nextIndex = Math.min(index + values.length, length - 1);
      inputRefs.current[nextIndex]?.focus();
      setFocusedIndex(nextIndex);
      return;
    }

    // 單個數字輸入
    const newValues = value.split('').slice(0, length);
    newValues[index] = numericValue;
    onChange(newValues.join('').padEnd(length, ' ').slice(0, length));

    // 自動跳轉到下一個輸入框
    if (numericValue && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
      setFocusedIndex(index + 1);
    }
  };

  // 處理鍵盤事件
  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      e.preventDefault();
      
      const currentValue = value[index] || '';
      
      if (currentValue) {
        // 如果當前有值，刪除當前值
        const newValues = value.split('');
        newValues[index] = '';
        onChange(newValues.join('').padEnd(length, ' ').slice(0, length));
      } else if (index > 0) {
        // 如果當前為空，刪除上一個並聚焦
        const newValues = value.split('');
        newValues[index - 1] = '';
        onChange(newValues.join('').padEnd(length, ' ').slice(0, length));
        inputRefs.current[index - 1]?.focus();
        setFocusedIndex(index - 1);
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault();
      inputRefs.current[index - 1]?.focus();
      setFocusedIndex(index - 1);
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      e.preventDefault();
      inputRefs.current[index + 1]?.focus();
      setFocusedIndex(index + 1);
    }
  };

  // 處理貼上
  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/[^0-9]/g, '');
    
    if (pastedData.length > 0) {
      const values = pastedData.split('').slice(0, length);
      const newValues = [...value.split('').slice(0, length)];
      
      values.forEach((val, i) => {
        if (i < length) {
          newValues[i] = val;
        }
      });

      onChange(newValues.join('').padEnd(length, ' ').slice(0, length));
      
      // 聚焦到最後一個填入的輸入框
      const nextIndex = Math.min(values.length - 1, length - 1);
      inputRefs.current[nextIndex]?.focus();
      setFocusedIndex(nextIndex);
    }
  };

  // 處理聚焦
  const handleFocus = (index: number) => {
    setFocusedIndex(index);
    // 選中當前輸入框的內容，方便直接替換
    inputRefs.current[index]?.select();
  };

  return (
    <div className="flex gap-2 justify-center">
      {Array.from({ length }).map((_, index) => (
        <input
          key={index}
          ref={(el) => {
            inputRefs.current[index] = el;
          }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={value[index] || ''}
          onChange={(e: ChangeEvent<HTMLInputElement>) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          onFocus={() => handleFocus(index)}
          disabled={disabled}
          className={`
            w-12 h-14 text-center text-2xl font-semibold
            border-2 rounded-lg
            focus:outline-none focus:ring-2 focus:ring-amber-500
            transition-colors
            ${error 
              ? 'border-red-500 bg-red-50' 
              : focusedIndex === index
              ? 'border-amber-500 bg-amber-50'
              : 'border-gray-300 bg-white hover:border-gray-400'
            }
            ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-text'}
          `}
          aria-label={`驗證碼第 ${index + 1} 位數`}
        />
      ))}
    </div>
  );
}



