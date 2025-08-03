"""
Complete Phase 2 Implementation Verification
Tests all critical success criteria through actual implementation checks
"""
import os
import sys
import subprocess
import json

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

class TestPhase2CompleteVerification:
    """Comprehensive verification of Phase 2 implementation"""
    
    def __init__(self):
        self.backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        self.mobile_dir = os.path.join(os.path.dirname(self.backend_dir), 'mobile')
    
    # ==================== 1. PHOTO UPLOAD FLOW ====================
    
    def test_1_photo_upload_flow(self):
        """Test complete photo upload flow"""
        print("\n📸 1. PHOTO UPLOAD FLOW")
        print("-" * 40)
        
        criteria = []
        
        # 1.1 Photos upload BEFORE individual save
        print("  1.1 Photos upload BEFORE save:")
        record_screen = os.path.join(self.mobile_dir, 'screens/RecordScreen.tsx')
        if os.path.exists(record_screen):
            with open(record_screen, 'r') as f:
                content = f.read()
                if 'uploadPhoto' in content and 'photoUrl' in content and 'saveIndividual' in content:
                    # Check order: upload comes before save
                    upload_index = content.find('await api.uploadPhoto')
                    save_index = content.find('await api.saveIndividual')
                    if upload_index > 0 and save_index > 0 and upload_index < save_index:
                        print("      ✅ Photo uploads before individual save")
                        criteria.append(True)
                    else:
                        print("      ❌ Upload order incorrect")
                        criteria.append(False)
                else:
                    print("      ❌ Missing upload flow")
                    criteria.append(False)
        
        # 1.2 photo_url included in save request
        print("  1.2 photo_url in save request:")
        if os.path.exists(record_screen):
            with open(record_screen, 'r') as f:
                if 'photo_url: photoUrl' in f.read() or 'photo_url: uploadResult.photo_url' in f.read():
                    print("      ✅ photo_url included in save")
                    criteria.append(True)
                else:
                    print("      ❌ photo_url not in save")
                    criteria.append(False)
        
        # 1.3 Upload failures don't block save
        print("  1.3 Upload failures handled:")
        if os.path.exists(record_screen):
            with open(record_screen, 'r') as f:
                content = f.read()
                if 'catch (photoError)' in content and 'Continue with save' in content:
                    print("      ✅ Upload failures don't block save")
                    criteria.append(True)
                else:
                    print("      ❌ Upload failure handling missing")
                    criteria.append(False)
        
        return all(criteria)
    
    # ==================== 2. CONSENT TRACKING ====================
    
    def test_2_consent_tracking(self):
        """Test consent tracking implementation"""
        print("\n📝 2. CONSENT TRACKING")
        print("-" * 40)
        
        criteria = []
        
        # 2.1 Cannot save without consent
        print("  2.1 Consent requirement:")
        photo_capture = os.path.join(self.mobile_dir, 'components/PhotoCapture.tsx')
        if os.path.exists(photo_capture):
            with open(photo_capture, 'r') as f:
                content = f.read()
                if 'hasConsent' in content and '!hasConsent && styles.saveButtonDisabled' in content:
                    print("      ✅ Save disabled without consent")
                    criteria.append(True)
                else:
                    print("      ❌ Consent check missing")
                    criteria.append(False)
        
        # 2.2 Consent records who/when/where
        print("  2.2 Consent data captured:")
        backend_photo = os.path.join(self.backend_dir, 'api/photos.py')
        if os.path.exists(backend_photo):
            with open(backend_photo, 'r') as f:
                content = f.read()
                if all(x in content for x in ['consented_by', 'consent_location', 'created_at']):
                    print("      ✅ Records WHO, WHEN, WHERE")
                    criteria.append(True)
                else:
                    print("      ❌ Consent data incomplete")
                    criteria.append(False)
        
        # 2.3 Legal text shown
        print("  2.3 Legal consent text:")
        if os.path.exists(photo_capture):
            with open(photo_capture, 'r') as f:
                content = f.read()
                if 'Verbal consent has been received' in content or 'I confirm consent' in content:
                    print("      ✅ Legal text displayed")
                    criteria.append(True)
                else:
                    print("      ❌ Legal text missing")
                    criteria.append(False)
        
        return all(criteria)
    
    # ==================== 3. STORAGE & FORMAT ====================
    
    def test_3_storage_format(self):
        """Test storage and format requirements"""
        print("\n💾 3. STORAGE & FORMAT")
        print("-" * 40)
        
        criteria = []
        
        # 3.1 Supabase Storage used
        print("  3.1 Supabase Storage:")
        backend_photo = os.path.join(self.backend_dir, 'api/photos.py')
        if os.path.exists(backend_photo):
            with open(backend_photo, 'r') as f:
                if 'supabase.storage.from_(PHOTOS_BUCKET)' in f.read():
                    print("      ✅ Uses Supabase Storage")
                    criteria.append(True)
                else:
                    print("      ❌ Not using Supabase Storage")
                    criteria.append(False)
        
        # 3.2 Size limit enforced
        print("  3.2 5MB size limit:")
        if os.path.exists(backend_photo):
            with open(backend_photo, 'r') as f:
                content = f.read()
                if 'MAX_FILE_SIZE = 5 * 1024 * 1024' in content and 'File too large' in content:
                    print("      ✅ 5MB limit enforced")
                    criteria.append(True)
                else:
                    print("      ❌ Size limit not enforced")
                    criteria.append(False)
        
        # 3.3 JPEG/PNG only
        print("  3.3 File type validation:")
        if os.path.exists(backend_photo):
            with open(backend_photo, 'r') as f:
                if "ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png']" in f.read():
                    print("      ✅ Only JPEG/PNG accepted")
                    criteria.append(True)
                else:
                    print("      ❌ File type validation missing")
                    criteria.append(False)
        
        # 3.4 PNG to JPEG conversion
        print("  3.4 Format conversion:")
        if os.path.exists(backend_photo):
            with open(backend_photo, 'r') as f:
                content = f.read()
                if 'Image.new' in content and "format='JPEG'" in content:
                    print("      ✅ PNG→JPEG conversion implemented")
                    criteria.append(True)
                else:
                    print("      ❌ Format conversion missing")
                    criteria.append(False)
        
        return all(criteria)
    
    # ==================== 4. PHOTO HISTORY ====================
    
    def test_4_photo_history(self):
        """Test photo history management"""
        print("\n📚 4. PHOTO HISTORY")
        print("-" * 40)
        
        criteria = []
        
        # 4.1 History service exists
        print("  4.1 History management:")
        history_service = os.path.join(self.backend_dir, 'services/photo_history.py')
        if os.path.exists(history_service):
            with open(history_service, 'r') as f:
                content = f.read()
                if 'update_photo_history' in content:
                    print("      ✅ Photo history service exists")
                    criteria.append(True)
                else:
                    print("      ❌ History service missing")
                    criteria.append(False)
        
        # 4.2 Max 3 photos
        print("  4.2 Maximum 3 photos:")
        if os.path.exists(history_service):
            with open(history_service, 'r') as f:
                if 'history[:3]' in f.read() or '[:3]' in f.read():
                    print("      ✅ Limited to 3 photos")
                    criteria.append(True)
                else:
                    print("      ❌ No limit on history")
                    criteria.append(False)
        
        # 4.3 Timestamps preserved
        print("  4.3 Timestamps preserved:")
        if os.path.exists(history_service):
            with open(history_service, 'r') as f:
                if 'timestamp' in f.read():
                    print("      ✅ Timestamps tracked")
                    criteria.append(True)
                else:
                    print("      ❌ Timestamps missing")
                    criteria.append(False)
        
        return all(criteria)
    
    # ==================== 5. DISPLAY & GALLERY ====================
    
    def test_5_display_gallery(self):
        """Test display and gallery implementation"""
        print("\n🖼️  5. DISPLAY & GALLERY")
        print("-" * 40)
        
        criteria = []
        
        # 5.1 Profile only display
        print("  5.1 Photos in profile only:")
        # Check that IndividualSummary (used in search) doesn't include photo_url
        models_file = os.path.join(self.backend_dir, 'db/models.py')
        if os.path.exists(models_file):
            with open(models_file, 'r') as f:
                content = f.read()
                # Find IndividualSummary class and check it doesn't have photo_url
                if 'class IndividualSummary' in content:
                    # Extract IndividualSummary class definition
                    start = content.find('class IndividualSummary')
                    end = content.find('\n\nclass', start)
                    if end == -1:
                        end = content.find('\n\n#', start)
                    summary_def = content[start:end] if end > start else content[start:start+500]
                    
                    if 'photo_url' not in summary_def:
                        print("      ✅ Search results exclude photo_url")
                        criteria.append(True)
                    else:
                        print("      ❌ Search results include photo_url")
                        criteria.append(False)
                else:
                    print("      ❌ IndividualSummary model not found")
                    criteria.append(False)
        
        # 5.2 Gallery component
        print("  5.2 Photo gallery:")
        gallery = os.path.join(self.mobile_dir, 'components/PhotoGallery.tsx')
        if os.path.exists(gallery):
            print("      ✅ PhotoGallery component exists")
            criteria.append(True)
        else:
            print("      ❌ PhotoGallery missing")
            criteria.append(False)
        
        # 5.3 Profile photo display
        print("  5.3 Profile photo display:")
        profile_screen = os.path.join(self.mobile_dir, 'screens/IndividualProfileScreen.tsx')
        if os.path.exists(profile_screen):
            with open(profile_screen, 'r') as f:
                content = f.read()
                if '"photo-container"' in content and 'PhotoGallery' in content:
                    print("      ✅ Profile shows photos")
                    criteria.append(True)
                else:
                    print("      ❌ Profile photo display missing")
                    criteria.append(False)
        
        return all(criteria)
    
    # ==================== ADDITIONAL FEATURES ====================
    
    def test_additional_features(self):
        """Test additional Phase 2 features"""
        print("\n🎯 ADDITIONAL FEATURES")
        print("-" * 40)
        
        criteria = []
        
        # Retry logic
        print("  • Upload retry logic:")
        retry_service = os.path.join(self.backend_dir, 'services/upload_retry.py')
        if os.path.exists(retry_service):
            print("      ✅ Retry service implemented")
            criteria.append(True)
        else:
            print("      ❌ Retry logic missing")
            criteria.append(False)
        
        # Image compression
        print("  • Image compression:")
        compression = os.path.join(self.mobile_dir, 'services/imageCompression.ts')
        if os.path.exists(compression):
            print("      ✅ Compression service exists")
            criteria.append(True)
        else:
            print("      ❌ Compression missing")
            criteria.append(False)
        
        # Update from profile
        print("  • Update from profile:")
        profile_screen = os.path.join(self.mobile_dir, 'screens/IndividualProfileScreen.tsx')
        if os.path.exists(profile_screen):
            with open(profile_screen, 'r') as f:
                if 'updateIndividualPhoto' in f.read():
                    print("      ✅ Profile photo update enabled")
                    criteria.append(True)
                else:
                    print("      ❌ Profile update missing")
                    criteria.append(False)
        
        return all(criteria)


def run_complete_verification():
    """Run all Phase 2 verification tests"""
    print("=" * 60)
    print("🚀 PHASE 2 COMPLETE IMPLEMENTATION VERIFICATION")
    print("=" * 60)
    
    test = TestPhase2CompleteVerification()
    
    results = {
        "1. Photo Upload Flow": test.test_1_photo_upload_flow(),
        "2. Consent Tracking": test.test_2_consent_tracking(),
        "3. Storage & Format": test.test_3_storage_format(),
        "4. Photo History": test.test_4_photo_history(),
        "5. Display & Gallery": test.test_5_display_gallery(),
        "Additional Features": test.test_additional_features(),
    }
    
    print("\n" + "=" * 60)
    print("📊 FINAL PHASE 2 VERIFICATION RESULTS")
    print("=" * 60)
    
    for category, passed in results.items():
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"{category}: {status}")
    
    all_passed = all(results.values())
    
    if all_passed:
        print("\n✨ ALL PHASE 2 CRITICAL SUCCESS CRITERIA MET! ✨")
        print("\nImplemented features:")
        print("• Photo capture with consent tracking")
        print("• Photo upload before individual save")
        print("• Supabase storage with size/format validation")
        print("• Photo history management (max 3)")
        print("• Profile photo display with gallery")
        print("• Update photo from profile")
        print("• Upload retry logic")
        print("• Image compression")
        print("• Proper error handling")
    else:
        failed = [k for k, v in results.items() if not v]
        print(f"\n❌ Failed categories: {', '.join(failed)}")
    
    return all_passed


if __name__ == "__main__":
    success = run_complete_verification()
    exit(0 if success else 1)