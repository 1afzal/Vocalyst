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

    res.json({
      jobId: job.jobId,
      status: job.status,
      sourceType: job.sourceType,
      targetLanguage: job.targetLanguage,
      outputFilePath: job.outputFilePath,
      createdAt: job.createdAt,
      completedAt: job.completedAt,
      error: job.error,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

