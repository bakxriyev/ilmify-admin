'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, Upload, Image as ImageIcon, File } from 'lucide-react';
import Image from 'next/image';

interface FileUploadProps {
  onFileChange?: (file: File | null) => void;
  value?: File | string | null;
  accept?: Record<string, string[]>;
  maxSize?: number;
  label?: string;
}

export function FileUpload({
  onFileChange,
  value,
  accept = { 'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'] },
  maxSize = 5 * 1024 * 1024, // 5MB
  label = 'Upload image',
}: FileUploadProps) {
  const [file, setFile] = useState<File | null>(typeof value === 'object' ? value : null);
  const [preview, setPreview] = useState<string | null>(
    typeof value === 'string' ? value : null
  );
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      setError(null);
      const selectedFile = acceptedFiles[0];
      if (!selectedFile) return;

      if (selectedFile.size > maxSize) {
        setError(`File size must be less than ${maxSize / 1024 / 1024}MB`);
        return;
      }

      setFile(selectedFile);
      const objectUrl = URL.createObjectURL(selectedFile);
      setPreview(objectUrl);
      onFileChange?.(selectedFile);
    },
    [maxSize, onFileChange]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    maxFiles: 1,
    multiple: false,
  });

  const removeFile = () => {
    if (preview && preview.startsWith('blob:')) {
      URL.revokeObjectURL(preview);
    }
    setFile(null);
    setPreview(null);
    setError(null);
    onFileChange?.(null);
  };

  return (
    <div className="space-y-2">
      <Card
        {...getRootProps()}
        className={`
          border-2 border-dashed transition-all duration-200 cursor-pointer
          ${isDragActive ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20' : 'border-gray-300 dark:border-gray-700'}
          ${preview ? 'p-2' : 'p-6'}
          hover:border-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800/50
        `}
      >
        <input {...getInputProps()} />
        <CardContent className="p-0">
          {preview ? (
            <div className="relative aspect-video w-full overflow-hidden rounded-md">
              <Image
                src={preview}
                alt="Preview"
                fill
                className="object-cover"
              />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 h-8 w-8"
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile();
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-2 text-center">
              <div className="rounded-full bg-gray-100 dark:bg-gray-800 p-3">
                <Upload className="h-6 w-6 text-gray-500 dark:text-gray-400" />
              </div>
              <div className="text-sm font-medium text-gray-900 dark:text-white">
                {isDragActive ? 'Drop file here' : label}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Click to browse or drag and drop
              </div>
              <div className="text-xs text-gray-400">
                Supported formats: PNG, JPG, JPEG, GIF, WEBP (max {maxSize / 1024 / 1024}MB)
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      {file && !preview?.startsWith('blob:') && (
        <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
          <File className="h-4 w-4" />
          <span className="truncate flex-1">{file.name}</span>
          <span className="text-gray-500">{(file.size / 1024).toFixed(1)} KB</span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={removeFile}
            className="h-7 w-7 p-0 text-gray-500 hover:text-red-600"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}