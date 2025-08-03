# Demo Error Debugging Plan

## Common Demo Errors and Solutions

### Error 1: Database Connection Issues
**Symptoms:**
- "Cannot connect to database"
- "Supabase connection failed"
- Empty search results

**Debugging Steps:**
1. Check Supabase credentials in `.env` file:
   ```bash
   cd backend
   cat .env | grep SUPABASE
   ```

2. Verify Supabase is running:
   - Check Supabase dashboard
   - Ensure project is not paused
   - Check API keys are valid

3. Test database connection:
   ```bash
   cd backend
   python3 -c "from services.individual_service import IndividualService; print('DB connected')"
   ```

**Fix:**
```bash
# Update .env with correct credentials
SUPABASE_URL=your-project-url
SUPABASE_KEY=your-anon-key
```

### Error 2: Demo Data Not Found
**Symptoms:**
- Search returns no results
- "John Doe" not found
- Empty individual list

**Debugging Steps:**
1. Check if migrations were run:
   ```bash
   cd supabase
   supabase db push
   ```

2. Verify demo data exists:
   ```sql
   -- Run in Supabase SQL Editor
   SELECT name, danger_score FROM individuals 
   WHERE name IN ('John Doe', 'Jane Smith', 'Robert Johnson', 'Maria Garcia', 'Unknown Person');
   ```

3. Check for data in correct format:
   ```sql
   SELECT name, data->'approximate_age' as age, data->>'gender' as gender
   FROM individuals WHERE name = 'John Doe';
   ```

**Fix:**
```bash
# Run the demo data migration
cd supabase
supabase migration up
# Or manually run 004_required_demo_individuals.sql
```

### Error 3: Photo Upload Failures
**Symptoms:**
- "Failed to upload photo"
- Photo not showing after upload
- Storage permission errors

**Debugging Steps:**
1. Check storage bucket exists:
   ```sql
   -- In Supabase dashboard
   SELECT * FROM storage.buckets WHERE name = 'photos';
   ```

2. Verify storage policies:
   ```sql
   -- Check if public access is enabled
   SELECT * FROM storage.objects WHERE bucket_id = 'photos';
   ```

3. Test photo upload endpoint:
   ```bash
   curl -X POST http://localhost:8001/api/photos/upload \
     -H "Authorization: Bearer your-token" \
     -F "photo=@test.jpg" \
     -F "individual_id=test-id"
   ```

**Fix:**
```sql
-- Create photos bucket if missing
INSERT INTO storage.buckets (id, name, public) 
VALUES ('photos', 'photos', true);

-- Enable public access
CREATE POLICY "Public Access" ON storage.objects 
FOR SELECT USING (bucket_id = 'photos');
```

### Error 4: Search/Filter Not Working
**Symptoms:**
- Search returns wrong results
- Filters don't apply
- Age filter not working with [-1, -1]

**Debugging Steps:**
1. Check search indexes exist:
   ```sql
   -- List all indexes
   SELECT indexname FROM pg_indexes 
   WHERE tablename = 'individuals';
   ```

2. Test search directly:
   ```sql
   -- Test name search
   SELECT * FROM individuals 
   WHERE name ILIKE '%john%';
   
   -- Test age filter with unknown
   SELECT * FROM individuals 
   WHERE data->'approximate_age' = '[-1, -1]'::jsonb;
   ```

3. Verify API endpoint:
   ```bash
   curl "http://localhost:8001/api/individuals/search?q=john" \
     -H "Authorization: Bearer your-token"
   ```

**Fix:**
```sql
-- Run performance indexes migration
-- Run 005_search_performance_indexes.sql

-- Fix age array format
UPDATE individuals 
SET data = jsonb_set(data, '{approximate_age}', '[-1, -1]'::jsonb)
WHERE name = 'Jane Smith';
```

### Error 5: Authentication Issues
**Symptoms:**
- "Unauthorized" errors
- Auto-login not working
- Token expired messages

**Debugging Steps:**
1. Check demo credentials:
   ```javascript
   // In AuthContext.tsx
   console.log('Demo email:', DEMO_EMAIL);
   console.log('Demo password:', DEMO_PASSWORD);
   ```

2. Test auth manually:
   ```bash
   curl -X POST https://your-project.supabase.co/auth/v1/token?grant_type=password \
     -H "apikey: your-anon-key" \
     -d '{"email":"demo@sfgov.org","password":"demo123456"}'
   ```

3. Verify user exists:
   ```sql
   SELECT email FROM auth.users WHERE email = 'demo@sfgov.org';
   ```

**Fix:**
```sql
-- Create demo user if missing
-- Run in Supabase SQL Editor
INSERT INTO auth.users (email, encrypted_password, email_confirmed_at)
VALUES ('demo@sfgov.org', crypt('demo123456', gen_salt('bf')), now());
```

## Quick Debug Checklist

1. **Backend Running?**
   ```bash
   cd backend && uvicorn main:app --reload --port 8001
   ```

2. **Frontend Running?**
   ```bash
   cd mobile && npm start
   ```

3. **Environment Variables Set?**
   - Check `backend/.env`
   - Check `mobile/.env` or config files

4. **Database Migrations Run?**
   - Run all migrations in order
   - Verify demo data exists

5. **API Endpoints Accessible?**
   ```bash
   # Test health check
   curl http://localhost:8001/health
   ```

## Common Quick Fixes

### Reset Demo Data
```sql
-- Clear and recreate demo individuals
DELETE FROM individuals WHERE name IN ('John Doe', 'Jane Smith', 'Robert Johnson', 'Maria Garcia', 'Unknown Person');
-- Then re-run 004_required_demo_individuals.sql
```

### Fix Array Format Issues
```sql
-- Fix approximate_age format
UPDATE individuals 
SET data = jsonb_set(
  data, 
  '{approximate_age}', 
  CASE 
    WHEN data->>'approximate_age' = '-1' THEN '[-1, -1]'::jsonb
    ELSE data->'approximate_age'
  END
);
```

### Enable Debug Logging
```javascript
// In api.ts
console.log('API Request:', endpoint, options);
console.log('API Response:', response);

// In individual_service.py
print(f"Search query: {query}")
print(f"Results: {len(results)}")
```

## Error Patterns to Watch For

1. **JSON Format Issues**
   - Age must be array: `[45, 50]` not `"45-50"`
   - Unknown age: `[-1, -1]` not `null`

2. **Photo URL Issues**
   - Must be NULL initially (not empty string)
   - Must use Supabase storage URLs

3. **Search Issues**
   - Name search is case-insensitive
   - Must have pg_trgm extension enabled

4. **Auth Issues**
   - Token must be in Bearer format
   - Demo user must exist in auth.users

## Testing Each Demo Individual

```bash
# Test each individual exists
for name in "John Doe" "Jane Smith" "Robert Johnson" "Maria Garcia" "Unknown Person"; do
  echo "Testing: $name"
  curl "http://localhost:8001/api/individuals/search?q=$name" \
    -H "Authorization: Bearer your-token"
done
```

## If All Else Fails

1. Check backend logs:
   ```bash
   cd backend
   tail -f logs/app.log
   ```

2. Check browser console:
   - Open Developer Tools
   - Look for red errors
   - Check Network tab for failed requests

3. Reset everything:
   ```bash
   # Stop all services
   # Clear database
   # Re-run all migrations
   # Restart services
   ```

Please share the specific error messages you're seeing, and I can provide more targeted debugging steps!