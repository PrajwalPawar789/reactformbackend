const express = require('express');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));

const secretKey = 'your_secret_key';

// PostgreSQL configuration
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'main-app-v1.0',
  password: 'root',
  port: '5432',
});

// Authentication route
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    // Check credentials using PostgreSQL (replace with your authentication logic)
    try {
        const result = await pool.query('SELECT * FROM users WHERE username = $1 AND password = $2', [username, password]);
        if (result.rows.length > 0) {
            const userId = result.rows[0].userid; // Assuming userid is the user identifier
            const token = jwt.sign({ userid: userId }, secretKey, { expiresIn: '1m' });
            res.cookie('jwt', token, { httpOnly: true, secure: true });
;
            const currentTime = new Date().toISOString();
            const userHistoryResult = await pool.query('SELECT * FROM userhistory WHERE userid = $1', [userId]);
            
            if (userHistoryResult.rows.length === 0) {
                // First time user, insert first_login
                await pool.query('INSERT INTO userhistory (userid, firstlogin) VALUES ($1, $2)', [userId, currentTime]);
            } else {
                // Existing user, update last_login
                await pool.query('UPDATE userhistory SET lastlogin = $1 WHERE userid = $2', [currentTime, userId]);
            }
            
            res.json({ success: true });
        } else {
            res.status(401).json({ success: false, message: 'Invalid username or password' });
        }
    } catch (error) {
        console.error('Error authenticating user:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
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

// search route (protected)
app.get('/search', authenticateToken, (req, res) => {
    res.json({ success: true, message: 'Welcome to the search!' });
});

// Logout route
app.post('/logout', async (req, res) => {
    try {
        // Retrieve user id from JWT token
        const token = req.cookies.jwt;
        const decoded = jwt.verify(token, secretKey);
        const userId = decoded.userid; // Assuming userid is the user identifier
        
        const currentTime = new Date().toISOString();
        
        // Update last_logout time in user history
        await pool.query('UPDATE userhistory SET lastlogout = $1 WHERE userid = $2', [currentTime, userId]);
        
        res.clearCookie('jwt');
        res.json({ success: true, message: 'Logout successful' });
    } catch (error) {
        console.error('Error logging out:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
