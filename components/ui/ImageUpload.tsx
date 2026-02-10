'use client';

import { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import Image from 'next/image';
import { uploadImage } from '@/app/actions/upload';
import { useToast } from '@/components/ui/Toaster';

interface ImageUploadProps {
    value: string[];
    onChange: (value: string[]) => void;
    disabled?: boolean;
    maxFiles?: number;
}

export default function ImageUpload({
    value = [],
    onChange,
    disabled,
    maxFiles = 5
}: ImageUploadProps) {
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { error } = useToast();

    const handleUpload = async (file: File) => {
        if (!file) return;

        // Check if max files reached
        if (value.length >= maxFiles) {
            error(`最多只能上傳 ${maxFiles} 張圖片`);
            return;
        }

        setIsUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const result = await uploadImage(formData);

            if (result.success && result.url) {
                onChange([...value, result.url]);
            } else {
                error(result.error || '上传失败');
            }
        } catch (err) {
            error('發生未知錯誤');
            console.error(err);
        } finally {
            setIsUploading(false);
        }
    };

    const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            // Handle multiple files if implemented, currently one by one or loop
            Array.from(files).forEach((file) => handleUpload(file));
            // Reset input
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const removeImage = (urlToRemove: string) => {
        onChange(value.filter((url) => url !== urlToRemove));
    };

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                {value.map((url) => (
                    <div key={url} className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 group">
                        <div className="absolute top-2 right-2 z-10">
                            <button
                                type="button"
                                onClick={() => removeImage(url)}
                                className="bg-red-500 text-white p-1 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                                disabled={disabled}
                            >
                                <X size={16} />
                            </button>
                        </div>
                        <Image
                            fill
                            className="object-cover"
                            alt="Uploaded image"
                            src={url}
                        />
                    </div>
                ))}
            </div>

            <div className="flex items-center justify-center w-full">
                <label
                    className={`
            flex flex-col items-center justify-center w-full h-32 
            border-2 border-dashed rounded-lg cursor-pointer 
            ${disabled || isUploading ? 'bg-gray-100 cursor-not-allowed' : 'bg-gray-50 hover:bg-gray-100 border-gray-300 hover:border-gray-400'}
            transition-colors
          `}
                >
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        {isUploading ? (
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mb-2"></div>
                        ) : (
                            <Upload className="w-8 h-8 mb-3 text-gray-500" />
                        )}
                        <p className="mb-2 text-sm text-gray-500">
                            <span className="font-semibold">點擊上傳</span> 或拖放圖片
                        </p>
                        <p className="text-xs text-gray-500">
                            支援 PNG, JPG, GIF (最大 5MB)
                        </p>
                    </div>
                    <input
                        ref={fileInputRef}
                        type="file"
                        className="hidden"
                        accept="image/*"
                        multiple
                        onChange={onFileChange}
                        disabled={disabled || isUploading}
                    />
                </label>
            </div>
            <div className="text-xs text-gray-400">
                已上傳 {value.length} / {maxFiles} 張圖片
            </div>
        </div>
    );
}
