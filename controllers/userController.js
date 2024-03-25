// controllers/userController.js
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');

const secretKey = 'your_secret_key';

// PostgreSQL configuration
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'main-app-v1.0',
  password: 'root',
  port: '5432',
});



async function login(req, res) {
    const { username, password } = req.body;
    // Check credentials using PostgreSQL (replace with your authentication logic)
    try {
        const result = await pool.query('SELECT * FROM users WHERE username = $1 AND password = $2', [username, password]);
        if (result.rows.length > 0) {
            const userId = result.rows[0].userid; // Assuming userid is the user identifier
            const token = jwt.sign({ userid: userId }, secretKey, { expiresIn: '10m' });
            res.cookie('jwt', token, { httpOnly: true, secure: true });
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
}

async function logout(req, res) {
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
}

async function search(req, res) {
    try {
        res.json({ success: true, message: 'Welcome to the search!' });
    } catch (error) {
        console.error('Error in search:', error);
        res.status(500).json({ success: false, message: 'Internal server error in search' });
    }
}

async function fetchLeads(req, res) {
    // Extract filters from request body
    const { selectedIndustries, selectedTitles, companyName } = req.body;
  
    // Base query
    let query = 'SELECT * FROM public.prospects WHERE 1=1';
    const queryParams = [];
  
    // Filter by industries
    if (selectedIndustries && selectedIndustries.length) {
      queryParams.push(...selectedIndustries);
      const industryPlaceholders = selectedIndustries.map((_, index) => `$${index + 1}`).join(',');
      query += ` AND jobfunction IN (${industryPlaceholders})`;
    }
  
    // Filter by titles
    if (selectedTitles && selectedTitles.length) {
      const startIdx = queryParams.length + 1;
      queryParams.push(...selectedTitles);
      const titlePlaceholders = selectedTitles.map((_, index) => `$${startIdx + index}`).join(',');
      query += ` AND jobtitle IN (${titlePlaceholders})`;
    }
  
    // Filter by company name
    if (companyName) {
      queryParams.push(`%${companyName.toLowerCase()}%`);
      query += ` AND LOWER(companyname) LIKE $${queryParams.length}`;
    }
  
    // Execute query
    try {
      const { rows } = await pool.query(query, queryParams);
      res.json({ success: true, data: rows });
    } catch (error) {
      console.error('Error fetching leads:', error);
      res.status(500).json({ success: false, message: 'Internal server error in fetching leads' });
    }
}
  
module.exports = { login, logout, search, fetchLeads };
