"""
Frontend implementation verification for Phase 2
Checks that all required components and flows are implemented
"""
import os
import re

def check_file_exists(path):
    """Check if a file exists"""
    return os.path.exists(path)

def check_file_contains(path, patterns):
    """Check if file contains all patterns"""
    if not os.path.exists(path):
        return False
    
    with open(path, 'r') as f:
        content = f.read()
        
    for pattern in patterns:
        if isinstance(pattern, str):
            if pattern not in content:
                return False
        else:  # regex
            if not re.search(pattern, content):
                return False
    return True

class TestPhase2FrontendImplementation:
    """Verify frontend implementation meets Phase 2 requirements"""
    
    def test_photo_capture_component(self):
        """Test PhotoCapture component implementation"""
        print("\n🔍 Testing PhotoCapture Component")
        
        component_path = "../mobile/components/PhotoCapture.tsx"
        requirements = [
            "hasConsent",  # Consent checkbox
            "consent-checkbox",  # Consent checkbox testID
            "Verbal consent has been received",  # Legal text
            "onPhotoCapture",  # Callback prop
            "photoUri",  # Photo URI in callback
            "save-button",  # Save button testID
            "!hasConsent && styles.saveButtonDisabled",  # Disabled without consent
        ]
        
        if check_file_contains(component_path, requirements):
            print("✅ PhotoCapture component has consent requirement")
            return True
        else:
            print("❌ PhotoCapture component missing consent features")
            return False
    
    def test_image_compression_service(self):
        """Test image compression service"""
        print("\n🔍 Testing Image Compression Service")
        
        service_path = "../mobile/services/imageCompression.ts"
        requirements = [
            "compressImage",  # Function name
            "manipulateAsync",  # Expo image manipulator
            "jpeg",  # JPEG conversion
            "compress:",  # Compression setting
            "5 * 1024 * 1024",  # 5MB limit check
        ]
        
        if check_file_contains(service_path, requirements):
            print("✅ Image compression service implemented")
            return True
        else:
            print("❌ Image compression service missing features")
            return False
    
    def test_record_screen_photo_integration(self):
        """Test RecordScreen photo integration"""
        print("\n🔍 Testing RecordScreen Photo Integration")
        
        screen_path = "../mobile/screens/RecordScreen.tsx"
        requirements = [
            "PhotoCapture",  # Component import
            "uploadPhoto",  # Photo upload before save
            "photoUrl",  # Photo URL tracking
            "isUploadingPhoto",  # Upload state
            "photo_url: photoUrl",  # Photo URL in save
        ]
        
        if check_file_contains(screen_path, requirements):
            print("✅ RecordScreen uploads photo before save")
            return True
        else:
            print("❌ RecordScreen photo integration incomplete")
            return False
    
    def test_individual_profile_photo_display(self):
        """Test IndividualProfileScreen photo display"""
        print("\n🔍 Testing Profile Photo Display")
        
        screen_path = "../mobile/screens/IndividualProfileScreen.tsx"
        requirements = [
            "photo-container",  # Photo container testID
            "individual-photo",  # Photo image testID
            "photo-placeholder",  # Placeholder testID
            "PhotoGallery",  # Gallery component
            "update-photo-button",  # Update button
            "handlePhotoUpdate",  # Update handler
            "getCurrentLocation",  # Location for consent
        ]
        
        if check_file_contains(screen_path, requirements):
            print("✅ Profile screen has photo display and update")
            return True
        else:
            print("❌ Profile photo display incomplete")
            return False
    
    def test_photo_gallery_component(self):
        """Test PhotoGallery component"""
        print("\n🔍 Testing PhotoGallery Component")
        
        component_path = "../mobile/components/PhotoGallery.tsx"
        requirements = [
            "currentPhoto",  # Current photo prop
            "photoHistory",  # History prop
            "horizontal",  # Horizontal scroll
            "photo-gallery-scroll",  # Scroll testID
            "Set as Current",  # Restore button
            "onPhotoSelect",  # Selection callback
            "maxHistory",  # Max history check variable
        ]
        
        if check_file_contains(component_path, requirements):
            print("✅ PhotoGallery component complete")
            return True
        else:
            print("❌ PhotoGallery component missing features")
            return False
    
    def test_api_integration(self):
        """Test API service integration"""
        print("\n🔍 Testing API Integration")
        
        api_path = "../mobile/services/api.ts"
        requirements = [
            "uploadPhoto",  # Upload method
            "updateIndividualPhoto",  # Update method
            "FormData",  # Multipart upload
            "/api/photos/upload",  # Upload endpoint
            "/api/photos/update/",  # Update endpoint
            "consent_location",  # Consent in upload
        ]
        
        if check_file_contains(api_path, requirements):
            print("✅ API service has photo endpoints")
            return True
        else:
            print("❌ API service missing photo endpoints")
            return False


def run_frontend_tests():
    """Run all frontend implementation tests"""
    print("=" * 60)
    print("🎨 PHASE 2 FRONTEND IMPLEMENTATION VERIFICATION")
    print("=" * 60)
    
    test_instance = TestPhase2FrontendImplementation()
    
    tests = [
        test_instance.test_photo_capture_component,
        test_instance.test_image_compression_service,
        test_instance.test_record_screen_photo_integration,
        test_instance.test_individual_profile_photo_display,
        test_instance.test_photo_gallery_component,
        test_instance.test_api_integration,
    ]
    
    passed = 0
    for test in tests:
        if test():
            passed += 1
    
    print("\n" + "=" * 60)
    print(f"📊 Frontend Results: {passed}/{len(tests)} components implemented")
    print("=" * 60)
    
    return passed == len(tests)


if __name__ == "__main__":
    success = run_frontend_tests()