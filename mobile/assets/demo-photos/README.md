# Demo Photos

This directory contains references to demo photos for the 5 required demo individuals.

## Demo Photo URLs

The demo photos are served from Supabase Storage at these URLs:

1. **John Doe** (Male, 45-50, Medium skin)
   - Current: `https://storage.supabase.co/v1/object/public/photos/demo/john-doe.jpg`
   - Placeholder: Light-skinned male, medium build, casual clothing

2. **Robert Johnson** (Male, 65-70, Dark skin)
   - Current: `https://storage.supabase.co/v1/object/public/photos/demo/robert-johnson-current.jpg`
   - History 1: `https://storage.supabase.co/v1/object/public/photos/demo/robert-johnson-old-1.jpg`
   - History 2: `https://storage.supabase.co/v1/object/public/photos/demo/robert-johnson-old-2.jpg`
   - Placeholder: Elderly dark-skinned male, worn clothing

3. **Maria Garcia** (Female, 30-35, Medium skin)
   - Current: `https://storage.supabase.co/v1/object/public/photos/demo/maria-garcia.jpg`
   - Placeholder: Young female, medium skin tone, approachable appearance

## Individuals Without Photos

These individuals should NOT have photos:

4. **Jane Smith** (Female, Unknown age, Light skin) - No photo
5. **Unknown Person** (Unknown gender, Unknown age, Medium skin) - No photo

## Using Demo Photos in Development

When running in demo mode, the app will use placeholder images from:
- https://via.placeholder.com/300x400/cccccc/666666?text=John+Doe
- https://via.placeholder.com/300x400/cccccc/666666?text=Robert+Johnson
- https://via.placeholder.com/300x400/cccccc/666666?text=Maria+Garcia

These can be replaced with actual photos when deploying to production.

## Photo Requirements

- Format: JPEG
- Max size: 5MB
- Dimensions: Minimum 300x400px
- Orientation: Portrait preferred
- Content: Respectful, non-identifying photos that maintain dignity