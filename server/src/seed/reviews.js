// Sample reviews so a fresh demo store has real ratings to show.
// Each product gets 3-6 reviews from demo shoppers. Ratings average close to the product's demo rating.

export const REVIEWERS = [
  'Priya Sharma', 'Rahul Verma', 'Ananya Iyer', 'Karan Mehta', 'Sneha Patil', 'Arjun Nair', 'Isha Kulkarni', 'Vikram Singh',
];

const GENERIC = {
  5: [
    ['Worth every rupee', 'Exactly as described and the quality feels premium. Delivery was quick and the packaging was solid.'],
    ['Excellent', 'Using it daily for a few weeks now and it has been flawless. Would happily buy again.'],
    ['Love it', 'Looks even better in person. Great build quality for the price.'],
  ],
  4: [
    ['Very good', 'Does everything I needed. Small things could be better but overall a great buy.'],
    ['Good value', 'Solid product at this price. Took a day longer to arrive than shown, otherwise no complaints.'],
    ['Happy with it', 'Works well and feels well made. Instructions could be clearer.'],
  ],
  3: [
    ['Decent', 'It is okay for the price. Does the job but nothing special.'],
    ['Average', 'Some good points, some not so good. Expected slightly better finish.'],
  ],
  2: [['Not great', 'Quality did not match the photos for me. Customer support was helpful though.']],
};

const BY_CATEGORY = {
  Mobiles: ['Battery easily lasts a full day and the display is bright and sharp.', 'Camera is very good in daylight, decent at night.'],
  Laptops: ['Boots fast, stays cool and the keyboard is comfortable for long typing sessions.', 'Perfect for college work and coding.'],
  Audio: ['Sound is clear with good bass, and the battery life is impressive.', 'Pairing is instant and the sound is rich.'],
  Wearables: ['Comfortable to wear all day and the tracking is accurate.', 'Notifications and health tracking work well.'],
  Gaming: ['Responsive and comfortable for long gaming sessions.', 'Works perfectly with my PC with no setup needed.'],
  'Home & Kitchen': ['Easy to use and looks great on the counter.', 'Feels sturdy and makes daily routines easier.'],
  Fashion: ['Material feels premium and the fit is just right.', 'Stylish and practical, I get compliments on it.'],
  Books: ['Beautiful quality, a pleasure to hold and read.', 'Makes a lovely gift too.'],
  Sports: ['Sturdy and well made, holds up to regular use.', 'Great for daily workouts.'],
};

/** Picks n ratings (1-5) whose average is close to target. Deterministic per product index. */
function ratingsFor(target, n, seed) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const wobble = [0.4, -0.6, 0.2, -0.2, 0.6, -0.4][(seed + i) % 6];
    out.push(Math.max(2, Math.min(5, Math.round(target + wobble))));
  }
  return out;
}

/** Builds review documents for the given saved products and reviewer users. */
export function buildSampleReviews(products, reviewers) {
  const reviews = [];
  products.forEach((p, pi) => {
    const n = 3 + (pi % 4); // 3 to 6 reviews
    ratingsFor(p.rating || 4.2, n, pi).forEach((rating, i) => {
      const reviewer = reviewers[(pi + i * 3) % reviewers.length];
      const pool = GENERIC[rating] || GENERIC[4];
      const [title, base] = pool[(pi + i) % pool.length];
      const extra = (BY_CATEGORY[p.category] || [])[(pi + i) % 2] || '';
      reviews.push({
        product: p._id,
        user: reviewer._id,
        name: reviewer.name,
        rating,
        title,
        comment: rating >= 4 ? `${extra} ${base}`.trim() : base,
        verified: true,
        createdAt: new Date(Date.now() - (pi * 7 + i * 3 + 1) * 86_400_000),
      });
    });
  });
  return reviews;
}
