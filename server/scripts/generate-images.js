/**
 * Generates a product photo for every demo product with a Hugging Face text-to-image model
 * and saves it to client/public/images/products/<slug>.<ext>.
 *
 * Usage (from the ShopNest folder):  npm run images
 * Needs HF_TOKEN in server/.env  ->  https://huggingface.co/settings/tokens
 *   (token type "Fine-grained" with "Make calls to Inference Providers" ticked, or a "Read" token)
 *
 * Options:
 *   npm run images -- --force          regenerate photos that already exist
 *   npm run images -- --only=pulse     only products whose slug contains "pulse"
 *   HF_IMAGE_MODEL=...                 use another model (default FLUX.1-schnell)
 */
import fs from 'node:fs';
import path from 'node:path';
import { InferenceClient } from '@huggingface/inference';
import '../src/config/env.js'; // loads server/.env
import { demoProducts } from '../src/seed/products.js';
import { slugify } from '../src/models/Product.js';
import { IMAGE_DIR } from '../src/seed/seed.js';

const token = process.env.HF_TOKEN;
const model = process.env.HF_IMAGE_MODEL || 'black-forest-labs/FLUX.1-schnell';
const force = process.argv.includes('--force');
const only = process.argv.find((a) => a.startsWith('--only='))?.split('=')[1]?.toLowerCase();

if (!token) {
  console.error('\nHF_TOKEN is missing.');
  console.error('1. Create a free token at https://huggingface.co/settings/tokens');
  console.error('   (Fine-grained -> tick "Make calls to Inference Providers")');
  console.error('2. Add this line to server/.env:   HF_TOKEN=hf_xxxxxxxxxxxx');
  console.error('3. Run "npm run images" again.\n');
  process.exit(1);
}

// Plain-English colour names keep the backgrounds soft and on-brand
const BACKGROUND = {
  Mobiles: 'soft lavender', Laptops: 'pale blue', Audio: 'blush pink', Wearables: 'mint green', Gaming: 'cool grey-blue',
  'Home & Kitchen': 'warm beige', Fashion: 'light sand', Books: 'off-white', Sports: 'pale green',
};

function promptFor(p) {
  const bg = BACKGROUND[p.category] || 'light grey';
  return [
    `Professional e-commerce product photograph of a ${p.name.replace(/\b(Nova|Pixelite|Orbit|Volt|Aero|TitanForge|StudyMate|ClickPro|KeyCraft|Pulse|BoomBox|StudioCast|Vinyl|FitPulse|Tempo|RunTrack|NovaPlay|UltraView|VRX|BrewMaster|Lumen|BreezeAir|CleanBot|NetFly|Trailhead|Ray Ridge|Urban|TechPress|Mindful|Velocity|ProKick)\b/g, '').trim()}`,
    `(${p.category.toLowerCase()}). ${p.description}`,
    `Single product, centered, three-quarter view, soft studio lighting, gentle shadow,`,
    `plain seamless ${bg} background, sharp focus, photorealistic, high detail,`,
    `no text, no words, no logo, no watermark, no people.`,
  ].join(' ');
}

const extFor = (type) => ({ 'image/png': 'png', 'image/webp': 'webp', 'image/jpeg': 'jpg', 'image/jpg': 'jpg' })[type] || 'jpg';
const existing = (slug) => ['webp', 'jpg', 'jpeg', 'png'].map((e) => path.join(IMAGE_DIR, `${slug}.${e}`)).find((f) => fs.existsSync(f));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function generate(client, prompt) {
  try {
    return await client.textToImage({ model, provider: 'auto', inputs: prompt, parameters: { width: 768, height: 768 } });
  } catch (err) {
    // Some providers reject width/height; retry once without them
    if (/parameter|width|height|422|400/i.test(String(err?.message))) {
      return client.textToImage({ model, provider: 'auto', inputs: prompt });
    }
    throw err;
  }
}

async function main() {
  fs.mkdirSync(IMAGE_DIR, { recursive: true });
  const client = new InferenceClient(token);
  const products = demoProducts
    .map((p) => ({ ...p, slug: slugify(p.name) }))
    .filter((p) => !only || p.slug.includes(only));

  console.log(`\nModel: ${model}`);
  console.log(`Saving to: ${IMAGE_DIR}\n`);

  let made = 0, skipped = 0, failed = 0;
  for (const [i, p] of products.entries()) {
    const tag = `[${String(i + 1).padStart(2)}/${products.length}] ${p.name}`;
    const old = existing(p.slug);
    if (old && !force) { console.log(`${tag}  - already exists, skipped`); skipped++; continue; }

    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const blob = await generate(client, promptFor(p));
        const file = path.join(IMAGE_DIR, `${p.slug}.${extFor(blob.type)}`);
        if (old && old !== file) fs.rmSync(old);
        fs.writeFileSync(file, Buffer.from(await blob.arrayBuffer()));
        console.log(`${tag}  ✓ ${path.basename(file)} (${Math.round(blob.size / 1024)} KB)`);
        made++;
        break;
      } catch (err) {
        const msg = String(err?.message || err);
        if (/401|unauthorized|invalid.*token/i.test(msg)) {
          console.error(`\nYour HF_TOKEN was rejected. Check it in server/.env and that it can "Make calls to Inference Providers".\n`);
          process.exit(1);
        }
        if (/402|credit|quota|payment/i.test(msg)) {
          console.error(`\n${tag}  ✗ Out of free Hugging Face credits: ${msg}`);
          console.error('Photos made so far are saved. Run again later (or next month) to finish the rest.\n');
          return summary(made, skipped, failed + 1);
        }
        if (attempt === 3) { console.error(`${tag}  ✗ failed: ${msg}`); failed++; }
        else { console.warn(`${tag}  … retrying (${msg.slice(0, 80)})`); await sleep(5000 * attempt); }
      }
    }
    await sleep(800); // be gentle with rate limits
  }
  summary(made, skipped, failed);
}

function summary(made, skipped, failed) {
  console.log(`\nDone: ${made} created, ${skipped} skipped, ${failed} failed.`);
  console.log('Restart "npm run dev" and the store will show the photos (products without one keep their icon).\n');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

