import React from 'react';
import { Link } from 'react-router-dom';
import { Category } from 'src/types/search';

interface CategoryCardProps {
  category: Category;
}

export const CategoryCard: React.FC<CategoryCardProps> = ({ category }) => {
  return (
    <Link
      to={`/categories/${category.id}`}
      className="block bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden"
    >
      {category.imageUrl ? (
        <div className="aspect-video">
          <img
            src={category.imageUrl}
            alt={category.name}
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        <div className="aspect-video bg-gradient-to-br from-blue-500 to-purple-500" />
      )}
      
      <div className="p-4">
        <h3 className="font-medium mb-1">{category.name}</h3>
        <p className="text-sm text-gray-600 line-clamp-2">
          {category.description}
        </p>
        <div className="mt-2 flex items-center justify-between text-sm text-gray-500">
          <span>{category.postCount} posts</span>
          <span>{category.creatorCount} creators</span>
        </div>
      </div>
    </Link>
  );
}; 