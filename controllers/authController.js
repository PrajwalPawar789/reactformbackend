const { Pool } = require('pg');
const jwt = require('jsonwebtoken');

const secretKey = 'your_secret_key';
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'main-app-v1.0',
  password: 'root',
  port: '5432',
});

exports.login = async (req, res) => {
  const { username, password } = req.body;
  try {
    // Check credentials using PostgreSQL (replace with your authentication logic)
    const result = await pool.query('SELECT * FROM users WHERE username = $1 AND password = $2', [username, password]);
    if (result.rows.length > 0) {
      const userId = result.rows[0].userid; // Assuming userid is the user identifier
      const token = jwt.sign({ userid: userId }, secretKey, { expiresIn: '1m' });
      res.cookie('jwt', token, { httpOnly: true, secure: true });

      const currentTime = new Date().toISOString();
      const userHistoryResult = await pool.query('SELECT * FROM userhistory WHERE userid = $1', [userId]);

      if (userHistoryResult.rows.length === 0) {
        await pool.query('INSERT INTO userhistory (userid, firstlogin) VALUES ($1, $2)', [userId, currentTime]);
      } else {
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
};

exports.logout = async (req, res) => {
  try {
    const token = req.cookies.jwt;
    const decoded = jwt.verify(token, secretKey);
    const userId = decoded.userid;

    const currentTime = new Date().toISOString();

    await pool.query('UPDATE userhistory SET lastlogout = $1 WHERE userid = $2', [currentTime, userId]);

    res.clearCookie('jwt');
    res.json({ success: true, message: 'Logout successful' });
  } catch (error) {
    console.error('Error logging out:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
