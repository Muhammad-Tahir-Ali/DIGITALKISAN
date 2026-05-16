import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, 'backend/.env') });

import mongoose from 'mongoose';
import Product from './backend/src/models/Product.js';
import Notification from './backend/src/models/Notification.js';
import { classifyCropImage } from './backend/src/services/ai.service.js';

const processProductAI = async (productId, imageDatas, mimeTypes, userId) => {
  try {
    console.log(`Processing ${imageDatas.length} images...`);
    // Run classification on every image sequentially to avoid rate limits
    const results = [];
    for (let i = 0; i < imageDatas.length; i++) {
        console.log(`Classifying image ${i + 1}...`);
        const res = await classifyCropImage(imageDatas[i], mimeTypes[i] || 'image/jpeg');
        results.push(res);
    }

    console.log('Results:', results);
  } catch (err) {
    console.error(`Error:`, err);
  }
};

const run = async () => {
  // Use a small red dot image (valid base64) to test
  const fakeBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAZdEVYdFNvZnR3YXJlAHBhaW50Lm5ldE1QbwQAAAAQSURBVBhXY/jPwPAfQAIEAAA//wAAAAB+gOqAAAAAAElFTkSuQmCC";
  const imageDatas = [fakeBase64, fakeBase64];
  const mimeTypes = ['image/png', 'image/png'];
  
  await processProductAI("fakeId", imageDatas, mimeTypes, "fakeUserId");
};

run();
