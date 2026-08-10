import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Upload, X, File, Image } from 'lucide-react';

interface FileUploadProps {
  value?: string;
  onChange: (url: string) => void;
  accept?: string;
  label: string;
  placeholder?: string;
  maxSizeMB?: number;
  fileType?: 'image' | 'pdf' | 'any';
}

interface UploadedFile {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  uploadedAt: string;
}

export function FileUpload({
  value = '',
  onChange,
  accept,
  label,
  placeholder = 'No file selected',
  maxSizeMB = 10,
  fileType = 'any'
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [error, setError] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getAcceptAttribute = () => {
    if (accept) return accept;
    switch (fileType) {
      case 'image':
        return 'image/*';
      case 'pdf':
        return 'application/pdf';
      default:
        return 'image/*,application/pdf';
    }
  };

  const validateAndUpload = async (file: File) => {
    setError('');

    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`File size must be less than ${maxSizeMB}MB`);
      return;
    }

    const allowedTypes = getAcceptAttribute().split(',').map(t => t.trim());
    const isValidType = allowedTypes.some(type => {
      if (type === 'image/*') return file.type.startsWith('image/');
      if (type === 'application/pdf') return file.type === 'application/pdf';
      return file.type === type;
    });

    if (!isValidType) {
      setError('Invalid file type');
      return;
    }

    await uploadFile(file);
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    await validateAndUpload(file);
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (!uploading) setIsDragging(true);
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    if (uploading) return;

    const file = event.dataTransfer.files?.[0];
    if (!file) return;
    await validateAndUpload(file);
  };

  const readErrorMessage = async (response: Response) => {
    const fallback = `Upload failed (${response.status})`;
    const body = await response.text().catch(() => '');
    if (!body) return fallback;
    try {
      const parsed = JSON.parse(body);
      return parsed?.message || parsed?.error || fallback;
    } catch {
      return fallback;
    }
  };

  const uploadFile = async (file: File) => {
    setUploading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(await readErrorMessage(response));
      }

      const result: UploadedFile = await response.json();
      setUploadedFile(result);
      onChange(result.url);
    } catch (err) {
      console.error('File upload failed:', err);
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    setUploadedFile(null);
    onChange('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUrlInput = (url: string) => {
    setUploadedFile(null);
    onChange(url);
  };

  const getFileIcon = () => {
    if (uploadedFile?.mimeType.startsWith('image/')) {
      return <Image className="h-4 w-4" />;
    }
    return <File className="h-4 w-4" />;
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-white mb-2">{label}</label>

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-4 transition-colors ${isDragging ? 'border-white/40' : 'border-white/20 hover:border-white/40'}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={getAcceptAttribute()}
          onChange={handleFileSelect}
          className="hidden"
          disabled={uploading}
        />

        {!uploadedFile && !value ? (
          <div className="text-center">
            <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
            <div className="text-sm text-gray-300 mb-2">
              Drop a file here or{' '}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="p-0 h-auto text-blue-400 hover:text-blue-300"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                browse
              </Button>
            </div>
            <div className="text-xs text-gray-500">
              Max {maxSizeMB}MB • {fileType === 'image' ? 'Images only' : fileType === 'pdf' ? 'PDFs only' : 'Images & PDFs'}
            </div>
          </div>
        ) : uploadedFile ? (
          <div className="flex items-center justify-between gap-2 bg-white/10 rounded-lg p-3">
            <div className="flex items-center space-x-3 min-w-0">
              <span className="shrink-0">{getFileIcon()}</span>
              <div className="min-w-0">
                <p className="text-sm font-medium text-white break-all">{uploadedFile.originalName}</p>
                <p className="text-xs text-gray-400">
                  {(uploadedFile.size / 1024).toFixed(1)} KB • Uploaded
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleRemove}
              aria-label="Remove uploaded file"
              className="text-red-400 hover:text-red-300 hover:bg-red-500/20 h-11 w-11 sm:h-9 sm:w-9 p-0 shrink-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : value ? (
          <div className="flex items-center justify-between gap-2 bg-white/10 rounded-lg p-3">
            <div className="flex items-center space-x-3 min-w-0">
              <File className="h-4 w-4 shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-white">External URL</p>
                <p className="text-xs text-gray-400 break-all">{value}</p>
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleRemove}
              aria-label="Remove file"
              className="text-red-400 hover:text-red-300 hover:bg-red-500/20 h-11 w-11 sm:h-9 sm:w-9 p-0 shrink-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : null}

        {uploading && (
          <div className="text-center">
            <div className="animate-spin h-6 w-6 border-2 border-blue-400 border-t-transparent rounded-full mx-auto mb-2"></div>
            <p className="text-sm text-gray-300">Uploading...</p>
          </div>
        )}
      </div>

      <div>
        <label className="block text-xs text-gray-400 mb-1">Or paste a URL:</label>
        <Input
          type="text"
          value={uploadedFile ? '' : value}
          onChange={(e) => handleUrlInput(e.target.value)}
          placeholder={placeholder}
          disabled={uploading || !!uploadedFile}
          className="text-sm"
        />
      </div>

      {error && (
        <p className="text-sm text-red-400">{error}</p>
      )}
    </div>
  );
}
