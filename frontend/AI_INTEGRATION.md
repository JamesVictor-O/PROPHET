# 🤖 AI Market Validator - Setup Guide

## 🎯 What This Does

Your AI automatically:

- ✅ **Categorizes** the market (music, movies, sports, etc.)
- ✅ **Validates** if the question is verifiable
- ✅ **Suggests end dates** for time-bound events
- ✅ **Identifies verification sources** (Spotify, box office, etc.)
- ✅ **Gives improvement suggestions** to make questions better

---

## 🚀 Setup (5 Minutes)

### **Step 1: Get Free Gemini API Key**

1. Go to: https://aistudio.google.com/app/apikey
2. Click **"Create API Key"**
3. Copy the API key (starts with `AIza...`)

**No credit card required!** ✅

---

### **Step 2: Add API Key to Environment**

Create `.env.local` in the `frontend` directory:

```bash
NEXT_PUBLIC_GEMINI_API_KEY=AIzaSy...your_key_here
```

**Important:** Use `NEXT_PUBLIC_` prefix so the key is available in the browser!

---

### **Step 3: Restart Dev Server**

```bash
npm run dev
```

---

## 📊 How It Works

### **User types question** →
```
"Will Wizkid's song hit 10M Spotify streams?"
```

### **AI analyzes (1-2 seconds)** →
```json
{
  "isValid": true,
  "category": "music",
  "verificationSource": "Spotify Charts API",
  "confidence": "high",
  "reasoning": "Stream counts are publicly verifiable"
}
```

### **Auto-fills form** →
- Category: Music ✅
- Shows verification source ✅
- Gives suggestions if needed ✅

---

## 🎨 User Experience

### **1. Real-time Validation**

- User types question
- After 1 second (debounced), AI validates
- Shows ✅ or ⚠️ next to input
- Gives instant feedback

### **2. Auto-categorization**

- AI suggests category automatically
- No manual selection needed
- User can still override

### **3. Smart Suggestions**

- AI suggests better wording
- Recommends specific dates
- Warns about unverifiable questions

### **4. Verification Info**

- Shows where outcome will be verified
- Confidence level (high/medium/low)
- Helps users understand process

---

## 💰 Free Tier Limits (More Than Enough!)

| Metric | Google Gemini Free |
|--------|-------------------|
| **Requests/minute** | 60 |
| **Requests/day** | 1,500 |
| **Cost** | $0 (FREE) |
| **Credit card** | Not required |

**For your hackathon:**
- 100 users creating markets = ~100 requests
- Well within free limits! ✅

---

## 🔥 Example Interactions

### **Example 1: Music Market**

**User types:**
```
"Will Burna Boy drop an album in Q4?"
```

**AI responds:**
```
✅ Valid Market
Category: Music
End Date: Dec 31, 2024 (auto-suggested)
Verification: Official streaming platforms (Spotify, Apple Music)
Confidence: High
```

---

### **Example 2: Movie Market**

**User types:**
```
"Will King of Thieves 2 make ₦50M opening weekend?"
```

**AI responds:**
```
✅ Valid Market
Category: Movies
Verification: Cinema Pointer Nigeria, FilmOne box office
Confidence: Medium
Suggestions:
• Specify the exact release date
• Note: Box office reporting may not be real-time
```

---

## 🐛 Troubleshooting

### **"AI validation failed"**

- Check API key in `.env.local`
- Ensure `NEXT_PUBLIC_` prefix is there
- Restart dev server (`npm run dev`)

### **"Rate limit exceeded"**

- You hit 60 requests/minute (unlikely)
- Add caching or increase debounce time

### **"No response from AI"**

- Check internet connection
- Verify API key is valid
- Check browser console for errors

---

## 🎯 What Judges Will Love

1. **Smart UX** - AI helps users create better markets
2. **Real-time feedback** - Instant validation
3. **Professional** - Shows you understand AI integration
4. **Practical** - Solves real problem (bad market questions)
5. **Free** - No API costs for hackathon

---

## 🚀 Ready to Use!

The AI integration is already implemented in the `CreateMarketModal` component. Just add your API key and you're good to go!

