import React from "react";

const ReviewCard = ({ name, rating, title, reviewText, additionalText }) => {
  return (
    <article className="p-4 border rounded-lg shadow-sm dark:border-gray-700 max-w-[350px]" style={{ backgroundColor: "#F2EAE6" }}>
      <div className="flex items-center mb-4">
        <img className="w-10 h-10 me-4 rounded-full" src="/docs/images/people/profile-picture-5.jpg" alt="" />
        <div className="font-medium text-gray-900">
          <p>{name}</p>
        </div>
      </div>
      <div className="mb-3"> {/* Spacing tambahan */}
        <div className="flex items-center space-x-1 rtl:space-x-reverse mb-2"> {/* Tambahin margin bottom di sini */}
          {[...Array(5)].map((_, i) => (
            <svg key={i} className={`w-4 h-4 ${i < rating ? 'text-yellow-300' : 'text-gray-300'}`} aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 22 20">
              <path d="M20.924 7.625a1.523 1.523 0 0 0-1.238-1.044l-5.051-.734-2.259-4.577a1.534 1.534 0 0 0-2.752 0L7.365 5.847l-5.051.734A1.535 1.535 0 0 0 1.463 9.2l3.656 3.563-.863 5.031a1.532 1.532 0 0 0 2.226 1.616L11 17.033l4.518 2.375a1.534 1.534 0 0 0 2.226-1.617l-.863-5.03L20.537 9.2a1.523 1.523 0 0 0 .387-1.575Z" />
            </svg>
          ))}
        </div>
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
      </div>
      <p className="mt-3 mb-2 text-gray-700">{reviewText}</p> {/* Spacing di atas reviewText */}
      {additionalText && <p className="mb-3 text-gray-700">{additionalText}</p>}
    </article>
  );
};

export default ReviewCard;
