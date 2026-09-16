import React from 'react';

export default function StarRating({ rating = 0, size = 'md', interactive = false, onChange }) {
  const sizes = { xs: 'text-xs', sm: 'text-sm', md: 'text-base', lg: 'text-xl', xl: 'text-2xl' };
  return (
    <div className={`flex items-center gap-0.5 ${sizes[size]}`}>
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          type="button"
          disabled={!interactive}
          onClick={() => interactive && onChange?.(star)}
          className={`transition-all duration-100 ${interactive ? 'cursor-pointer hover:scale-125' : 'cursor-default'} ${
            star <= Math.round(rating) ? 'text-amber-400' : 'text-slate-200'
          }`}>
          ★
        </button>
      ))}
    </div>
  );
}
