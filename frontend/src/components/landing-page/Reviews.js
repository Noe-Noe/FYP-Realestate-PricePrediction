import React, { useState } from 'react';
import './Reviews.css';

const reviewData = [
  {
    title: "Great Work",
    content: "At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti quos dolores et",
    rating: 5,
    authorName: "Ali Tufan",
    authorRole: "Marketing",
    authorAvatar: "http://localhost:3845/assets/4a83463f86943e4fcc7c74f4a4febc6f6fd99c9a.png"
  },
  {
    title: "Good Job",
    content: "Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae",
    rating: 5,
    authorName: "Albert Flores",
    authorRole: "Designer",
    authorAvatar: "http://localhost:3845/assets/017a767355d8d67fa820da7ca4561b4521c3f5b4.png"
  },
  {
    title: "Perfect",
    content: "Et harum quidem rerum facilis est et expedita distinctio. Nam libero tempore, cum soluta nobis est eligendi optio cumque nihil impedit quo",
    rating: 5,
    authorName: "Robert Fox",
    authorRole: "Developer",
    authorAvatar: "http://localhost:3845/assets/266297be51b3ecedf025685d898baa685c8323af.png"
  },
  {
    title: "Work Hard",
    content: "At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti quos dolores et",
    rating: 5,
    authorName: "Marvin McKinney",
    authorRole: "Marketing",
    authorAvatar: "http://localhost:3845/assets/ac8bb0715677137e2427c1329ff78b874a85ea6a.png"
  },
  // New reviews
  {
    title: "Amazing Service",
    content: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Fusce tincidunt justo eget ultricies fringilla.",
    rating: 5,
    authorName: "Diana Prince",
    authorRole: "Project Manager",
    authorAvatar: "http://localhost:3845/assets/diana-prince.png"
  },
  {
    title: "Highly Recommend",
    content: "Curabitur non nulla sit amet nisl tempus convallis quis ac lectus. Vivamus suscipit tortor eget felis porttitor volutpat.",
    rating: 5,
    authorName: "Bruce Wayne",
    authorRole: "CEO",
    authorAvatar: "http://localhost:3845/assets/bruce-wayne.png"
  },
  {
    title: "Excellent Support",
    content: "Pellentesque in ipsum id orci porta dapibus. Praesent sapien massa, convallis a pellentesque nec, egestas non nisi.",
    rating: 5,
    authorName: "Clark Kent",
    authorRole: "Reporter",
    authorAvatar: "http://localhost:3845/assets/clark-kent.png"
  }];

  const Reviews = () => {
    const reviewsPerPage = 3;
    const totalPages = Math.ceil(reviewData.length / reviewsPerPage);
    const [currentPage, setCurrentPage] = useState(0);
  
    const visibleReviews = reviewData.slice(
      currentPage * reviewsPerPage,
      currentPage * reviewsPerPage + reviewsPerPage
    );
  
    return (
      <section className="reviews-section" id="reviews">
        <div className="reviews-container">
          <div className="reviews-header">
            <h2 className="section-title">People Love Valuing with Valuez</h2>
            <p className="section-subtitle">Aliquam lacinia diam quis lacus euismod</p>
          </div>
          
          <div className={`reviews-carousel ${currentPage === totalPages - 1 ? 'centered' : ''}`}>
            {visibleReviews.map((review, index) => (
              <div className="review-card" key={index}>
                <div className="review-header">
                  <h3 className="review-title">{review.title}</h3>
                  <div className="review-quote">❝</div>
                </div>
                <div className="review-content">
                  <p>{review.content}</p>
                </div>
                <div className="review-rating">
                  <div className="stars">
                    {Array.from({ length: 5 }, (_, i) => (
                      <span key={i} className={`star ${i < review.rating ? 'filled' : ''}`}>★</span>
                    ))}
                  </div>
                </div>
                <div className="review-author">
                  <div className="author-avatar">
                    <img src={review.authorAvatar} alt={review.authorName} />
                  </div>
                  <div className="author-info">
                    <h4 className="author-name">{review.authorName}</h4>
                    <p className="author-role">{review.authorRole}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
  
          <div className="reviews-dots">
            {Array.from({ length: totalPages }).map((_, pageIndex) => (
              <span
                key={pageIndex}
                className={`dot ${pageIndex === currentPage ? 'active' : ''}`}
                onClick={() => setCurrentPage(pageIndex)}
              ></span>
            ))}
          </div>
        </div>
      </section>
    );
  };
  
  export default Reviews;