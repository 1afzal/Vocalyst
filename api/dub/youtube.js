const ytdl = require('ytdl-core');
const path = require('path');
const connectDB = require('../_utils/db');
const { DubbingJob } = require('../_utils/models');
const { downloadYouTubeVideo } = require('../_utils/youtubeService');
const { processDubbing } = require('../_utils/dubbingService');

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

    const { url, targetLanguage } = req.body;

    if (!url || !targetLanguage) {
      return res.status(400).json({ error: 'URL and target language are required' });
    }

    // Validate YouTube URL
    if (!ytdl.validateURL(url)) {
      return res.status(400).json({ error: 'Invalid YouTube URL' });
    }

    const jobId = `job-${Date.now()}`;

    // Create job in database
    await DubbingJob.create({
      jobId,
      sourceType: 'youtube',
      sourceUrl: url,
      targetLanguage,
      status: 'processing',
    });

    res.json({ jobId, message: 'Job created successfully' });

    // Process in background (fire and forget for Vercel)
    // Note: Vercel functions have timeout limits, so long processing may need external queue
    (async () => {
      try {
        const videoPath = path.join('/tmp', `${jobId}.mp3`);
        await downloadYouTubeVideo(url, videoPath);
        await processDubbing(videoPath, targetLanguage, jobId);

        // Clean up original file
        if (require('fs').existsSync(videoPath)) {
          require('fs').unlinkSync(videoPath);
        }
      } catch (error) {
        console.error('Error processing YouTube video:', error);
      }
    })();
  } catch (error) {
    console.error('Error processing YouTube video:', error);
    res.status(500).json({ error: error.message });
  }
};

