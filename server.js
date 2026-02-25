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
} else {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    console.log('SendGrid configured successfully');
}

// PostgreSQL Connection
if (!process.env.DATABASE_URL) {
    console.error('ERROR: DATABASE_URL environment variable is not set!');
    process.exit(1);
}

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

// Initialize Database with NEW schema
async function initDB() {
    try {
        // Create tables
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                email VARCHAR(255) UNIQUE NOT NULL,
                language VARCHAR(10) DEFAULT 'en',
                reciter VARCHAR(100) DEFAULT 'ar.alafasy',
                last_view_mode VARCHAR(20) DEFAULT 'surah',
                last_verse_index INTEGER DEFAULT 0,
                last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS user_progress (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                verse_key VARCHAR(50) NOT NULL,
                is_memorized BOOLEAN DEFAULT false,
                is_reviewed BOOLEAN DEFAULT false,
                is_bookmarked BOOLEAN DEFAULT false,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(user_id, verse_key)
            );

            CREATE TABLE IF NOT EXISTS user_recited_pages (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                page_number INTEGER NOT NULL,
                recited_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(user_id, page_number)
            );

            CREATE TABLE IF NOT EXISTS activity_logs (
                id SERIAL PRIMARY KEY,
                email VARCHAR(255) NOT NULL,
                activity_type VARCHAR(50) NOT NULL,
                metadata JSONB,
                timestamp TIMESTAMP NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE INDEX IF NOT EXISTS idx_user_progress_user_id ON user_progress(user_id);
            CREATE INDEX IF NOT EXISTS idx_user_recited_pages_user_id ON user_recited_pages(user_id);
            CREATE INDEX IF NOT EXISTS idx_activity_logs_email ON activity_logs(email);
            CREATE INDEX IF NOT EXISTS idx_activity_logs_timestamp ON activity_logs(timestamp);
            CREATE INDEX IF NOT EXISTS idx_activity_logs_type ON activity_logs(activity_type);
        `);
        
        // Add new columns for existing databases
        await pool.query(`
            DO $$ 
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                              WHERE table_name='users' AND column_name='language') THEN
                    ALTER TABLE users ADD COLUMN language VARCHAR(10) DEFAULT 'en';
                END IF;
                
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                              WHERE table_name='users' AND column_name='reciter') THEN
                    ALTER TABLE users ADD COLUMN reciter VARCHAR(100) DEFAULT 'ar.alafasy';
                END IF;
                
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                              WHERE table_name='users' AND column_name='last_view_mode') THEN
                    ALTER TABLE users ADD COLUMN last_view_mode VARCHAR(20) DEFAULT 'surah';
                END IF;
                
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                              WHERE table_name='users' AND column_name='last_verse_index') THEN
                    ALTER TABLE users ADD COLUMN last_verse_index INTEGER DEFAULT 0;
                END IF;
                
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                              WHERE table_name='users' AND column_name='last_active') THEN
                    ALTER TABLE users ADD COLUMN last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
                END IF;
                
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                              WHERE table_name='user_progress' AND column_name='is_bookmarked') THEN
                    ALTER TABLE user_progress ADD COLUMN is_bookmarked BOOLEAN DEFAULT false;
                END IF;
            END $$;
        `);
        
        console.log('✅ Database initialized with all fields including activity_logs');
    } catch (error) {
        console.error('❌ Database initialization error:', error);
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

// Health check
app.get('/', (req, res) => {
    res.json({ status: 'OK', message: 'Hafez Quraan API is running' });
});

app.get('/health', (req, res) => {
    res.status(200).json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// Send OTP endpoint
app.post('/send-otp', async (req, res) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({ success: false, error: 'Email and OTP required' });
        }

        if (!email.includes('@') || !email.includes('.')) {
            return res.status(400).json({ success: false, error: 'Invalid email' });
        }

        if (!process.env.SENDGRID_API_KEY) {
            return res.status(500).json({ success: false, error: 'Email service not configured' });
        }

        const msg = {
            to: email,
            from: { email: 'info@hafezquraan.com', name: 'Hafez Quraan' },
            subject: 'Your Verification Code - Hafez Quraan',
            html: `
                <!DOCTYPE html>
                <html>
                <body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;background:#fff;">
                    <div style="max-width:600px;margin:0 auto;padding:20px;">
                        <div style="text-align:center;margin-bottom:30px;">
                            <img src="https://raw.githubusercontent.com/AhmedAtalla92/quran-memorization-app/main/Hafez%20Quraan%20Logo.png" width="100" height="100" style="display:block;margin:0 auto;">
                        </div>
                        <div style="background:#f9f9f9;border:1px solid #e0e0e0;border-radius:8px;padding:30px;margin-bottom:20px;">
                            <h2 style="color:#1a4d2e;font-size:20px;margin:0 0 15px 0;text-align:center;">Verification Code</h2>
                            <p style="color:#333;font-size:15px;line-height:1.5;margin:0 0 20px 0;text-align:center;">
                                Here is your verification code:
                            </p>
                            <div style="background:#fff;border:2px solid #1a4d2e;border-radius:6px;padding:20px;text-align:center;margin:20px 0;">
                                <div style="font-size:32px;font-weight:bold;color:#1a4d2e;letter-spacing:5px;font-family:'Courier New',monospace;">
                                    ${otp}
                                </div>
                            </div>
                            <p style="color:#666;font-size:13px;line-height:1.5;margin:15px 0 0 0;text-align:center;">
                                Code expires in 5 minutes
                            </p>
                        </div>
                        <div style="background:#fffbf0;border-left:3px solid #d4af37;padding:12px 15px;margin-bottom:20px;">
                            <p style="color:#666;font-size:13px;line-height:1.5;margin:0;">
                                <strong>Security:</strong> Never share this code.
                            </p>
                        </div>
                        <div style="text-align:center;padding-top:20px;border-top:1px solid #e0e0e0;">
                            <p style="color:#999;font-size:12px;margin:0 0 5px 0;">Hafez Quraan</p>
                            <p style="color:#999;font-size:11px;margin:0;">
                                <a href="https://hafezquraan.com" style="color:#1a4d2e;text-decoration:none;">hafezquraan.com</a>
                            </p>
                        </div>
                    </div>
                </body>
                </html>
            `
        };

        await sgMail.send(msg);
        res.json({ success: true, message: 'OTP sent' });

    } catch (error) {
        console.error('SendGrid error:', error);
        res.status(500).json({ success: false, error: 'Failed to send email' });
    }
});

// Save user progress (UPDATED)
app.post('/save-progress', async (req, res) => {
    try {
        const { 
            email, memorized, reviewed, recited, bookmarked,
            language, reciter, lastViewMode, lastVerseIndex
        } = req.body;

        if (!email) {
            return res.status(400).json({ success: false, error: 'Email required' });
        }

        console.log('💾 Saving:', email, '- Recited:', recited?.length || 0, 'pages');

        // Get or create user
        let userResult = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
        let userId;

        if (userResult.rows.length === 0) {
            const result = await pool.query(
                'INSERT INTO users (email, language, reciter, last_view_mode, last_verse_index, last_active) VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP) RETURNING id',
                [email, language || 'en', reciter || 'ar.alafasy', lastViewMode || 'surah', lastVerseIndex || 0]
            );
            userId = result.rows[0].id;
        } else {
            userId = userResult.rows[0].id;
            await pool.query(
                'UPDATE users SET language=$1, reciter=$2, last_view_mode=$3, last_verse_index=$4, last_active=CURRENT_TIMESTAMP, updated_at=CURRENT_TIMESTAMP WHERE id=$5',
                [language || 'en', reciter || 'ar.alafasy', lastViewMode || 'surah', lastVerseIndex || 0, userId]
            );
        }

        // Clear old data
        await pool.query('DELETE FROM user_progress WHERE user_id = $1', [userId]);
        await pool.query('DELETE FROM user_recited_pages WHERE user_id = $1', [userId]);

        // Save verses
        const memorizedArray = memorized || [];
        const reviewedArray = reviewed || [];
        const bookmarkedArray = bookmarked || [];
        
        for (const verseKey of memorizedArray) {
            await pool.query(
                'INSERT INTO user_progress (user_id, verse_key, is_memorized, is_reviewed, is_bookmarked) VALUES ($1, $2, true, $3, $4)',
                [userId, verseKey, reviewedArray.includes(verseKey), bookmarkedArray.includes(verseKey)]
            );
        }

        for (const verseKey of reviewedArray) {
            if (!memorizedArray.includes(verseKey)) {
                await pool.query(
                    'INSERT INTO user_progress (user_id, verse_key, is_memorized, is_reviewed, is_bookmarked) VALUES ($1, $2, false, true, $3)',
                    [userId, verseKey, bookmarkedArray.includes(verseKey)]
                );
            }
        }

        for (const verseKey of bookmarkedArray) {
            if (!memorizedArray.includes(verseKey) && !reviewedArray.includes(verseKey)) {
                await pool.query(
                    'INSERT INTO user_progress (user_id, verse_key, is_memorized, is_reviewed, is_bookmarked) VALUES ($1, $2, false, false, true)',
                    [userId, verseKey]
                );
            }
        }

        // Save recited pages
        const recitedArray = recited || [];
        for (const pageNumber of recitedArray) {
            await pool.query(
                'INSERT INTO user_recited_pages (user_id, page_number) VALUES ($1, $2)',
                [userId, pageNumber]
            );
        }

        console.log('✅ Saved successfully');
        res.json({ success: true, message: 'Progress saved' });
    } catch (error) {
        console.error('❌ Save error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Load user progress (UPDATED)
app.get('/load-progress/:email', async (req, res) => {
    try {
        const { email } = req.params;

        const userResult = await pool.query(
            'SELECT id, language, reciter, last_view_mode, last_verse_index FROM users WHERE email = $1',
            [email]
        );
        
        if (userResult.rows.length === 0) {
            return res.json({ 
                success: true, memorized: [], reviewed: [], recited: [], bookmarked: [],
                language: 'en', reciter: 'ar.alafasy', lastViewMode: 'surah', lastVerseIndex: 0
            });
        }

        const user = userResult.rows[0];
        const userId = user.id;

        // Load verses
        const progressResult = await pool.query(
            'SELECT verse_key, is_memorized, is_reviewed, is_bookmarked FROM user_progress WHERE user_id = $1',
            [userId]
        );

        const memorized = [], reviewed = [], bookmarked = [];
        progressResult.rows.forEach(row => {
            if (row.is_memorized) memorized.push(row.verse_key);
            if (row.is_reviewed) reviewed.push(row.verse_key);
            if (row.is_bookmarked) bookmarked.push(row.verse_key);
        });

        // Load recited pages
        const recitedResult = await pool.query(
            'SELECT page_number FROM user_recited_pages WHERE user_id = $1',
            [userId]
        );
        const recited = recitedResult.rows.map(row => row.page_number);

        console.log('✅ Loaded:', email, '- Recited:', recited.length, 'pages');

        res.json({ 
            success: true, memorized, reviewed, recited, bookmarked,
            language: user.language || 'en',
            reciter: user.reciter || 'ar.alafasy',
            lastViewMode: user.last_view_mode || 'surah',
            lastVerseIndex: user.last_verse_index || 0
        });
    } catch (error) {
        console.error('❌ Load error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ══════════════════════════════════════════════════════════════
// ANALYTICS ENDPOINTS
// ══════════════════════════════════════════════════════════════

// Log user activity
app.post('/log-activity', async (req, res) => {
    try {
        const { email, activityType, metadata, timestamp } = req.body;

        if (!email || !activityType) {
            return res.status(400).json({ success: false, error: 'Email and activityType required' });
        }

        // Insert activity log
        await pool.query(
            'INSERT INTO activity_logs (email, activity_type, metadata, timestamp) VALUES ($1, $2, $3, $4)',
            [email, activityType, JSON.stringify(metadata || {}), timestamp || new Date().toISOString()]
        );

        // Update or create user's last_active
        // Use INSERT ... ON CONFLICT to handle case where user doesn't exist yet
        await pool.query(
            `INSERT INTO users (email, last_active) 
             VALUES ($1, CURRENT_TIMESTAMP)
             ON CONFLICT (email) 
             DO UPDATE SET last_active = CURRENT_TIMESTAMP`,
            [email]
        );

        console.log('📊 Activity logged:', email, '-', activityType);
        res.json({ success: true, message: 'Activity logged' });
    } catch (error) {
        console.error('❌ Log activity error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get analytics data
app.get('/analytics', async (req, res) => {
    try {
        const { timeframe } = req.query;

        // Calculate date range
        let dateFilter = '';
        
        if (timeframe === 'today') {
            dateFilter = "AND timestamp >= CURRENT_DATE";
        } else if (timeframe === 'week') {
            dateFilter = "AND timestamp >= CURRENT_DATE - INTERVAL '7 days'";
        } else if (timeframe === 'month') {
            dateFilter = "AND timestamp >= CURRENT_DATE - INTERVAL '30 days'";
        }

        // Total users
        const totalUsersResult = await pool.query('SELECT COUNT(DISTINCT email) as count FROM users');
        const totalUsers = parseInt(totalUsersResult.rows[0].count);

        // Active today
        const activeTodayResult = await pool.query(
            'SELECT COUNT(DISTINCT email) as count FROM activity_logs WHERE timestamp >= CURRENT_DATE'
        );
        const activeToday = parseInt(activeTodayResult.rows[0].count);

        // Active this week
        const activeWeekResult = await pool.query(
            "SELECT COUNT(DISTINCT email) as count FROM activity_logs WHERE timestamp >= CURRENT_DATE - INTERVAL '7 days'"
        );
        const activeWeek = parseInt(activeWeekResult.rows[0].count);

        // Recent activity
        const recentActivityQuery = `
            SELECT email, activity_type, metadata, timestamp 
            FROM activity_logs 
            WHERE 1=1 ${dateFilter}
            ORDER BY timestamp DESC 
            LIMIT 50
        `;
        const recentActivityResult = await pool.query(recentActivityQuery);
        const recentActivity = recentActivityResult.rows.map(row => ({
            email: row.email,
            activityType: row.activity_type,
            metadata: row.metadata,
            timestamp: row.timestamp
        }));

        // User progress summary
        const userProgressQuery = `
            SELECT 
                u.email,
                u.last_active,
                COUNT(DISTINCT CASE WHEN up.is_memorized THEN up.verse_key END) as memorized,
                COUNT(DISTINCT urp.page_number) as recited_pages,
                COUNT(DISTINCT CASE WHEN up.is_bookmarked THEN up.verse_key END) as bookmarks
            FROM users u
            LEFT JOIN user_progress up ON u.id = up.user_id
            LEFT JOIN user_recited_pages urp ON u.id = urp.user_id
            GROUP BY u.email, u.last_active
            ORDER BY u.last_active DESC NULLS LAST
        `;
        const userProgressResult = await pool.query(userProgressQuery);
        const userProgress = userProgressResult.rows.map(row => ({
            email: row.email,
            memorized: parseInt(row.memorized) || 0,
            recitedPages: parseInt(row.recited_pages) || 0,
            bookmarks: parseInt(row.bookmarks) || 0,
            lastActive: row.last_active
        }));

        console.log('📊 Analytics loaded - Total users:', totalUsers, 'Active today:', activeToday);

        res.json({
            success: true,
            totalUsers,
            activeToday,
            activeWeek,
            recentActivity,
            userProgress
        });
    } catch (error) {
        console.error('❌ Analytics error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
