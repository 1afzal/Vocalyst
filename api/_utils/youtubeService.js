const ytdl = require('ytdl-core');
const fs = require('fs');
const path = require('path');

const downloadYouTubeVideo = async (url, outputPath) => {
  return new Promise((resolve, reject) => {
    if (!ytdl.validateURL(url)) {
      return reject(new Error('Invalid YouTube URL'));
    }

    // Ensure directory exists
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const video = ytdl(url, { quality: 'highestaudio' });
    const writeStream = fs.createWriteStream(outputPath);
    
    video.pipe(writeStream);
    
    writeStream.on('finish', () => resolve(outputPath));
    writeStream.on('error', reject);
    video.on('error', reject);
  });
};

module.exports = {
  downloadYouTubeVideo,
};

