# Hafez Quraan API Backend

Simple backend API for sending OTP emails via SendGrid.

## Deploy to Render.com

### Step 1: Create New Web Service

1. Go to https://render.com/dashboard
2. Click "New +" → "Web Service"
3. Connect your GitHub repository OR use "Public Git repository"
4. If using public repo, paste: `https://github.com/AhmedAtalla92/quran-memorization-app`

### Step 2: Configure Service

Fill in these settings:

- **Name:** `hafez-quraan-api`
- **Region:** Choose closest to you (e.g., Frankfurt, Oregon)
- **Branch:** `main`
- **Root Directory:** Leave empty (or `backend` if you put these files in a backend folder)
- **Runtime:** `Node`
- **Build Command:** `npm install`
- **Start Command:** `npm start`
- **Instance Type:** `Free`

### Step 3: Add Environment Variable

Click "Advanced" → "Add Environment Variable":

- **Key:** `SENDGRID_API_KEY`
- **Value:** `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`

### Step 4: Deploy

1. Click "Create Web Service"
2. Wait 2-3 minutes for deployment
3. You'll get a URL like: `https://hafez-quraan-api.onrender.com`

### Step 5: Test

Visit: `https://hafez-quraan-api.onrender.com/`

You should see: `{"status":"OK","message":"Hafez Quraan API is running"}`

### Step 6: Update Frontend

In your main HTML file, change the API endpoint from:
```javascript
'https://api.sendgrid.com/v3/mail/send'
```

To:
```javascript
'https://YOUR-SERVICE-NAME.onrender.com/send-otp'
```

## API Endpoint

### POST /send-otp

Send OTP email to a user.

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

## Notes

- Free tier sleeps after 15 minutes of inactivity
- First request after sleep takes ~30 seconds (cold start)
- After that, responses are instant
- Enough for your app's needs!
