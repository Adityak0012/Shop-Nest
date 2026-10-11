// Demo catalogue. No images: each product is shown as a Bootstrap Icon on a coloured tile.
// [name, brand, category, price, mrp, stock, icon, color, rating, reviews, featured, description, highlights]

const rows = [
  // Mobiles
  ['Nova X5 5G Smartphone', 'Nova', 'Mobiles', 18999, 23999, 24, 'bi-phone', '#4F46E5', 4.4, 1288, true,
    'A fast 5G phone with a 6.6" 120Hz AMOLED display, 50MP camera and an all-day 5000mAh battery.',
    ['6.6" 120Hz AMOLED', '8GB RAM, 128GB storage', '5000mAh, 45W fast charging']],
  ['Pixelite Mini 128GB', 'Pixelite', 'Mobiles', 12499, 14999, 3, 'bi-phone-flip', '#7C3AED', 4.1, 642, false,
    'A compact phone that fits one hand, with clean Android and three years of updates.',
    ['6.1" FHD display', 'Dual 48MP cameras', '3 years of OS updates']],
  ['Orbit Fold Z', 'Orbit', 'Mobiles', 89999, 104999, 6, 'bi-phone-landscape', '#0F172A', 4.6, 211, true,
    'A foldable that opens into a 7.6" tablet, built for multitasking on the move.',
    ['7.6" foldable display', 'Snapdragon flagship chip', 'IPX8 water resistance']],
  ['MagCharge 15W Wireless Charger', 'Volt', 'Mobiles', 1499, 2499, 60, 'bi-lightning-charge', '#16A34A', 4.3, 3410, false,
    'A slim wireless charging pad that tops up Qi phones and earbuds at up to 15W. Just place and charge.',
    ['15W fast wireless charging', 'Works with Qi phones and earbuds', 'Soft-touch anti-slip finish']],

  // Laptops
  ['AeroBook 14 Thin & Light', 'Aero', 'Laptops', 54990, 64990, 12, 'bi-laptop', '#2563EB', 4.5, 534, true,
    'A 1.3kg laptop with a 14" 2.8K display, 16GB RAM and up to 12 hours of battery.',
    ['14" 2.8K display', '16GB RAM, 512GB SSD', '1.3kg, 12-hour battery']],
  ['TitanForge G15 Gaming Laptop', 'TitanForge', 'Laptops', 89990, 109990, 4, 'bi-cpu', '#DC2626', 4.6, 302, true,
    'An RTX-powered gaming laptop with a 165Hz screen and a cooling system that stays quiet.',
    ['RTX 4060 graphics', '15.6" 165Hz display', 'Per-key RGB keyboard']],
  ['StudyMate 15 Laptop', 'StudyMate', 'Laptops', 32990, 38990, 18, 'bi-pc-display', '#0891B2', 4.0, 877, false,
    'A dependable everyday laptop for classes, coding practice and video calls.',
    ['Intel Core i5', '8GB RAM, 512GB SSD', 'Full HD webcam']],
  ['ClickPro Wireless Mouse', 'ClickPro', 'Laptops', 899, 1499, 75, 'bi-mouse', '#475569', 4.2, 5120, false,
    'A silent-click wireless mouse with a 12-month battery and a comfortable grip.',
    ['Silent clicks', '2.4GHz + Bluetooth', '12-month battery']],
  ['KeyCraft Mechanical Keyboard', 'KeyCraft', 'Laptops', 3499, 4999, 2, 'bi-keyboard', '#9333EA', 4.5, 1490, false,
    'A hot-swappable mechanical keyboard with tactile switches and white backlight.',
    ['Hot-swappable switches', 'USB-C, detachable cable', 'White backlight']],

  // Audio
  ['Pulse ANC Headphones', 'Pulse', 'Audio', 7999, 12999, 30, 'bi-headphones', '#E11D48', 4.5, 2210, true,
    'Over-ear headphones with active noise cancellation and 40 hours of playback.',
    ['Active noise cancellation', '40-hour battery', 'Multipoint Bluetooth']],
  ['Pulse Buds Pro', 'Pulse', 'Audio', 3499, 5999, 45, 'bi-earbuds', '#DB2777', 4.3, 4105, true,
    'True wireless earbuds with ANC, a low-latency game mode and a pocketable case.',
    ['Hybrid ANC', '30-hour total battery', 'Low-latency game mode']],
  ['BoomBox Portable Speaker', 'BoomBox', 'Audio', 2999, 4499, 22, 'bi-speaker', '#EA580C', 4.4, 1876, false,
    'A waterproof Bluetooth speaker with deep bass for trips and parties.',
    ['IPX7 waterproof', '16-hour battery', 'Pair two for stereo']],
  ['StudioCast USB Microphone', 'StudioCast', 'Audio', 4499, 5999, 9, 'bi-mic', '#334155', 4.4, 388, false,
    'A plug-and-play USB microphone for podcasts, streaming and online classes.',
    ['Cardioid pickup', 'Zero-latency monitoring', 'Plug and play USB-C']],
  ['Retro Vinyl Turntable', 'Vinyl', 'Audio', 12999, 17999, 0, 'bi-vinyl', '#B45309', 4.6, 655, true,
    'A belt-drive record player with a built-in preamp and Bluetooth out, so your records play on any speaker.',
    ['33 and 45 RPM belt drive', 'Built-in phono preamp', 'Bluetooth output']],

  // Wearables
  ['FitPulse Smartwatch 3', 'FitPulse', 'Wearables', 4999, 7999, 40, 'bi-smartwatch', '#059669', 4.3, 2988, true,
    'A smartwatch with AMOLED display, heart-rate and SpO2 tracking, and Bluetooth calling.',
    ['1.43" AMOLED', 'Bluetooth calling', '7-day battery']],
  ['Classic Steel Watch', 'Tempo', 'Wearables', 2499, 3999, 14, 'bi-watch', '#78716C', 4.1, 418, false,
    'An analog watch with a stainless steel case and a scratch-resistant mineral glass.',
    ['Stainless steel case', 'Water resistant 50m', '2-year warranty']],
  ['RunTrack Fitness Band', 'RunTrack', 'Wearables', 1999, 2999, 55, 'bi-activity', '#0D9488', 4.0, 3320, false,
    'A light fitness band that tracks steps, sleep and workouts for up to two weeks.',
    ['14-day battery', 'Sleep tracking', '100+ workout modes']],

  // Gaming
  ['NovaPlay Wireless Controller', 'NovaPlay', 'Gaming', 3999, 4999, 28, 'bi-controller', '#1D4ED8', 4.6, 1544, true,
    'A wireless controller for PC and mobile with Hall-effect sticks that do not drift.',
    ['Hall-effect sticks', 'PC, Android and iOS', '30-hour battery']],
  ['ArcadeStick Pro', 'NovaPlay', 'Gaming', 6999, 8999, 5, 'bi-joystick', '#BE123C', 4.4, 233, false,
    'An arcade fight stick with clicky buttons for fighting games on PC and console.',
    ['8 arcade buttons', 'Turbo mode', 'USB-C wired']],
  ['UltraView 27" 165Hz Monitor', 'UltraView', 'Gaming', 18999, 24999, 10, 'bi-display', '#4338CA', 4.5, 702, true,
    'A 27" QHD IPS gaming monitor with 165Hz refresh rate and 1ms response time.',
    ['27" QHD IPS', '165Hz, 1ms', 'Height-adjustable stand']],
  ['VR Explorer Headset', 'VRX', 'Gaming', 29999, 34999, 3, 'bi-headset-vr', '#7E22CE', 4.2, 141, false,
    'An all-in-one VR headset with hand tracking and a growing game library.',
    ['Standalone, no PC needed', 'Hand tracking', '128GB storage']],

  // Home & Kitchen
  ['BrewMaster Coffee Maker', 'BrewMaster', 'Home & Kitchen', 3299, 4999, 16, 'bi-cup-hot', '#92400E', 4.3, 912, false,
    'A drip coffee maker that brews up to 6 cups with a keep-warm plate.',
    ['6-cup capacity', 'Keep-warm plate', 'Reusable filter']],
  ['Lumen Smart LED Lamp', 'Lumen', 'Home & Kitchen', 1499, 2499, 38, 'bi-lamp', '#CA8A04', 4.2, 1208, false,
    'A desk lamp with adjustable colour temperature and brightness, controlled from your phone.',
    ['App and voice control', '16 million colours', 'Eye-care flicker-free light']],
  ['SteelBrew Gooseneck Kettle', 'BrewMaster', 'Home & Kitchen', 2799, 3999, 18, 'bi-droplet', '#57534E', 4.4, 534, false,
    'An electric pour-over kettle with a precise gooseneck spout and temperature hold for coffee and tea.',
    ['0.8 L capacity', 'Temperature hold', 'Precision gooseneck spout']],
  ['CleanBot Robot Vacuum', 'CleanBot', 'Home & Kitchen', 15999, 24999, 7, 'bi-robot', '#334155', 4.3, 389, true,
    'A robot vacuum that maps your home, vacuums and mops, and returns to charge.',
    ['Vacuum and mop', 'Lidar mapping', 'App scheduling']],
  ['SmartHome Wi-Fi Router', 'NetFly', 'Home & Kitchen', 2799, 3999, 21, 'bi-router', '#0F766E', 4.2, 1660, false,
    'A dual-band Wi-Fi 6 router that covers a 3BHK home with stable speeds.',
    ['Wi-Fi 6, dual band', 'Up to 1800 Mbps', 'Parental controls']],

  // Fashion
  ['Trailhead Laptop Backpack', 'Trailhead', 'Fashion', 1899, 2999, 48, 'bi-backpack', '#1E3A8A', 4.4, 2876, true,
    'A water-resistant backpack with a padded 15.6" laptop sleeve and USB charging port.',
    ['Fits 15.6" laptops', 'Water resistant', 'USB charging port']],
  ['Aviator Polarized Sunglasses', 'Ray Ridge', 'Fashion', 1299, 2499, 33, 'bi-sunglasses', '#0F172A', 4.0, 954, false,
    'Lightweight aviator sunglasses with polarized UV400 lenses.',
    ['Polarized lenses', 'UV400 protection', 'Metal frame']],
  ['Urban Leather Handbag', 'Urban', 'Fashion', 2499, 3999, 1, 'bi-handbag', '#9F1239', 4.3, 412, false,
    'A structured handbag in vegan leather with a zip pocket and detachable strap.',
    ['Vegan leather', 'Detachable strap', '3 compartments']],
  ['Stride Running Sneakers', 'Stride', 'Fashion', 3499, 5999, 32, 'bi-lightning', '#EA580C', 4.4, 2104, true,
    'Light, cushioned running shoes with a breathable mesh upper for daily runs and long walks.',
    ['Breathable mesh upper', 'Cushioned foam sole', 'Sizes UK 6 to 11']],

  // Books
  ['Inkwell E-Reader 6"', 'Inkwell', 'Books', 9999, 12999, 20, 'bi-tablet', '#334155', 4.6, 820, true,
    'A glare-free 6" e-ink reader with a warm front light and weeks of battery. Holds thousands of books.',
    ['6" 300 ppi e-ink screen', 'Adjustable warm light', 'Up to 6 weeks battery']],
  ['Classics Hardcover Collection', 'Penhouse', 'Books', 1499, 2499, 25, 'bi-book', '#7F1D1D', 4.5, 356, false,
    'A set of six timeless novels in cloth-bound hardcover editions, a beautiful addition to any shelf.',
    ['Set of 6 hardcovers', 'Cloth-bound with ribbon marker', 'Gift-ready box']],
  ['Heritage Leather Journal', 'Mindful', 'Books', 899, 1299, 4, 'bi-journal-bookmark', '#78350F', 4.3, 1288, false,
    'A handmade leather-wrap journal with 200 pages of thick, unlined paper for notes, sketches and plans.',
    ['Genuine leather wrap', '200 unlined pages', 'Refillable insert']],

  // Sports
  ['Velocity Road Bicycle', 'Velocity', 'Sports', 21999, 27999, 5, 'bi-bicycle', '#15803D', 4.4, 274, false,
    'A light aluminium road bike with 21 gears for city rides and weekend trails.',
    ['Aluminium frame', '21-speed gears', 'Disc brakes']],
  ['ProKick Football', 'ProKick', 'Sports', 899, 1299, 66, 'bi-dribbble', '#EA580C', 4.3, 1530, false,
    'A size 5 match football with a stitched, all-weather cover.',
    ['Size 5', 'Hand stitched', 'All-weather cover']],
  ['IronCore Adjustable Dumbbells', 'ProKick', 'Sports', 4999, 6999, 0, 'bi-heart-pulse', '#1C1917', 4.5, 211, false,
    'A pair of hex dumbbells with rubber-coated heads and knurled steel handles for strength training at home.',
    ['2 x 5 kg hex dumbbells', 'Rubber-coated, floor safe', 'Knurled steel grip']],
];

export const demoProducts = rows.map(
  ([name, brand, category, price, mrp, stock, icon, color, rating, numReviews, featured, description, highlights]) => ({
    name, brand, category, price, mrp, stock, icon, color, rating, numReviews, featured, description, highlights,
  })
);
