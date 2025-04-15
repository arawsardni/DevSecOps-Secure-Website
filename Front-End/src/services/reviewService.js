// Import required dependencies
import { API_URL } from './config';

/**
 * Get all reviews for a specific product
 * @param {string} productId - The ID of the product
 * @returns {Promise<Array>} Array of review objects
 */
export const getProductReviews = async (productId) => {
  try {
    // Convert productId to string for consistent comparison
    const targetId = String(productId);
    console.log("Fetching reviews for product ID:", targetId);

    // First try to get from backend API
    try {
      const response = await fetch(`${API_URL}/reviews/product/${targetId}/`);
      
      // Log response for debugging
      console.log(`API response status: ${response.status}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`Retrieved ${data.length} reviews from API for product ${targetId}`);
        
        // Cache reviews in localStorage
        cacheProductReviews(data, targetId);
        
        return data;
      }
      console.warn("Failed to fetch reviews from API, falling back to localStorage");
    } catch (apiError) {
      console.error("API error fetching reviews:", apiError);
    }

    // Fallback to localStorage if API fails
    return getLocalProductReviews(targetId);
  } catch (error) {
    console.error("Error in getProductReviews:", error);
    return [];
  }
};

/**
 * Get reviews from localStorage
 * @param {string} productId - The ID of the product
 * @returns {Array} Array of review objects
 */
const getLocalProductReviews = (productId) => {
  try {
    const reviewsData = localStorage.getItem("product_reviews");
    let reviews = reviewsData ? JSON.parse(reviewsData) : [];

    // Filter reviews based on productId with flexible comparison
    return reviews.filter((review) => {
      // Check direct ID
      if (String(review.productId) === productId) return true;

      // Check alternative IDs
      if (review.alternate_product_ids && Array.isArray(review.alternate_product_ids)) {
        if (review.alternate_product_ids.includes(productId)) return true;
      }

      // Check alternate_ids
      if (review.alternate_ids && Array.isArray(review.alternate_ids)) {
        if (review.alternate_ids.includes(productId)) return true;
      }

      // Check old format
      if (String(review.product_id) === productId) return true;

      return false;
    });
  } catch (error) {
    console.error("Error reading reviews from localStorage:", error);
    return [];
  }
};

/**
 * Cache product reviews in localStorage
 * @param {Array} reviews - Array of review objects 
 * @param {string} productId - The ID of the product
 */
const cacheProductReviews = (reviews, productId) => {
  try {
    // Get existing reviews
    const existingData = localStorage.getItem("product_reviews");
    let existingReviews = existingData ? JSON.parse(existingData) : [];
    
    // Remove existing reviews for this product
    existingReviews = existingReviews.filter(review => {
      return String(review.productId) !== productId && 
             String(review.product_id) !== productId;
    });
    
    // Add the new reviews with proper formatting
    const formattedReviews = reviews.map(review => ({
      ...review,
      productId: String(review.productId || review.product_id),
      createdAt: review.createdAt || review.created_at || new Date().toISOString(),
      updatedAt: review.updatedAt || review.updated_at || new Date().toISOString()
    }));
    
    // Merge and save
    const mergedReviews = [...existingReviews, ...formattedReviews];
    localStorage.setItem("product_reviews", JSON.stringify(mergedReviews));
    
    console.log(`Cached ${formattedReviews.length} reviews for product ${productId}`);
  } catch (error) {
    console.error("Error caching reviews:", error);
  }
};

/**
 * Add a product review
 * @param {Object} reviewData - The review data object
 * @returns {Promise<Object>} The created review
 */
export const addProductReview = async (reviewData) => {
  try {
    // Validate review data
    if (!reviewData.productId || !reviewData.rating) {
      throw new Error("Incomplete review data");
    }

    console.log("Adding review for product ID:", reviewData.productId);
    
    // Get authentication token
    const token = localStorage.getItem("access_token");
    if (!token) {
      throw new Error("You must be logged in to submit a review");
    }
    
    // Add user avatar if available
    try {
      const userData = JSON.parse(localStorage.getItem("user_data") || "{}");
      if (userData && userData.avatar) {
        reviewData.avatar = userData.avatar;
      }
    } catch (err) {
      console.error("Error adding avatar to review:", err);
    }

    // Try to submit to API first
    try {
      const response = await fetch(`${API_URL}/reviews/create/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          product_id: reviewData.productId,
          rating: reviewData.rating,
          comment: reviewData.comment
        })
      });

      // Log raw response for debugging
      const responseText = await response.text();
      console.log("Raw API response:", responseText);
      
      // Try to parse the response as JSON
      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch (parseError) {
        console.error("Error parsing response:", parseError);
        throw new Error("Invalid server response");
      }

      if (!response.ok) {
        throw new Error(responseData.detail || responseData.error || "Failed to submit review");
      }

      console.log("Review successfully submitted to API:", responseData);
      
      // Add to localStorage for immediate display
      addReviewToLocalStorage(responseData);
      
      return responseData;
    } catch (apiError) {
      console.error("API error submitting review:", apiError);
      
      // Fallback to localStorage only
      return addReviewToLocalStorage(reviewData);
    }
  } catch (error) {
    console.error("Error in addProductReview:", error);
    throw error;
  }
};

/**
 * Add review to localStorage
 * @param {Object} reviewData - The review data
 * @returns {Object} The stored review data
 */
const addReviewToLocalStorage = (reviewData) => {
  try {
    // Get existing reviews
    const reviewsData = localStorage.getItem("product_reviews");
    let reviews = reviewsData ? JSON.parse(reviewsData) : [];

    // Standardize productId as string
    reviewData.productId = String(reviewData.productId || reviewData.product_id);
    
    // Try to get userId from localStorage if not provided
    if (!reviewData.userId) {
      const userId = localStorage.getItem("user_id");
      if (userId) {
        reviewData.userId = userId;
      }
    }

    // Check if user has already reviewed this product
    const existingReviewIndex = reviews.findIndex(
      (review) =>
        String(review.productId) === reviewData.productId &&
        String(review.userId) === String(reviewData.userId)
    );

    const now = new Date().toISOString();
    
    // Update existing review or add new one
    if (existingReviewIndex !== -1) {
      reviews[existingReviewIndex] = {
        ...reviews[existingReviewIndex],
        ...reviewData,
        updatedAt: now
      };
    } else {
      reviews.push({
        ...reviewData,
        id: reviewData.id || Date.now().toString(),
        createdAt: reviewData.createdAt || now,
        updatedAt: now
      });
    }

    // Save back to localStorage
    localStorage.setItem("product_reviews", JSON.stringify(reviews));

    // Update product rating
    updateProductRating(reviewData.productId);

    return reviewData;
  } catch (error) {
    console.error("Error adding review to localStorage:", error);
    throw error;
  }
};

/**
 * Update product rating based on existing reviews
 * @param {string} productId - The ID of the product
 */
export const updateProductRating = (productId) => {
  try {
    const reviews = getLocalProductReviews(productId);
    
    // If no reviews, skip update
    if (reviews.length === 0) return;
    
    // Calculate average rating
    const totalRating = reviews.reduce((sum, review) => sum + Number(review.rating), 0);
    const averageRating = totalRating / reviews.length;
    
    console.log(`New rating for product ${productId}: ${averageRating.toFixed(1)} from ${reviews.length} reviews`);
    
    // Update rating in product cache
    const productsCache = JSON.parse(localStorage.getItem("products_cache") || "[]");
    const productIndex = productsCache.findIndex(p => 
      String(p.id) === productId || String(p.product_id) === productId
    );
    
    if (productIndex !== -1) {
      productsCache[productIndex].rating = averageRating;
      productsCache[productIndex].reviewCount = reviews.length;
      localStorage.setItem("products_cache", JSON.stringify(productsCache));
    }
    
    // Update current product if it matches the ID
    const currentProductId = localStorage.getItem("current_product_id");
    if (currentProductId === productId) {
      const currentProduct = JSON.parse(localStorage.getItem("current_product") || "{}");
      if (currentProduct && (String(currentProduct.id) === productId)) {
        currentProduct.rating = averageRating;
        currentProduct.reviewCount = reviews.length;
        localStorage.setItem("current_product", JSON.stringify(currentProduct));
      }
    }
  } catch (error) {
    console.error("Error updating product rating:", error);
  }
};

/**
 * Delete a product review
 * @param {string} reviewId - The ID of the review to delete
 * @returns {Promise<boolean>} Success status
 */
export const deleteReview = async (reviewId) => {
  try {
    if (!reviewId) {
      throw new Error("Review ID is required");
    }
    
    // Get authentication token
    const token = localStorage.getItem("access_token");
    if (!token) {
      throw new Error("You must be logged in to delete a review");
    }
    
    // Try to delete from API first
    try {
      const response = await fetch(`${API_URL}/reviews/${reviewId}/`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to delete review");
      }
      
      console.log("Review successfully deleted from API");
    } catch (apiError) {
      console.error("API error deleting review:", apiError);
    }
    
    // Also remove from localStorage
    const reviewsData = localStorage.getItem("product_reviews");
    if (reviewsData) {
      let reviews = JSON.parse(reviewsData);
      
      // Find the review to get its productId before removing
      const review = reviews.find(r => String(r.id) === String(reviewId));
      const productId = review ? review.productId : null;
      
      // Remove the review
      reviews = reviews.filter(r => String(r.id) !== String(reviewId));
      localStorage.setItem("product_reviews", JSON.stringify(reviews));
      
      // Update product rating if we found the productId
      if (productId) {
        updateProductRating(productId);
      }
    }
    
    return true;
  } catch (error) {
    console.error("Error in deleteReview:", error);
    throw error;
  }
};

/**
 * Update an existing review
 * @param {string} reviewId - The ID of the review to update
 * @param {Object} updateData - The new review data
 * @returns {Promise<Object>} The updated review
 */
export const updateReview = async (reviewId, updateData) => {
  try {
    if (!reviewId) {
      throw new Error("Review ID is required");
    }
    
    // Get authentication token
    const token = localStorage.getItem("access_token");
    if (!token) {
      throw new Error("You must be logged in to update a review");
    }
    
    // Try to update in API first
    try {
      const response = await fetch(`${API_URL}/reviews/${reviewId}/`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          rating: updateData.rating,
          comment: updateData.comment
        })
      });
      
      // Get the response text
      const responseText = await response.text();
      console.log("Raw API response:", responseText);
      
      // Try to parse as JSON
      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch (parseError) {
        throw new Error("Invalid server response");
      }
      
      if (!response.ok) {
        throw new Error(responseData.detail || responseData.error || "Failed to update review");
      }
      
      console.log("Review successfully updated in API:", responseData);
      
      // Update in localStorage
      updateReviewInLocalStorage(reviewId, responseData);
      
      return responseData;
    } catch (apiError) {
      console.error("API error updating review:", apiError);
      
      // Fallback to localStorage only
      return updateReviewInLocalStorage(reviewId, updateData);
    }
  } catch (error) {
    console.error("Error in updateReview:", error);
    throw error;
  }
};

/**
 * Update review in localStorage
 * @param {string} reviewId - The ID of the review
 * @param {Object} updateData - The new data
 * @returns {Object} The updated review
 */
const updateReviewInLocalStorage = (reviewId, updateData) => {
  try {
    // Get existing reviews
    const reviewsData = localStorage.getItem("product_reviews");
    if (!reviewsData) {
      throw new Error("Review not found");
    }
    
    let reviews = JSON.parse(reviewsData);
    
    // Find the review
    const reviewIndex = reviews.findIndex(r => String(r.id) === String(reviewId));
    if (reviewIndex === -1) {
      throw new Error("Review not found");
    }
    
    // Update the review
    const productId = reviews[reviewIndex].productId;
    reviews[reviewIndex] = {
      ...reviews[reviewIndex],
      ...updateData,
      updatedAt: new Date().toISOString()
    };
    
    // Save back to localStorage
    localStorage.setItem("product_reviews", JSON.stringify(reviews));
    
    // Update product rating
    updateProductRating(productId);
    
    return reviews[reviewIndex];
  } catch (error) {
    console.error("Error updating review in localStorage:", error);
    throw error;
  }
};

/**
 * Get user reviews for a specific user
 * @param {string} userId - The ID of the user
 * @returns {Promise<Array>} Array of review objects
 */
export const getUserReviews = async (userId) => {
  try {
    if (!userId) {
      throw new Error("User ID is required");
    }
    
    // Get authentication token
    const token = localStorage.getItem("access_token");
    if (!token) {
      throw new Error("You must be logged in to view your reviews");
    }
    
    // Try to get from API first
    try {
      const response = await fetch(`${API_URL}/reviews/user/${userId}/`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log(`Retrieved ${data.length} user reviews from API`);
        return data;
      }
      console.warn("Failed to fetch user reviews from API, falling back to localStorage");
    } catch (apiError) {
      console.error("API error fetching user reviews:", apiError);
    }
    
    // Fallback to localStorage
    return getUserReviewsFromLocalStorage(userId);
  } catch (error) {
    console.error("Error in getUserReviews:", error);
    return [];
  }
};

/**
 * Get user reviews from localStorage
 * @param {string} userId - The ID of the user
 * @returns {Array} Array of review objects
 */
const getUserReviewsFromLocalStorage = (userId) => {
  try {
    const reviewsData = localStorage.getItem("product_reviews");
    if (!reviewsData) return [];
    
    const reviews = JSON.parse(reviewsData);
    
    // Filter reviews by userId
    return reviews.filter(review => String(review.userId) === String(userId));
  } catch (error) {
    console.error("Error getting user reviews from localStorage:", error);
    return [];
  }
}; 