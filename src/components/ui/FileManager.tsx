'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import UploadComponent from './UploadComponent';
import SearchComponent from './SearchComponent';
import FileDownload from './FileDownload';
import FileViewer from './FileViewer';

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

interface FileManagerProps {
  className?: string;
}

export default function FileManager({ className = '' }: FileManagerProps) {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<'upload' | 'search' | 'my-files' | 'deleted'>('upload');
  const [myFiles, setMyFiles] = useState<FileItem[]>([]);
  const [deletedFiles, setDeletedFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Load user's files
  const loadMyFiles = async () => {
    if (!session?.user?.id) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/search?query=&limit=100');
      if (response.ok) {
        const data = await response.json();
        setMyFiles(data.results);
      }
    } catch (error) {
      console.error('Error loading files:', error);
      showNotification('error', 'Failed to load files');
    } finally {
      setLoading(false);
    }
  };

  // Load deleted files
  const loadDeletedFiles = async () => {
    if (!session?.user?.id) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/files/deleted');
      if (response.ok) {
        const data = await response.json();
        setDeletedFiles(data.files);
      }
    } catch (error) {
      console.error('Error loading deleted files:', error);
      showNotification('error', 'Failed to load deleted files');
    } finally {
      setLoading(false);
    }
  };

  // Soft delete file
  const softDeleteFile = async (fileId: string) => {
    try {
      const response = await fetch(`/api/files/${fileId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        showNotification('success', 'File moved to trash');
        loadMyFiles();
      } else {
        throw new Error('Failed to delete file');
      }
    } catch (error) {
      console.error('Error deleting file:', error);
      showNotification('error', 'Failed to delete file');
    }
  };

  // Restore file
  const restoreFile = async (fileId: string) => {
    try {
      const response = await fetch(`/api/files/${fileId}/restore`, {
        method: 'POST',
      });
      
      if (response.ok) {
        showNotification('success', 'File restored successfully');
        loadDeletedFiles();
        loadMyFiles();
      } else {
        throw new Error('Failed to restore file');
      }
    } catch (error) {
      console.error('Error restoring file:', error);
      showNotification('error', 'Failed to restore file');
    }
  };

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

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
      month: 'short',
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

  const openFileViewer = (file: FileItem) => {
    setSelectedFile(file);
    setViewerOpen(true);
  };

  const closeFileViewer = () => {
    setViewerOpen(false);
    setSelectedFile(null);
  };

  useEffect(() => {
    if (activeTab === 'my-files') {
      loadMyFiles();
    } else if (activeTab === 'deleted') {
      loadDeletedFiles();
    }
  }, [activeTab, session]);

  if (!session) {
    return (
      <div className="text-center text-gray-500 p-8">
        Please sign in to manage files
      </div>
    );
  }

  return (
    <div className={`max-w-7xl mx-auto p-6 ${className}`}>
      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg ${
          notification.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
        }`}>
          {notification.message}
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">File Manager</h1>
        <p className="text-gray-600">
          Securely upload, search, and manage your documents
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8">
          {[
            { id: 'upload', label: 'Upload', icon: '⬆️' },
            { id: 'search', label: 'Search', icon: '🔍' },
            { id: 'my-files', label: 'My Files', icon: '📂' },
            { id: 'deleted', label: 'Trash', icon: '🗑️' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="min-h-[600px]">
        {activeTab === 'upload' && (
          <UploadComponent
            onUploadSuccess={(file) => {
              showNotification('success', `File "${file.originalName}" uploaded successfully`);
              loadMyFiles();
            }}
            onUploadError={(error) => showNotification('error', error)}
          />
        )}

        {activeTab === 'search' && (
          <SearchComponent
            onResultClick={(file) => openFileViewer(file)}
          />
        )}

        {activeTab === 'my-files' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">My Files</h2>
              <button
                onClick={loadMyFiles}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                )}
                Refresh
              </button>
            </div>

            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading files...</p>
              </div>
            ) : myFiles.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No files found. Upload your first file to get started.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {myFiles.map((file) => (
                  <div key={file.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <span className="text-xl">{getFileIcon(file.fileType)}</span>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-gray-900 truncate text-sm">
                            {file.originalName}
                          </h3>
                          <p className="text-xs text-gray-500">
                            {formatFileSize(file.size)}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => softDeleteFile(file.id)}
                        className="text-gray-400 hover:text-red-500 p-1"
                        title="Delete file"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>

                    {file.description && (
                      <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                        {file.description}
                      </p>
                    )}

                    <div className="text-xs text-gray-500 mb-3">
                      Uploaded {formatDate(file.createdAt)}
                    </div>

                    {file.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {file.tags.slice(0, 2).map((tag, index) => (
                          <span
                            key={index}
                            className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded"
                          >
                            {tag}
                          </span>
                        ))}
                        {file.tags.length > 2 && (
                          <span className="text-xs text-gray-500">
                            +{file.tags.length - 2}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Enhanced Action Buttons */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => openFileViewer(file)}
                        className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        View
                      </button>
                      <FileDownload
                        fileId={file.id}
                        fileName={file.originalName}
                        fileSize={file.size}
                        mimeType={file.mimeType}
                        compact={true}
                        showSignedUrl={false}
                        onDownloadError={(error) => showNotification('error', error)}
                        className="flex-1"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'deleted' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Deleted Files</h2>
              <button
                onClick={loadDeletedFiles}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                )}
                Refresh
              </button>
            </div>

            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading deleted files...</p>
              </div>
            ) : deletedFiles.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No deleted files found.
              </div>
            ) : (
              <div className="space-y-4">
                {deletedFiles.map((file) => (
                  <div key={file.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className="text-xl opacity-50">{getFileIcon(file.fileType)}</span>
                        <div>
                          <h3 className="font-medium text-gray-900">
                            {file.originalName}
                          </h3>
                          <div className="text-sm text-gray-500">
                            {formatFileSize(file.size)} • Deleted {formatDate(file.deletedAt!)}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => restoreFile(file.id)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Restore
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* File Viewer Modal */}
      <FileViewer
        file={selectedFile}
        isOpen={viewerOpen}
        onClose={closeFileViewer}
        onDownloadError={(error) => showNotification('error', error)}
      />
    </div>
  );
}