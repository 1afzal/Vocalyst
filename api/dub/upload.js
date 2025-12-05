const multer = require('multer');
const fs = require('fs');
const path = require('path');
const connectDB = require('../_utils/db');
const { DubbingJob } = require('../_utils/models');
const { processDubbing } = require('../_utils/dubbingService');

// Configure multer for Vercel (use /tmp directory)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = '/tmp/uploads';
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ 
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB limit
});

// Wrapper to handle multer with async/await
const runMiddleware = (req, res, fn) => {
  return new Promise((resolve, reject) => {
    fn(req, res, (result) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });
};

module.exports = async (req, res) => {
  // Handle CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await connectDB();

    // Handle file upload
    await runMiddleware(req, res, upload.single('video'));

    const { targetLanguage } = req.body;
    const file = req.file;

    if (!file || !targetLanguage) {
      return res.status(400).json({ error: 'File and target language are required' });
    }

    const jobId = `job-${Date.now()}`;

    // Create job in database
    await DubbingJob.create({
      jobId,
      sourceType: 'upload',
      fileName: file.originalname,
      targetLanguage,
      status: 'processing',
    });

    res.json({ jobId, message: 'Job created successfully' });

    // Process in background (fire and forget for Vercel)
    (async () => {
      try {
        await processDubbing(file.path, targetLanguage, jobId);

        // Clean up original file
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      } catch (error) {
        console.error('Error processing uploaded file:', error);
      }
    })();
  } catch (error) {
    console.error('Error processing uploaded file:', error);
    res.status(500).json({ error: error.message });
  }
};

