'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';

interface SearchFilters {
  type?: string;
  tags?: string[];
  sizeRange?: { min?: number; max?: number };
  dateRange?: { from?: string; to?: string };
}

interface SearchResult {
  id: string;
  originalName: string;
  mimeType: string;
  size: number;
  keywords: string[];
  description?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  fileType: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

interface SearchComponentProps {
  onResultClick?: (file: SearchResult) => void;
  className?: string;
}

export default function SearchComponent({ onResultClick, className = '' }: SearchComponentProps) {
  const { data: session } = useSession();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({});
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [pagination, setPagination] = useState({
    total: 0,
    limit: 20,
    offset: 0,
    hasMore: false
  });

  const fileTypeOptions = [
    { value: '', label: 'All Types' },
    { value: 'pdf', label: 'PDF Documents' },
    { value: 'image', label: 'Images' },
    { value: 'document', label: 'Word Documents' },
    { value: 'spreadsheet', label: 'Spreadsheets' },
    { value: 'presentation', label: 'Presentations' },
    { value: 'text', label: 'Text Files' }
  ];

  const sortOptions = [
    { value: 'createdAt', label: 'Upload Date' },
    { value: 'originalName', label: 'File Name' },
    { value: 'size', label: 'File Size' },
    { value: 'updatedAt', label: 'Last Modified' }
  ];

  const performSearch = useCallback(async (searchQuery: string, searchFilters: SearchFilters, offset = 0) => {
    if (!session?.user?.id) return;

    setIsSearching(true);
    
    try {
      const searchParams = new URLSearchParams({
        query: searchQuery,
        limit: pagination.limit.toString(),
        offset: offset.toString()
      });

      if (searchFilters.type) {
        searchParams.append('type', searchFilters.type);
      }
      
      if (searchFilters.tags && searchFilters.tags.length > 0) {
        searchParams.append('tags', searchFilters.tags.join(','));
      }

      const response = await fetch(`/api/search?${searchParams}`);
      
      if (!response.ok) {
        throw new Error('Search failed');
      }

      const data = await response.json();
      
      if (offset === 0) {
        setResults(data.results);
      } else {
        setResults(prev => [...prev, ...data.results]);
      }
      
      setPagination(data.pagination);

    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [session?.user?.id, pagination.limit]);

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      performSearch(query, filters, 0);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query, filters, performSearch]);

  const handleFilterChange = (newFilters: Partial<SearchFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const clearFilters = () => {
    setFilters({});
    setQuery('');
  };

  const loadMore = () => {
    if (pagination.hasMore && !isSearching) {
      performSearch(query, filters, pagination.offset + pagination.limit);
    }
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
      case 'pdf':
        return '📄';
      case 'image':
        return '🖼️';
      case 'document':
        return '📝';
      case 'spreadsheet':
        return '📊';
      case 'presentation':
        return '📽️';
      case 'text':
        return '📋';
      default:
        return '📎';
    }
  };

  if (!session) {
    return (
      <div className="text-center text-gray-500 p-8">
        Please sign in to search files
      </div>
    );
  }

  return (
    <div className={`max-w-6xl mx-auto p-6 ${className}`}>
      {/* Search Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Search Files</h2>
        
        {/* Search Bar */}
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by filename, description, or keywords..."
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <svg
            className="absolute left-3 top-3.5 h-5 w-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>

        {/* Filter Controls */}
        <div className="mt-4 flex flex-wrap items-center gap-4">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707v6.586a1 1 0 01-1.707.707L9 18.414V13a1 1 0 00-.293-.707L2.293 5.707A1 1 0 012 5V4z" />
            </svg>
            Filters
          </button>

          <select
            value={filters.type || ''}
            onChange={(e) => handleFilterChange({ type: e.target.value || undefined })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {fileTypeOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          {Object.keys(filters).length > 0 && (
            <button
              onClick={clearFilters}
              className="px-3 py-2 text-sm text-red-600 hover:text-red-800"
            >
              Clear Filters
            </button>
          )}

          <div className="ml-auto flex items-center gap-2 text-sm text-gray-600">
            <span>Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="border border-gray-300 rounded px-2 py-1 text-sm"
            >
              {sortOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="p-1 hover:bg-gray-100 rounded"
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </button>
          </div>
        </div>

        {/* Advanced Filters Panel */}
        {showFilters && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  File Size Range
                </label>
                <div className="flex gap-2 items-center">
                  <input
                    type="number"
                    placeholder="Min (MB)"
                    onChange={(e) => handleFilterChange({
                      sizeRange: {
                        ...filters.sizeRange,
                        min: e.target.value ? parseInt(e.target.value) * 1024 * 1024 : undefined
                      }
                    })}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm"
                  />
                  <span className="text-gray-500">to</span>
                  <input
                    type="number"
                    placeholder="Max (MB)"
                    onChange={(e) => handleFilterChange({
                      sizeRange: {
                        ...filters.sizeRange,
                        max: e.target.value ? parseInt(e.target.value) * 1024 * 1024 : undefined
                      }
                    })}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Upload Date Range
                </label>
                <div className="flex gap-2">
                  <input
                    type="date"
                    onChange={(e) => handleFilterChange({
                      dateRange: {
                        ...filters.dateRange,
                        from: e.target.value
                      }
                    })}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm"
                  />
                  <input
                    type="date"
                    onChange={(e) => handleFilterChange({
                      dateRange: {
                        ...filters.dateRange,
                        to: e.target.value
                      }
                    })}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Search Results */}
      <div className="space-y-4">
        {isSearching && results.length === 0 && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Searching...</p>
          </div>
        )}

        {!isSearching && results.length === 0 && query && (
          <div className="text-center py-8 text-gray-500">
            No files found matching your search criteria
          </div>
        )}

        {results.map((file) => (
          <div
            key={file.id}
            onClick={() => onResultClick?.(file)}
            className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3 flex-1">
                <span className="text-2xl">{getFileIcon(file.fileType)}</span>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-medium text-gray-900 truncate">
                    {file.originalName}
                  </h3>
                  {file.description && (
                    <p className="text-gray-600 text-sm mt-1 line-clamp-2">
                      {file.description}
                    </p>
                  )}
                  <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                    <span>{formatFileSize(file.size)}</span>
                    <span>{formatDate(file.createdAt)}</span>
                    <span>by {file.user.name}</span>
                  </div>
                  {file.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {file.tags.slice(0, 3).map((tag, index) => (
                        <span
                          key={index}
                          className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded"
                        >
                          {tag}
                        </span>
                      ))}
                      {file.tags.length > 3 && (
                        <span className="text-xs text-gray-500">
                          +{file.tags.length - 3} more
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <div className="ml-4 flex-shrink-0">
                <svg
                  className="w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            </div>
          </div>
        ))}

        {/* Load More Button */}
        {pagination.hasMore && (
          <div className="text-center py-4">
            <button
              onClick={loadMore}
              disabled={isSearching}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {isSearching ? 'Loading...' : 'Load More'}
            </button>
          </div>
        )}

        {/* Results Summary */}
        {results.length > 0 && (
          <div className="text-center text-sm text-gray-500 py-4">
            Showing {results.length} of {pagination.total} files
          </div>
        )}
      </div>
    </div>
  );
}