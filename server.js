const express = require('express');
const cors = require('cors');
const sgMail = require('@sendgrid/mail');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;

// SendGrid API Key
if (!process.env.SENDGRID_API_KEY) {
    console.error('ERROR: SENDGRID_API_KEY environment variable is not set!');
    console.error('Please set it in Render dashboard: Environment > SENDGRID_API_KEY');
    // Don't exit - let the app run so we can see this error in logs
} else {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    console.log('SendGrid configured successfully');
}

// PostgreSQL Connection - MUST be set in environment variables
if (!process.env.DATABASE_URL) {
    console.error('ERROR: DATABASE_URL environment variable is not set!');
    process.exit(1);
}

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

// Initialize Database
async function initDB() {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                email VARCHAR(255) UNIQUE NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS user_progress (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                verse_key VARCHAR(50) NOT NULL,
                is_memorized BOOLEAN DEFAULT false,
                is_reviewed BOOLEAN DEFAULT false,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(user_id, verse_key)
            );

            CREATE INDEX IF NOT EXISTS idx_user_progress_user_id ON user_progress(user_id);
        `);
        console.log('Database initialized successfully');
    } catch (error) {
        console.error('Database initialization error:', error);
    }
}

initDB();

// Middleware
app.use(cors({
    origin: ['https://hafezquraan.com', 'http://localhost:3000', 'https://*.github.io'],
    methods: ['POST', 'GET'],
    credentials: true
}));
app.use(express.json());

// Health check endpoint
app.get('/', (req, res) => {
    res.json({ status: 'OK', message: 'Hafez Quraan API is running' });
});

// Send OTP endpoint
app.post('/send-otp', async (req, res) => {
    try {
        console.log('=== SEND OTP REQUEST ===');
        const { email, otp } = req.body;
        console.log('Email:', email, 'OTP:', otp);

        if (!email || !otp) {
            return res.status(400).json({ 
                success: false, 
                error: 'Email and OTP are required' 
            });
        }

        // Email validation
        if (!email.includes('@') || !email.includes('.')) {
            return res.status(400).json({ 
                success: false, 
                error: 'Invalid email address' 
            });
        }

        // Check if SendGrid is configured
        if (!process.env.SENDGRID_API_KEY) {
            console.error('SendGrid API key not configured!');
            return res.status(500).json({ 
                success: false, 
                error: 'Email service not configured. Please contact support.' 
            });
        }

        const msg = {
            to: email,
            from: {
                email: 'info@hafezquraan.com',
                name: 'Hafez Quraan'
            },
            subject: 'Your Verification Code - Hafez Quraan',
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                </head>
                <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; background-color: #ffffff;">
                    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                        
                        <div style="text-align: center; margin-bottom: 30px;">
                            <img src="https://raw.githubusercontent.com/AhmedAtalla92/quran-memorization-app/main/Hafez%20Quraan%20Logo.png" alt="Hafez Quraan" width="100" height="100" style="display: block; margin: 0 auto;">
                        </div>
                        
                        <div style="background-color: #f9f9f9; border: 1px solid #e0e0e0; border-radius: 8px; padding: 30px; margin-bottom: 20px;">
                            
                            <h2 style="color: #1a4d2e; font-size: 20px; margin: 0 0 15px 0; text-align: center;">Verification Code</h2>
                            
                            <p style="color: #333333; font-size: 15px; line-height: 1.5; margin: 0 0 20px 0; text-align: center;">
                                Here is your verification code for Hafez Quraan:
                            </p>
                            
                            <div style="background-color: #ffffff; border: 2px solid #1a4d2e; border-radius: 6px; padding: 20px; text-align: center; margin: 20px 0;">
                                <div style="font-size: 32px; font-weight: bold; color: #1a4d2e; letter-spacing: 5px; font-family: 'Courier New', monospace;">
                                    ${otp}
                                </div>
                            </div>
                            
                            <p style="color: #666666; font-size: 13px; line-height: 1.5; margin: 15px 0 0 0; text-align: center;">
                                This code expires in 5 minutes
                            </p>
                            
                        </div>
                        
                        <div style="background-color: #fffbf0; border-left: 3px solid #d4af37; padding: 12px 15px; margin-bottom: 20px;">
                            <p style="color: #666666; font-size: 13px; line-height: 1.5; margin: 0;">
                                <strong>Security:</strong> Never share this code. We will never ask for it.
                            </p>
                        </div>
                        
                        <div style="text-align: center; padding-top: 20px; border-top: 1px solid #e0e0e0;">
                            <p style="color: #999999; font-size: 12px; line-height: 1.5; margin: 0 0 5px 0;">
                                Hafez Quraan - Quran Memorization App
                            </p>
                            <p style="color: #999999; font-size: 11px; line-height: 1.5; margin: 0;">
                                <a href="https://hafezquraan.com" style="color: #1a4d2e; text-decoration: none;">hafezquraan.com</a>
                            </p>
                        </div>
                        
                    </div>
                </body>
                </html>
            `
        };

        console.log('Attempting to send email via SendGrid...');
        await sgMail.send(msg);
        console.log('✓ Email sent successfully to:', email);

        res.json({ success: true, message: 'OTP sent successfully' });

    } catch (error) {
        console.error('=== SENDGRID ERROR ===');
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
        console.error('Full error:', JSON.stringify(error, null, 2));
        
        let userMessage = 'Failed to send email. ';
        
        if (error.code === 403) {
            userMessage += 'SendGrid API key is invalid or expired.';
        } else if (error.code === 401) {
            userMessage += 'SendGrid authentication failed.';
        } else {
            userMessage += error.message;
        }
        
        res.status(500).json({ 
            success: false, 
            error: userMessage
        });
    }
});

// Health check endpoint to prevent sleeping
app.get('/health', (req, res) => {
    res.status(200).json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

// Save user progress
app.post('/save-progress', async (req, res) => {
    try {
        const { email, memorized, reviewed } = req.body;

        if (!email) {
            return res.status(400).json({ success: false, error: 'Email required' });
        }

        // Get or create user
        let userResult = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
        let userId;

        if (userResult.rows.length === 0) {
            const insertResult = await pool.query(
                'INSERT INTO users (email) VALUES ($1) RETURNING id',
                [email]
            );
            userId = insertResult.rows[0].id;
        } else {
            userId = userResult.rows[0].id;
        }

        // Clear old progress
        await pool.query('DELETE FROM user_progress WHERE user_id = $1', [userId]);

        // Insert new progress
        const memorizedArray = memorized || [];
        const reviewedArray = reviewed || [];
        
        for (const verseKey of memorizedArray) {
            await pool.query(
                'INSERT INTO user_progress (user_id, verse_key, is_memorized, is_reviewed) VALUES ($1, $2, true, $3) ON CONFLICT (user_id, verse_key) DO UPDATE SET is_memorized = true, updated_at = CURRENT_TIMESTAMP',
                [userId, verseKey, reviewedArray.includes(verseKey)]
            );
        }

        for (const verseKey of reviewedArray) {
            if (!memorizedArray.includes(verseKey)) {
                await pool.query(
                    'INSERT INTO user_progress (user_id, verse_key, is_memorized, is_reviewed) VALUES ($1, $2, false, true) ON CONFLICT (user_id, verse_key) DO UPDATE SET is_reviewed = true, updated_at = CURRENT_TIMESTAMP',
                    [userId, verseKey]
                );
            }
        }

        await pool.query('UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = $1', [userId]);

        res.json({ success: true, message: 'Progress saved' });
    } catch (error) {
        console.error('Save progress error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Load user progress
app.get('/load-progress/:email', async (req, res) => {
    try {
        const { email } = req.params;

        const userResult = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
        
        if (userResult.rows.length === 0) {
            return res.json({ success: true, memorized: [], reviewed: [] });
        }

        const userId = userResult.rows[0].id;
        const progressResult = await pool.query(
            'SELECT verse_key, is_memorized, is_reviewed FROM user_progress WHERE user_id = $1',
            [userId]
        );

        const memorized = [];
        const reviewed = [];

        progressResult.rows.forEach(row => {
            if (row.is_memorized) memorized.push(row.verse_key);
            if (row.is_reviewed) reviewed.push(row.verse_key);
        });

        res.json({ success: true, memorized, reviewed });
    } catch (error) {
        console.error('Load progress error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});
