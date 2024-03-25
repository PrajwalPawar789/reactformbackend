// routes/index.js

const jwt = require('jsonwebtoken');
const secretKey = 'your_secret_key';

const express = require('express');
const router = express.Router();

const userController = require('../controllers/userController');

// Protected route middleware
const authenticateToken = (req, res, next) => {
    const token = req.cookies.jwt;
    if (!token) return res.sendStatus(401);
    jwt.verify(token, secretKey, (err, decoded) => {
        if (err) return res.sendStatus(403);
        req.user = decoded;
        next();
    });
};

router.post('/login', userController.login);
router.post('/logout', userController.logout);
router.post('/fetchLeads', userController.fetchLeads);
router.get('/search',authenticateToken, userController.search);
// Add this line in routes/index.js



module.exports = router;
