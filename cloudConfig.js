const fs = require('fs');
const path = require('path');
const { v2: cloudinary } = require('cloudinary');
require('dotenv').config();
// 1. Cloudinary Config
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
});

// 2. Define the public directory
const publicDir = path.join(__dirname, 'public');

// 3. Get all folders inside public
fs.readdir(publicDir, async (err, folders) => {
  if (err) return console.error('Error reading public folder:', err);

  for (const folder of folders) {
    const folderPath = path.join(publicDir, folder);

    // Skip files, only process directories
    if (!fs.lstatSync(folderPath).isDirectory()) continue;

    // 4. Read each image file inside each folder
    const files = fs.readdirSync(folderPath);

    for (const file of files) {
      const filePath = path.join(folderPath, file);

      // Optional: skip non-images
      if (!/\.(jpe?g|png)$/i.test(file)) continue;

      try {
        const result = await cloudinary.uploader.upload(filePath, {
          folder: `CineVibes_DEV/${folder}`, // Keep folder structure
          public_id: path.parse(file).name,  // Filename without extension
        });

        console.log(`✅ Uploaded: ${result.secure_url}`);
      } catch (uploadErr) {
        console.error(`❌ Failed to upload ${file}:`, uploadErr);
      }
    }
  }
});
