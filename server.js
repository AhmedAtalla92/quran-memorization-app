const express = require('express');
const cors = require('cors');
const sgMail = require('@sendgrid/mail');

const app = express();
const PORT = process.env.PORT || 3000;

// SendGrid API Key
sgMail.setApiKey(process.env.SENDGRID_API_KEY || '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');

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
        const { email, otp } = req.body;

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

        await sgMail.send(msg);

        console.log('OTP email sent to:', email);
        res.json({ success: true, message: 'OTP sent successfully' });

    } catch (error) {
        console.error('SendGrid error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to send email: ' + error.message 
        });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
