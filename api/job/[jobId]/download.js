const fs = require('fs');
const connectDB = require('../_utils/db');
const { DubbingJob } = require('../_utils/models');

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

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await connectDB();

    const { jobId } = req.query;
    const job = await DubbingJob.findOne({ jobId });
    
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    if (job.status !== 'completed') {
      return res.status(400).json({ error: 'Job not completed yet' });
    }

    // Note: In Vercel, files in /tmp are ephemeral
    // For production, you should use cloud storage (S3, etc.) and return a signed URL
    if (!job.outputFilePath || !fs.existsSync(job.outputFilePath)) {
      return res.status(404).json({ error: 'Output file not found. Files in /tmp are ephemeral on Vercel.' });
    }

    res.setHeader('Content-Disposition', `attachment; filename=dubbed-${job.jobId}.mp3`);
    res.setHeader('Content-Type', 'audio/mpeg');
    
    const fileStream = fs.createReadStream(job.outputFilePath);
    fileStream.pipe(res);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

