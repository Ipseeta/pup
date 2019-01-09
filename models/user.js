var mongoose = require('mongoose'),
    ALLOWED_ROLES = ['admin', 'user'];

var userSchema = new mongoose.Schema({
    username: { type: 'String', required: true },
    password: 'String',
    role: { type: 'String', enum: ALLOWED_ROLES },
});

module.exports = mongoose.model('User', userSchema);
