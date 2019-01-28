const config = {
    mongoConnectionString: process.env.MONGO_URL || 'mongodb://localhost:27017/pup',
    uploadDir: process.env.UPLOAD_DIR || '/Users/ipseeta/tmp',
    cloudinary: {
        cloud_name: 'pup',
        api_key: '227318984584948',
        api_secret: '5IGkd64Sk_unMs-SO6DeuZC0Kjs'
    },
    linkedin: {
        email: "ipseeta.pkar@gmail.com",
        password: "***"
    }
};
module.exports = config;