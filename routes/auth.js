const express = require('express'),
    router = express.Router(),
    LocalStrategy = require('passport-local').Strategy,
    SHA256 = require('crypto-js/sha256'),
    User = require('../models/user');

module.exports = function (passport) {

    passport.use(new LocalStrategy({
        usernameField: 'username',
        passwordField: 'password',
    },
        function (username, password, done) {
            User.findOne({ username: username }, function (err, user) {
                if (err) { return done(err); }
                if (!user) { return done(null, false); }
                if (SHA256(password).toString() !== user.password) { return done(null, false); }

                user.password = ''; // unset password so that it's not accidentally leaked anywhere. Note: Password has been hashed already.
                return done(null, user);
            });
        }
    ));
    /**
     * Stores data of the user object in the session
     */
    passport.serializeUser(function (user, cb) {
        cb(null, user.id);
    });
    /**
     * Fetches user using the key id and stores as req.user
     */
    passport.deserializeUser(function (id, cb) {
        User.findById(id, function (err, user) {
            if (err) { return cb(err); }
            if (user) {
                user.password = '';
            }
            cb(null, user);
        });
    });
    /**
     * Loads login page for non-loggedin user
     */
    // router.get('/login', function (req, res) {
    //     if (req.user) {
    //         return res.redirect('/');
    //     }
    //     res.render('login.ejs', {invalidCredentials: !!req.query['invalid_credentials']});
    // });
    /**
     * Loads signup page for non-loggedin user
     */
    // router.get('/signup', function (req, res) {
    //     if (req.user) {
    //         return res.redirect('/');
    //     }
    //     res.render('signup.ejs');
    // });
    /**
     * Verifies username and password, if fails then redirects to /login else takes to home page
     */
    // router.post('/login', passport.authenticate('local', { failureRedirect: '/login?invalid_credentials=true' }), function (req, res) {
    //     res.redirect('/');
    // });
    /**
     * Signup will check the existing user, or will create a new one.
     */
    // router.post('/signup', function (req, res) {
    //     const username = req.body.username;
    //     const password = req.body.password;
    //     const role = req.body.role;
    //     User.count({ username: username }, function (err, count) {
    //         if (count > 0) {
    //             return res.status(403).end();
    //         }
    //         new User({
    //             username: username,
    //             password: SHA256(password),
    //             role: role
    //         }).save(function (err, user) {
    //             res.status(200).end();
    //         });
    //     });

    // });
    /**
     * Admin is only accessible to loggedin user with admin role
     */
    // router.get('/admin', function (req, res) {
    //     if (!req.user) {
    //         return res.redirect('/login');
    //     }
    //     if (req.user.role !== 'admin') {
    //         return res.redirect('/');
    //     }
    //     res.render('admin.ejs', {
    //         user: req.user
    //     });
    // });
    /**
     * Logout user
     */
    router.get('/logout', function (req, res) {
        req.logout();
        res.redirect('/');
    });

    return router;
};
