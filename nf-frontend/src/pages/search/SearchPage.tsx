import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SearchService } from 'src/services/searchService';
import { SearchFilters, SearchResults } from 'src/types/search';
import { Input } from 'src/components/common/input';
import { Button } from 'src/components/common/button';
import { CreatorCard } from 'src/components/search/CreatorCard';
import { PostCard } from 'src/components/search/PostCard';
import { CategoryCard } from 'src/components/search/CategoryCard';

export const SearchPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchResults, setSearchResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'creators' | 'posts'>('all');
  const [filters, setFilters] = useState<SearchFilters>({
    contentType: undefined,
    sortBy: 'recent',
    category: undefined,
    priceRange: undefined,
  });

  const query = searchParams.get('q') || '';

  useEffect(() => {
    if (query) {
      performSearch();
    }
  }, [query, filters, activeTab]);

  const performSearch = async () => {
    try {
      setLoading(true);
      setError(null);

      let results: SearchResults;
      if (activeTab === 'creators') {
        const creatorsResult = await SearchService.searchCreators(query, filters);
        results = {
          creators: creatorsResult,
          posts: { items: [], total: 0 },
          categories: [],
        };
      } else if (activeTab === 'posts') {
        const postsResult = await SearchService.searchPosts(query, filters);
        results = {
          creators: { items: [], total: 0 },
          posts: postsResult,
          categories: [],
        };
      } else {
        results = await SearchService.search(query, filters);
      }

      setSearchResults(results);
    } catch (err) {
      setError('Failed to perform search. Please try again.');
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const searchQuery = formData.get('search') as string;
    
    if (searchQuery.trim()) {
      setSearchParams({ q: searchQuery.trim() });
    }
  };

  const handleFilterChange = (newFilters: Partial<SearchFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Search Form */}
      <form onSubmit={handleSearch} className="mb-8">
        <div className="flex gap-4">
          <Input
            type="search"
            name="search"
            placeholder="Search creators, posts, or categories..."
            defaultValue={query}
            className="flex-1"
          />
          <Button type="submit" variant="primary">
            Search
          </Button>
        </div>
      </form>

      {/* Filters */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <select
            value={filters.contentType}
            onChange={(e) => handleFilterChange({ contentType: e.target.value as 'image' | 'video' | 'text' || undefined })}
            className="border rounded-lg px-3 py-2"
          >
            <option value="">All Content Types</option>
            <option value="image">Images</option>
            <option value="video">Videos</option>
            <option value="text">Text</option>
          </select>

          <select
            value={filters.sortBy}
            onChange={(e) => handleFilterChange({ sortBy: e.target.value as 'recent' | 'popular' | 'trending' })}
            className="border rounded-lg px-3 py-2"
          >
            <option value="recent">Most Recent</option>
            <option value="popular">Most Popular</option>
            <option value="trending">Trending</option>
          </select>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b mb-8">
        <nav className="flex gap-8">
          <button
            className={`pb-4 px-1 ${
              activeTab === 'all'
                ? 'border-b-2 border-blue-500 text-blue-500'
                : 'text-gray-500'
            }`}
            onClick={() => setActiveTab('all')}
          >
            All Results
          </button>
          <button
            className={`pb-4 px-1 ${
              activeTab === 'creators'
                ? 'border-b-2 border-blue-500 text-blue-500'
                : 'text-gray-500'
            }`}
            onClick={() => setActiveTab('creators')}
          >
            Creators
          </button>
          <button
            className={`pb-4 px-1 ${
              activeTab === 'posts'
                ? 'border-b-2 border-blue-500 text-blue-500'
                : 'text-gray-500'
            }`}
            onClick={() => setActiveTab('posts')}
          >
            Posts
          </button>
        </nav>
      </div>

      {/* Results */}
      {loading ? (
        <div className="text-center text-gray-500">Loading results...</div>
      ) : error ? (
        <div className="text-center text-red-500">{error}</div>
      ) : searchResults ? (
        <div className="space-y-8">
          {/* Categories (only in 'all' tab) */}
          {activeTab === 'all' && searchResults.categories.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Categories</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {searchResults.categories.map((category) => (
                  <CategoryCard key={category.id} category={category} />
                ))}
              </div>
            </div>
          )}

          {/* Creators */}
          {(activeTab === 'all' || activeTab === 'creators') && searchResults.creators.items.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Creators</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {searchResults.creators.items.map((creator) => (
                  <CreatorCard key={creator.id} creator={creator} />
                ))}
              </div>
            </div>
          )}

          {/* Posts */}
          {(activeTab === 'all' || activeTab === 'posts') && searchResults.posts.items.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Posts</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {searchResults.posts.items.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>
            </div>
          )}

          {/* No Results */}
          {!searchResults.categories.length &&
            !searchResults.creators.items.length &&
            !searchResults.posts.items.length && (
            <div className="text-center text-gray-500">
              No results found for "{query}"
            </div>
          )}
        </div>
      ) : (
        <div className="text-center text-gray-500">
          Enter a search term to find creators, posts, and more
        </div>
      )}
    </div>
  );
}; 