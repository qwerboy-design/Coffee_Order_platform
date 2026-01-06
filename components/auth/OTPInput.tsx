'use client';

import { useRef, useState, useCallback, useMemo, KeyboardEvent, ClipboardEvent, ChangeEvent } from 'react';

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
 * 優化版本：減少字串操作，使用 useCallback 和 useMemo 提升效能
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
  const focusedIndexRef = useRef<number | null>(0);

  // 將字串轉換為陣列，避免重複 split
  const valueArray = useMemo(() => {
    const arr = value.split('').slice(0, length);
    while (arr.length < length) {
      arr.push('');
    }
    return arr;
  }, [value, length]);

  // 更新值的輔助函數，使用陣列操作提升效能
  const updateValue = useCallback((newArray: string[]) => {
    const trimmed = newArray.slice(0, length).join('');
    onChange(trimmed);
  }, [onChange, length]);

  // 處理輸入變化
  const handleChange = useCallback((index: number, newValue: string) => {
    // 只允許數字
    const numericValue = newValue.replace(/[^0-9]/g, '');

    if (numericValue.length > 1) {
      // 貼上多個數字時，分散到各個輸入框
      const values = numericValue.split('').slice(0, length);
      const newValues = [...valueArray];
      
      values.forEach((val, i) => {
        if (index + i < length) {
          newValues[index + i] = val;
        }
      });

      updateValue(newValues);
      
      // 聚焦到最後一個填入的輸入框
      const nextIndex = Math.min(index + values.length, length - 1);
      setTimeout(() => {
        inputRefs.current[nextIndex]?.focus();
        focusedIndexRef.current = nextIndex;
        setFocusedIndex(nextIndex);
      }, 0);
      return;
    }

    // 單個數字輸入
    const newValues = [...valueArray];
    newValues[index] = numericValue;
    updateValue(newValues);

    // 自動跳轉到下一個輸入框
    if (numericValue && index < length - 1) {
      setTimeout(() => {
        inputRefs.current[index + 1]?.focus();
        focusedIndexRef.current = index + 1;
        setFocusedIndex(index + 1);
      }, 0);
    }
  }, [valueArray, length, updateValue]);

  // 處理鍵盤事件
  const handleKeyDown = useCallback((index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      e.preventDefault();
      
      const currentValue = valueArray[index] || '';
      
      if (currentValue) {
        // 如果當前有值，刪除當前值
        const newValues = [...valueArray];
        newValues[index] = '';
        updateValue(newValues);
      } else if (index > 0) {
        // 如果當前為空，刪除上一個並聚焦
        const newValues = [...valueArray];
        newValues[index - 1] = '';
        updateValue(newValues);
        setTimeout(() => {
          inputRefs.current[index - 1]?.focus();
          focusedIndexRef.current = index - 1;
          setFocusedIndex(index - 1);
        }, 0);
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault();
      setTimeout(() => {
        inputRefs.current[index - 1]?.focus();
        focusedIndexRef.current = index - 1;
        setFocusedIndex(index - 1);
      }, 0);
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      e.preventDefault();
      setTimeout(() => {
        inputRefs.current[index + 1]?.focus();
        focusedIndexRef.current = index + 1;
        setFocusedIndex(index + 1);
      }, 0);
    }
  }, [valueArray, length, updateValue]);

  // 處理貼上
  const handlePaste = useCallback((e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/[^0-9]/g, '');
    
    if (pastedData.length > 0) {
      const values = pastedData.split('').slice(0, length);
      const newValues = [...valueArray];
      
      values.forEach((val, i) => {
        if (i < length) {
          newValues[i] = val;
        }
      });

      updateValue(newValues);
      
      // 聚焦到最後一個填入的輸入框
      const nextIndex = Math.min(values.length - 1, length - 1);
      setTimeout(() => {
        inputRefs.current[nextIndex]?.focus();
        focusedIndexRef.current = nextIndex;
        setFocusedIndex(nextIndex);
      }, 0);
    }
  }, [valueArray, length, updateValue]);

  // 處理聚焦
  const handleFocus = useCallback((index: number) => {
    focusedIndexRef.current = index;
    setFocusedIndex(index);
    // 選中當前輸入框的內容，方便直接替換
    setTimeout(() => {
      inputRefs.current[index]?.select();
    }, 0);
  }, []);

  return (
    <div className="flex gap-2 justify-center">
      {Array.from({ length }).map((_, index) => {
        const isFocused = focusedIndex === index;
        const inputValue = valueArray[index] || '';
        
        return (
          <input
            key={index}
            ref={(el) => {
              inputRefs.current[index] = el;
            }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={inputValue}
            onChange={(e: ChangeEvent<HTMLInputElement>) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={handlePaste}
            onFocus={() => handleFocus(index)}
            disabled={disabled}
            className={`
              w-12 h-14 text-center text-2xl font-semibold
              border-2 rounded-lg
              focus:outline-none focus:ring-2 focus:ring-coffee-500
              transition-colors
              ${error 
                ? 'border-red-500 bg-red-50' 
                : isFocused
                ? 'border-coffee-500 bg-coffee-50'
                : 'border-gray-300 bg-white hover:border-gray-400'
              }
              ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-text'}
            `}
            aria-label={`驗證碼第 ${index + 1} 位數`}
          />
        );
      })}
    </div>
  );
}








