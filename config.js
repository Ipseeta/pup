const config = {
    mongoConnectionString: process.env.MONGO_URL || 'mongodb://localhost:27017/pup'
};
module.exports = config;