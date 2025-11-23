'use client';

import React, { useState } from 'react';
import { useSession } from 'next-auth/react';

interface FileDownloadProps {
  fileId: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  className?: string;
  showSignedUrl?: boolean;
  compact?: boolean; // New prop for compact mode
  onDownloadStart?: () => void;
  onDownloadComplete?: () => void;
  onDownloadError?: (error: string) => void;
}

export default function FileDownload({
  fileId,
  fileName,
  fileSize,
  mimeType,
  className = '',
  showSignedUrl = false,
  compact = false, // Default to false for backward compatibility
  onDownloadStart,
  onDownloadComplete,
  onDownloadError
}: FileDownloadProps) {
  const { data: session } = useSession();
  const [isDownloading, setIsDownloading] = useState(false);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [signedUrlExpiry, setSignedUrlExpiry] = useState<Date | null>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return '🖼️';
    if (mimeType === 'application/pdf') return '📄';
    if (mimeType.includes('word') || mimeType.includes('document')) return '📝';
    if (mimeType.includes('sheet') || mimeType.includes('excel')) return '📊';
    if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return '📽️';
    if (mimeType === 'text/plain') return '📋';
    return '📎';
  };

  const downloadFile = async () => {
    if (!session?.user?.id) {
      onDownloadError?.('Please sign in to download files');
      return;
    }

    setIsDownloading(true);
    onDownloadStart?.();

    try {
      // Use download=true parameter to force file download
      const response = await fetch(`/api/file?id=${fileId}&download=true`, {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Download failed: ${response.status}`);
      }

      // Get the file blob
      const blob = await response.blob();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      onDownloadComplete?.();

    } catch (error) {
      console.error('Download error:', error);
      onDownloadError?.(error instanceof Error ? error.message : 'Download failed');
    } finally {
      setIsDownloading(false);
    }
  };

  const generateSignedUrl = async () => {
    if (!session?.user?.id) {
      onDownloadError?.('Please sign in to generate download links');
      return;
    }

    try {
      const response = await fetch('/api/files/signed-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fileId }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to generate download link');
      }

      const data = await response.json();
      const fullUrl = `${window.location.origin}/api/download?token=${data.token}`;
      setSignedUrl(fullUrl);
      setSignedUrlExpiry(new Date(data.expiresAt));

    } catch (error) {
      console.error('Signed URL generation error:', error);
      onDownloadError?.(error instanceof Error ? error.message : 'Failed to generate download link');
    }
  };

  const copySignedUrl = async () => {
    if (signedUrl) {
      try {
        await navigator.clipboard.writeText(signedUrl);
        // You could add a toast notification here
      } catch (error) {
        console.error('Failed to copy URL:', error);
      }
    }
  };

  if (!session) {
    return (
      <div className="text-center text-gray-500 p-4">
        Please sign in to download files
      </div>
    );
  }

  // Compact mode for file cards
  if (compact) {
    return (
      <button
        onClick={downloadFile}
        disabled={isDownloading}
        className={`flex items-center justify-center gap-1 px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium ${className}`}
      >
        {isDownloading ? (
          <>
            <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent"></div>
            <span className="hidden sm:inline">Downloading...</span>
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="hidden sm:inline">Download</span>
          </>
        )}
      </button>
    );
  }

  // Full mode for detailed views
  return (
    <div className={`border border-gray-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-center space-x-3 mb-4">
        <span className="text-2xl">{getFileIcon(mimeType)}</span>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-medium text-gray-900 truncate">
            {fileName}
          </h3>
          <p className="text-sm text-gray-500">
            {formatFileSize(fileSize)} • {mimeType}
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {/* Direct Download Button */}
        <button
          onClick={downloadFile}
          disabled={isDownloading}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          {isDownloading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
              Downloading...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Download File
            </>
          )}
        </button>

        {/* Signed URL Section */}
        {showSignedUrl && (
          <div className="border-t pt-3">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-gray-700">Temporary Download Link</h4>
              <button
                onClick={generateSignedUrl}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Generate Link
              </button>
            </div>
            
            {signedUrl ? (
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={signedUrl}
                    readOnly
                    className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded bg-gray-50"
                  />
                  <button
                    onClick={copySignedUrl}
                    className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                  >
                    Copy
                  </button>
                </div>
                {signedUrlExpiry && (
                  <p className="text-xs text-red-600">
                    Expires: {signedUrlExpiry.toLocaleString()}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-500">
                Generate a temporary download link that expires in 1 minute
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}