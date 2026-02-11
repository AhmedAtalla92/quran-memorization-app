# Hafez Quraan - حافظ قرآن

[![Live Site](https://img.shields.io/badge/Live-hafezquraan.com-green)](https://hafezquraan.com)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

A comprehensive Quran memorization web application to help users memorize, review, and test their knowledge of the Holy Quran.

![Hafez Quraan Logo](Hafez%20Quraan%20Logo.png)

## Features

### 🔐 Secure Authentication
- Email-based OTP (One-Time Password) verification
- No password required - secure 6-digit codes sent to email
- Powered by SendGrid for reliable delivery

### 📖 Memorization Tools
- Browse all 6,236 verses of the Quran
- Arabic text (Uthmani script) with English translations
- Filter by:
  - Juz (1-30)
  - Surah (1-114)
  - Ayah (verse-specific)
  - Memorization status (all, memorized, not memorized)
- Adjustable verses per page (1, 3, 5, 10, 20, 30, 40, 50)
- Mark verses as memorized with toggle switches

### 🎧 Audio Recitation
- Listen to Sheikh Mishary Rashid Al-Afasy's beautiful recitation
- Audio player for each verse
- High-quality audio from Al-Quran Cloud CDN

### 📊 Progress Tracking
- Real-time statistics dashboard
- Completion percentage (out of 6,236 verses)
- Completed surahs count
- Verses reviewed counter
- Visual progress bars for memorization and review

### 🎯 Quiz System
- Test your memorization with fill-in-the-blank questions
- Select specific surahs to quiz
- 5-minute timer per session
- Chronological verse order
- Automatic review tracking
- Score display and results

## Technology Stack

### Frontend
- **HTML5/CSS3** - Modern, responsive design
- **Vanilla JavaScript** - No frameworks, lightweight and fast
- **Google Fonts** - Amiri (Arabic), Crimson Pro (English)

### Backend API
- **Node.js** with Express
- **SendGrid** - Email delivery service
- Hosted on **Render.com** (free tier)

### Data Source
- **Al-Quran Cloud API** - Quranic text and metadata
- Arabic: Uthmani script
- Translation: Muhammad Asad (English)
- Audio: Sheikh Mishary Rashid Al-Afasy

### Storage
- **LocalStorage** - Client-side data persistence
- Stores memorization progress and user preferences

## Design

### Color Palette
- **Primary Green:** #1a4d2e (Islamic green)
- **Gold Accent:** #d4af37 (Traditional Islamic gold)
- **Cream Background:** #faf8f3 (Easy on the eyes)
- **Success Green:** #2d6a4f (Progress indicators)

### Typography
- **Arabic:** Amiri (700, 400) - Traditional Quranic font
- **English:** Crimson Pro (600, 400, 300) - Elegant serif

### User Experience
- Mobile-first responsive design
- Touch-optimized controls
- Smooth animations and transitions
- Accessible color contrast
- Intuitive navigation

## Project Structure

```
quran-memorization-app/
├── index.html              # Main application file (single-page app)
├── Hafez Quraan Logo.png   # Application logo
├── server.js               # Backend API server
├── package.json            # Backend dependencies
└── README.md               # This file
```

## Local Development

### Frontend
1. Clone the repository
```bash
git clone https://github.com/AhmedAtalla92/quran-memorization-app.git
cd quran-memorization-app
```

2. Open `index.html` in your browser
```bash
# macOS
open index.html

# Linux
xdg-open index.html

# Windows
start index.html
```

### Backend (Optional - for email functionality)
1. Install dependencies
```bash
npm install
```

2. Set environment variables
```bash
export SENDGRID_API_KEY=your_sendgrid_api_key
```

3. Run the server
```bash
npm start
```

Server runs on `http://localhost:3000`

## Deployment

### Frontend (GitHub Pages)
- Automatically deployed from `main` branch
- Live at: [hafezquraan.com](https://hafezquraan.com)
- Updates within 2 minutes of push

### Backend (Render.com)
- Deployed from same repository
- API endpoint: `https://hafez-quraan-api.onrender.com`
- Environment variable: `SENDGRID_API_KEY`

## Usage

### Getting Started
1. Visit [hafezquraan.com](https://hafezquraan.com)
2. Enter your email address
3. Receive 6-digit verification code
4. Enter code to sign in
5. Start memorizing!

### Memorizing Verses
1. Navigate to **Memorize** tab
2. Use filters to find specific verses
3. Read Arabic text and translation
4. Listen to audio recitation
5. Toggle "Memorized" when ready
6. Navigate through verses

### Taking Quizzes
1. Navigate to **Quiz** tab
2. Select a memorized surah
3. Click "Start Quiz"
4. Fill in the blank for each verse
5. View your score
6. Verses automatically marked as reviewed

### Tracking Progress
1. Navigate to **Account** tab
2. View statistics:
   - Total verses memorized
   - Completion percentage
   - Completed surahs
   - Reviewed verses
3. Monitor progress bars

## API Reference

### Backend Endpoints

#### POST /send-otp
Send OTP verification code to email

**Request:**
```json
{
  "email": "user@example.com",
  "otp": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "message": "OTP sent successfully"
}
```

### External APIs

#### Al-Quran Cloud API
- Arabic Text: `https://api.alquran.cloud/v1/quran/quran-uthmani`
- Translation: `https://api.alquran.cloud/v1/quran/en.asad`
- Audio CDN: `https://cdn.islamic.network/quran/audio/128/ar.alafasy/{ayah}.mp3`

## Browser Support

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- **Al-Quran Cloud** - For providing free Quran API
- **Sheikh Mishary Rashid Al-Afasy** - For beautiful Quran recitation
- **SendGrid** - For reliable email delivery
- **Islamic Network** - For CDN and audio hosting

## Support

For support, email info@hafezquraan.com or open an issue on GitHub.

## Roadmap

- [ ] Dark mode
- [ ] Multiple translation options
- [ ] Tajweed highlighting
- [ ] Spaced repetition algorithm
- [ ] Mobile app (React Native)
- [ ] Social features (study groups)
- [ ] Offline mode (PWA)
- [ ] Multiple reciters

---

**Built with ❤️ for the Muslim community**

*"The best among you are those who learn the Quran and teach it."* - Prophet Muhammad ﷺ
