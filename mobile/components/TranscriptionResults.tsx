import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import Toast from 'react-native-toast-message';
import { TranscriptionResult, api } from '../services/api';
import { MergeUI } from './MergeUI';
import PhotoUploadModal from './PhotoUploadModal';

interface TranscriptionResultsProps {
  result: TranscriptionResult;
  onSave: (data: Record<string, any>) => void;
  onCancel: () => void;
}

export const TranscriptionResults: React.FC<TranscriptionResultsProps> = ({
  result,
  onSave,
  onCancel,
}) => {
  const [categorizedData, setCategorizedData] = useState<Record<string, any>>(result.categorized_data);
  const [isEditing, setIsEditing] = useState(false);
  const [showMergeUI, setShowMergeUI] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<{
    id: string;
    confidence: number;
    name: string;
  } | null>(null);
  const [showPhotoUpload, setShowPhotoUpload] = useState(false);
  const [uploadedPhotoUri, setUploadedPhotoUri] = useState<string | null>(null);

  const handleFieldChange = (fieldName: string, value: any) => {
    setCategorizedData(prev => ({
      ...prev,
      [fieldName]: value,
    }));
  };

  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    // Show photo upload modal first
    setShowPhotoUpload(true);
  };

  const handleMerge = async (mergedData: Record<string, any>) => {
    try {
      // Include transcription and location data for interaction record
      const dataWithContext = {
        ...mergedData,
        transcription: result.transcription,
        location: result.location,
      };
      await api.saveIndividual(dataWithContext);
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Data merged successfully!'
      });
      setShowMergeUI(false);
      setSelectedMatch(null);
      onSave(dataWithContext);
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message
      });
    }
  };

  const handleCreateNew = async (data: Record<string, any>) => {
    try {
      // Include transcription and location data for interaction record
      const dataWithContext = {
        ...data,
        transcription: result.transcription,
        location: result.location,
      };
      await api.saveIndividual(dataWithContext);
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'New individual created successfully!'
      });
      setShowMergeUI(false);
      setSelectedMatch(null);
      onSave(dataWithContext);
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message
      });
    }
  };

  const handleMergeCancel = () => {
    setShowMergeUI(false);
    setSelectedMatch(null);
  };

  const handlePhotoUploaded = (photoUri: string | null) => {
    setUploadedPhotoUri(photoUri);
    setShowPhotoUpload(false);
    
    // Continue with the save process after photo upload
    if (photoUri) {
      console.log('📸 Photo uploaded:', photoUri);
    } else {
      console.log('📸 No photo uploaded');
    }
    
    // Proceed with the original save logic
    proceedWithSave();
  };

  const proceedWithSave = async () => {
    if (isSaving) return;
    
    // Validate required fields
    const missingFields = result.missing_required.filter(field => 
      !categorizedData[field] || categorizedData[field] === ''
    );

    if (missingFields.length > 0) {
      Alert.alert(
        'Missing Required Fields',
        `Please fill in: ${missingFields.join(', ')}`,
        [{ text: 'OK' }]
      );
      return;
    }

    setIsSaving(true);

    try {
      // Check for potential matches with updated confidence thresholds
      const highConfidenceMatch = result.potential_matches?.find(match => match.confidence >= 95);
      const mediumConfidenceMatch = result.potential_matches?.find(match => match.confidence >= 60 && match.confidence < 95);
      const lowConfidenceMatch = result.potential_matches?.find(match => match.confidence < 60);

      // Photo matching logic
      if (uploadedPhotoUri && (highConfidenceMatch || mediumConfidenceMatch)) {
        const matchToCheck = highConfidenceMatch || mediumConfidenceMatch;
        
        // Check if the matched individual already has a photo
        const matchedIndividual = await api.getIndividualProfile(matchToCheck.id);
        
        if (matchedIndividual?.photo_url) {
          // Show photo comparison dialog
          Alert.alert(
            'Photo Comparison',
            `The matched individual (${matchToCheck.name}) already has a photo. Would you like to compare photos to verify it's the same person?`,
            [
              { text: 'Skip Photo Check', style: 'cancel', onPress: () => proceedWithMatch(matchToCheck) },
              { 
                text: 'Compare Photos', 
                onPress: () => {
                  // TODO: Implement photo comparison UI
                  Alert.alert(
                    'Photo Comparison',
                    'Photo comparison feature will be implemented in the next version. Proceeding with match.',
                    [{ text: 'OK', onPress: () => proceedWithMatch(matchToCheck) }]
                  );
                }
              }
            ]
          );
          return;
        } else {
          // No existing photo, allow street team to evaluate
          Alert.alert(
            'Photo Evaluation',
            `The matched individual (${matchToCheck.name}) doesn't have a photo. You can upload this photo to help with future identification.`,
            [
              { text: 'Skip Photo', style: 'cancel', onPress: () => proceedWithMatch(matchToCheck) },
              { 
                text: 'Upload Photo', 
                onPress: () => proceedWithMatch(matchToCheck, uploadedPhotoUri)
              }
            ]
          );
          return;
        }
      }

      // No photo or no match, proceed normally
      if (highConfidenceMatch) {
        proceedWithMatch(highConfidenceMatch);
      } else if (mediumConfidenceMatch) {
        setSelectedMatch(mediumConfidenceMatch);
        setShowMergeUI(true);
        setIsSaving(false);
      } else {
        // No meaningful match, save as new
        const saveData = {
          ...categorizedData,
          transcription: result.transcription,
          location: result.location,
          photo_uri: uploadedPhotoUri
        };
        await api.saveIndividual(saveData);
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'New individual saved successfully!'
        });
        onSave(saveData);
      }
    } catch (error) {
      Alert.alert('Error', error.message);
      setIsSaving(false);
    }
  };

  const proceedWithMatch = async (match: any, photoUri?: string | null) => {
    try {
      const mergedData = { 
        ...categorizedData, 
        existing_individual_id: match.id,
        photo_uri: photoUri || uploadedPhotoUri
      };
      await api.saveIndividual(mergedData);
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Data merged successfully!'
      });
      onSave(mergedData);
    } catch (error) {
      Alert.alert('Error', error.message);
      setIsSaving(false);
    }
  };

  const isFieldRequired = (fieldName: string) => {
    return result.missing_required.includes(fieldName);
  };

  const isFieldMissing = (fieldName: string) => {
    return isFieldRequired(fieldName) && (!categorizedData[fieldName] || categorizedData[fieldName] === '');
  };

  const renderField = (fieldName: string, value: any) => {
    const isRequired = isFieldRequired(fieldName);
    const isMissing = isFieldMissing(fieldName);

    return (
      <View key={fieldName} style={styles.fieldContainer}>
        <Text style={[
          styles.fieldLabel,
          isRequired && styles.requiredLabel,
          isMissing && styles.missingLabel
        ]}>
          {fieldName.charAt(0).toUpperCase() + fieldName.slice(1).replace(/_/g, ' ')}
          {isRequired && ' *'}
        </Text>
        <TextInput
          style={[
            styles.fieldInput,
            isMissing && styles.missingInput
          ]}
          value={String(value || '')}
          onChangeText={(text) => handleFieldChange(fieldName, text)}
          placeholder={`Enter ${fieldName.replace(/_/g, ' ')}`}
          placeholderTextColor="#999"
        />
        {isMissing && (
          <Text style={styles.errorText}>This field is required</Text>
        )}
      </View>
    );
  };

  // Show MergeUI if there's a low confidence match
  if (showMergeUI && selectedMatch) {
    return (
      <MergeUI
        newData={categorizedData}
        potentialMatch={selectedMatch}
        onMerge={handleMerge}
        onCreateNew={handleCreateNew}
        onCancel={handleMergeCancel}
      />
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Transcription Text */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Transcription</Text>
        <View style={styles.transcriptionContainer}>
          <Text style={styles.transcriptionText}>{result.transcription}</Text>
        </View>
      </View>

      {/* Categorized Data */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Categorized Information</Text>
        <Text style={styles.sectionSubtitle}>
          Review and edit the information extracted from your recording
        </Text>
        
        {Object.entries(categorizedData).map(([fieldName, value]) => 
          renderField(fieldName, value)
        )}

        {/* Add missing required fields */}
        {result.missing_required
          .filter(field => !categorizedData[field])
          .map(fieldName => renderField(fieldName, ''))
        }
      </View>

      {/* Potential Matches */}
      {result.potential_matches && result.potential_matches.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Potential Matches</Text>
          <Text style={styles.sectionSubtitle}>
            We found similar individuals in our database
          </Text>
          {result.potential_matches.map((match, index) => (
            <View key={index} style={[
              styles.matchContainer,
              match.confidence >= 95 && styles.highConfidenceMatch,
              match.confidence >= 60 && match.confidence < 95 && styles.mediumConfidenceMatch,
              match.confidence < 60 && styles.lowConfidenceMatch
            ]}>
              <Text style={styles.matchName}>{match.name}</Text>
              <Text style={[
                styles.matchConfidence,
                match.confidence >= 95 && styles.highConfidenceText,
                match.confidence >= 60 && match.confidence < 95 && styles.mediumConfidenceText,
                match.confidence < 60 && styles.lowConfidenceText
              ]}>
                {match.confidence}% match
                {match.confidence >= 95 ? ' (Streamlined confirmation)' : 
                 match.confidence >= 60 ? ' (Manual review)' : 
                 ' (Too low - no merge UI)'}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.saveButton, isSaving && styles.saveButtonDisabled]} 
          onPress={handleSave}
          disabled={isSaving}
        >
          <Text style={styles.saveButtonText}>
            {isSaving ? 'Saving...' : 'Save'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Photo Upload Modal */}
      <PhotoUploadModal
        visible={showPhotoUpload}
        onClose={() => setShowPhotoUpload(false)}
        onPhotoUploaded={handlePhotoUploaded}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  transcriptionContainer: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  transcriptionText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
  },
  fieldContainer: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  requiredLabel: {
    color: '#dc3545',
  },
  missingLabel: {
    color: '#dc3545',
  },
  fieldInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  missingInput: {
    borderColor: '#dc3545',
    backgroundColor: '#fff5f5',
  },
  errorText: {
    color: '#dc3545',
    fontSize: 12,
    marginTop: 4,
  },
  matchContainer: {
    backgroundColor: '#fff3cd',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#ffc107',
  },
  matchName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#856404',
  },
  matchConfidence: {
    fontSize: 14,
    color: '#856404',
    marginTop: 4,
  },
  highConfidenceMatch: {
    backgroundColor: '#d4edda',
    borderLeftColor: '#28a745',
  },
  mediumConfidenceMatch: {
    backgroundColor: '#fff3cd',
    borderLeftColor: '#ffc107',
  },
  lowConfidenceMatch: {
    backgroundColor: '#f8d7da',
    borderLeftColor: '#dc3545',
  },
  highConfidenceText: {
    color: '#155724',
  },
  mediumConfidenceText: {
    color: '#856404',
  },
  lowConfidenceText: {
    color: '#721c24',
  },
  buttonContainer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#6c757d',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#6c757d',
    opacity: 0.6,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
}); 