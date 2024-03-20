const express = require('express');

const router = express.Router();

const authenticateToken = (req, res, next) => {
  const token = req.cookies.jwt;
  if (!token) return res.sendStatus(401);
  jwt.verify(token, secretKey, (err, decoded) => {
    if (err) return res.sendStatus(403);
    req.user = decoded;
    next();
  });
};

router.get('/search', authenticateToken, (req, res) => {
  res.json({ success: true, message: 'Welcome to the search!' });
});

module.exports = router;
