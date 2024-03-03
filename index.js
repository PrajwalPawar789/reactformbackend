const express = require('express');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const cors = require('cors'); // Add CORS middleware

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(cors({ // Enable CORS for all origins with credentials
  origin: 'http://localhost:3000',
  credentials: true
}));

const secretKey = 'your_secret_key';

// Authentication route
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    // Check credentials (replace with your authentication logic)
    if (username === 'admin' && password === 'admin123') {
        const token = jwt.sign({ username }, secretKey, { expiresIn: '1m' });
        res.cookie('jwt', token, { httpOnly: true, secure: true });
        res.json({ success: true });
    } else {
        res.status(401).json({ success: false, message: 'Invalid username or password' });
    }
});

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

// Dashboard route (protected)
app.get('/dashboard', authenticateToken, (req, res) => {
    res.json({ success: true, message: 'Welcome to the dashboard!' });
});

// Logout route
app.post('/logout', (req, res) => {
    res.clearCookie('jwt');
    res.json({ success: true, message: 'Logout successful' });
});

app.listen(5000, () => console.log('Server is running on port 5000'));
