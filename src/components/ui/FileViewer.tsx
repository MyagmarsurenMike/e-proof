'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import FileDownload from './FileDownload';

interface FileItem {
  id: string;
  originalName: string;
  mimeType: string;
  size: number;
  keywords: string[];
  description?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  fileType: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

interface FileViewerProps {
  file: FileItem | null;
  isOpen: boolean;
  onClose: () => void;
  onDownloadError?: (error: string) => void;
}

export default function FileViewer({ file, isOpen, onClose, onDownloadError }: FileViewerProps) {
  const { data: session } = useSession();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getFileIcon = (fileType: string) => {
    switch (fileType) {
      case 'pdf': return '📄';
      case 'image': return '🖼️';
      case 'document': return '📝';
      case 'spreadsheet': return '📊';
      case 'presentation': return '📽️';
      case 'text': return '📋';
      default: return '📎';
    }
  };

  const canPreview = (mimeType: string): boolean => {
    return (
      mimeType.startsWith('image/') ||
      mimeType === 'application/pdf' ||
      mimeType === 'text/plain' ||
      mimeType.startsWith('text/')
    );
  };

  const loadPreview = async () => {
    if (!file || !canPreview(file.mimeType)) {
      console.log('FileViewer: Cannot preview file', { 
        fileExists: !!file, 
        mimeType: file?.mimeType, 
        canPreview: file ? canPreview(file.mimeType) : false 
      });
      return;
    }

    console.log('FileViewer: Loading preview for file', { 
      id: file.id, 
      originalName: file.originalName, 
      mimeType: file.mimeType,
      size: file.size 
    });

    setPreviewLoading(true);
    setPreviewError(null);

    try {
      // Use preview=true parameter to get inline content instead of forcing download
      const apiUrl = `/api/file?id=${file.id}&preview=true`;
      console.log('FileViewer: Fetching from API URL:', apiUrl);
      
      const response = await fetch(apiUrl, {
        method: 'GET',
        credentials: 'include',
      });

      console.log('FileViewer: API response', { 
        status: response.status, 
        statusText: response.statusText,
        contentType: response.headers.get('content-type'),
        contentDisposition: response.headers.get('content-disposition')
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('FileViewer: API error response', errorText);
        throw new Error(`Preview failed: ${response.status} - ${errorText}`);
      }

      const blob = await response.blob();
      console.log('FileViewer: Blob created', { 
        size: blob.size, 
        type: blob.type 
      });
      
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
      console.log('FileViewer: Preview URL created successfully');
    } catch (error) {
      console.error('FileViewer: Preview error', error);
      setPreviewError(`Failed to load preview: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setPreviewLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && file) {
      loadPreview();
    }

    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
      }
    };
  }, [isOpen, file]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen || !file) return null;

  const renderPreview = () => {
    if (previewLoading) {
      return (
        <div className="flex items-center justify-center h-96 bg-gray-50 rounded-lg">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-gray-600">Loading preview...</p>
          </div>
        </div>
      );
    }

    if (previewError) {
      return (
        <div className="flex items-center justify-center h-96 bg-gray-50 rounded-lg">
          <div className="text-center">
            <div className="text-4xl mb-2">⚠️</div>
            <p className="text-gray-600">{previewError}</p>
            <button
              onClick={loadPreview}
              className="mt-2 px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        </div>
      );
    }

    if (!canPreview(file.mimeType)) {
      return (
        <div className="flex items-center justify-center h-96 bg-gray-50 rounded-lg">
          <div className="text-center">
            <div className="text-6xl mb-4">{getFileIcon(file.fileType)}</div>
            <p className="text-gray-600 text-lg font-medium">{file.originalName}</p>
            <p className="text-gray-500 text-sm mt-1">Preview not available for this file type</p>
            <p className="text-gray-500 text-sm">{file.mimeType}</p>
          </div>
        </div>
      );
    }

    if (!previewUrl) {
      return (
        <div className="flex items-center justify-center h-96 bg-gray-50 rounded-lg">
          <div className="text-center">
            <div className="text-4xl mb-2">📁</div>
            <p className="text-gray-600">No preview available</p>
          </div>
        </div>
      );
    }

    // Render different preview types
    if (file.mimeType.startsWith('image/')) {
      return (
        <div className="bg-gray-50 rounded-lg p-4">
          <img
            src={previewUrl}
            alt={file.originalName}
            className="max-w-full max-h-96 mx-auto rounded shadow-sm"
            style={{ objectFit: 'contain' }}
          />
        </div>
      );
    }

    if (file.mimeType === 'application/pdf') {
      return (
        <div className="bg-gray-50 rounded-lg overflow-hidden">
          <iframe
            src={previewUrl}
            className="w-full h-96"
            title={file.originalName}
          />
        </div>
      );
    }

    if (file.mimeType.startsWith('text/')) {
      return (
        <div className="bg-gray-50 rounded-lg overflow-hidden">
          <iframe
            src={previewUrl}
            className="w-full h-96 border-0"
            title={file.originalName}
          />
        </div>
      );
    }

    return (
      <div className="flex items-center justify-center h-96 bg-gray-50 rounded-lg">
        <div className="text-center">
          <div className="text-4xl mb-2">📄</div>
          <p className="text-gray-600">Preview not supported</p>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[95vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">{getFileIcon(file.fileType)}</span>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 truncate max-w-md">
                {file.originalName}
              </h2>
              <p className="text-sm text-gray-500">
                {formatFileSize(file.size)} • {file.mimeType}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-2"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
            {/* Preview */}
            <div className="lg:col-span-2">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Preview</h3>
              {renderPreview()}
            </div>

            {/* File Info & Actions */}
            <div className="space-y-6">
              {/* Download Actions */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Download</h3>
                <FileDownload
                  fileId={file.id}
                  fileName={file.originalName}
                  fileSize={file.size}
                  mimeType={file.mimeType}
                  showSignedUrl={true}
                  onDownloadError={onDownloadError}
                  className="border-0 p-0"
                />
              </div>

              {/* File Details */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Details</h3>
                <div className="space-y-3">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700">Description</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      {file.description || 'No description provided'}
                    </p>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-700">Upload Date</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      {formatDate(file.createdAt)}
                    </p>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-700">Last Modified</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      {formatDate(file.updatedAt)}
                    </p>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-700">Uploaded By</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      {file.user.name || file.user.email}
                    </p>
                  </div>
                </div>
              </div>

              {/* Tags */}
              {file.tags.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Tags</h4>
                  <div className="flex flex-wrap gap-2">
                    {file.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Keywords */}
              {file.keywords.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Keywords</h4>
                  <div className="flex flex-wrap gap-2">
                    {file.keywords.map((keyword, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded"
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-500">
              Press <kbd className="px-2 py-1 bg-gray-200 rounded text-xs">Esc</kbd> to close
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}