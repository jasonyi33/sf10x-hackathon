# Task 4 Integration Guide

## **Overview**
This guide explains how to integrate Task 4 (Frontend Data Management) with the completed Tasks 1, 2, and 3 (Backend API, Voice Recording, Database).

## **Configuration Required**

### **1. Update API Base URL**
Edit `mobile/config/api.ts` and replace the placeholder URL:

```typescript
export const API_CONFIG = {
  // Replace with your actual Railway deployment URL
  BASE_URL: 'https://your-railway-app.railway.app',
  // ... rest of config
};
```

**To find your Railway URL:**
1. Go to your Railway dashboard
2. Select your deployed app
3. Copy the generated URL (e.g., `https://sf10x-hackathon-production.up.railway.app`)

### **2. Supabase Credentials (Optional)**
If you need direct Supabase access from the frontend, update these in `mobile/config/api.ts`:

```typescript
SUPABASE: {
  URL: 'https://vhfyquescrbwbbvvhxdg.supabase.co', // Your Supabase project URL
  ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZoZnlxdWVzY3Jid2JidnZoeGRnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQxMjQ5NDksImV4cCI6MjA2OTcwMDk0OX0.3grO_YeaqeM73db9jzvBV0WyLBwuD_ynW9lH3Z4Os4g', // Your Supabase anon key
},
```

**To find your Supabase credentials:**
1. Go to your Supabase project dashboard
2. Navigate to Settings → API
3. Copy the Project URL and anon/public key

### **3. Backend Environment Variables**
Your backend (Tasks 1, 2, 3) needs these environment variables in Railway:

```bash
# Supabase Database
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Optional: For file storage
SUPABASE_STORAGE_URL=https://your-project.supabase.co/storage/v1
```

### **4. Verify API Endpoints**
The following endpoints should be available on your backend:

- `GET /api/individuals` - List all individuals with search
- `GET /api/individuals/:id` - Get individual profile with interactions
- `PUT /api/individuals/:id` - Update individual (danger override)
- `GET /api/categories` - List all categories
- `GET /api/export` - Export CSV data

### **5. Test Integration**

#### **Search Functionality:**
- Navigate to Search tab
- Type a name to search
- Results should load from real database
- Click on result to view individual profile

#### **Individual Profile:**
- View complete individual data
- Test danger score slider
- Verify interaction history
- Test manual override functionality

#### **Categories & Export:**
- View categories from database
- Test CSV export functionality

## **Features Now Available**

### **✅ Real Data Integration:**
- Search individuals from real database
- View individual profiles with real data
- Update danger overrides (persists to database)
- Export real data to CSV

### **✅ Navigation:**
- Stack navigation enabled
- Search → Individual Profile navigation works
- Back button functionality

### **✅ Error Handling:**
- Network error handling
- API error responses
- Loading states

## **Troubleshooting**

### **Common Issues:**

1. **"Network Error"**
   - Check if Railway app is deployed and running
   - Verify API_BASE_URL is correct
   - Check CORS configuration on backend

2. **"404 Not Found"**
   - Verify API endpoints match backend implementation
   - Check if database has demo data

3. **"Navigation Error"**
   - Ensure @react-navigation/stack is installed
   - Check if IndividualProfileScreen is properly imported

4. **"Supabase Connection Error"**
   - Verify Supabase credentials are correct
   - Check if Supabase project is active
   - Ensure database tables exist

### **Testing Checklist:**
- [ ] API_BASE_URL is set correctly
- [ ] Backend is deployed and accessible
- [ ] Database has demo data
- [ ] Search functionality works
- [ ] Individual profiles load
- [ ] Danger override saves
- [ ] CSV export works
- [ ] Navigation between screens works
- [ ] Supabase credentials are correct (if using direct access)

## **Next Steps**

Once integration is complete:
1. Test all features thoroughly
2. Verify data persistence
3. Test error scenarios
4. Prepare for demo

**Your Task 4 frontend is now fully integrated with the real backend!** 🚀 