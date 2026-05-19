import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  Alert, StyleSheet, Platform, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';
import { useAuthStore } from '@/store/authStore';
import authService from '@/services/auth.service';

export default function ResubmitDocsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const setUser = useAuthStore((s) => s.setUser);

  const [cnicFront, setCnicFront] = useState<string | null>(null);
  const [cnicBack, setCnicBack] = useState<string | null>(null);
  const [landDoc, setLandDoc] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const pickImage = async (setter: (uri: string) => void) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your photo library');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.7,
    });

    if (!result.canceled) {
      const asset = result.assets[0];
      const mimeType = asset.mimeType || 'image/jpeg';

      let base64Uri: string;
      if (Platform.OS === 'web') {
        const response = await fetch(asset.uri);
        const blob = await response.blob();
        base64Uri = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });
      } else {
        const b64 = await FileSystem.readAsStringAsync(asset.uri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        base64Uri = `data:${mimeType};base64,${b64}`;
      }

      setter(base64Uri);
    }
  };

  const handleSubmit = async () => {
    if (!cnicFront || !cnicBack) {
      Alert.alert('Required', 'Please upload both CNIC front and back photos');
      return;
    }

    setSubmitting(true);
    try {
      await authService.resubmitDocs({
        cnicFront,
        cnicBack,
        ...(landDoc ? { landDoc } : {}),
      });

      const freshUser = await authService.me();
      setUser(freshUser);

      Alert.alert(
        'Submitted!',
        'Your documents have been submitted for review. You will be notified once approved.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Submission failed. Please try again.';
      Alert.alert('Error', msg);
    } finally {
      setSubmitting(false);
    }
  };

  const DocTile = ({
    label,
    value,
    onPress,
    required,
  }: {
    label: string;
    value: string | null;
    onPress: () => void;
    required?: boolean;
  }) => (
    <View style={styles.tileWrapper}>
      <Text style={styles.tileLabel}>
        {label}{required ? <Text style={{ color: Colors.error }}> *</Text> : null}
      </Text>
      <TouchableOpacity onPress={onPress} style={[styles.tile, value ? styles.tileUploaded : null]}>
        <Feather
          name={value ? 'check-circle' : 'camera'}
          size={24}
          color={value ? Colors.primary : Colors.textSecondary}
        />
        <Text style={[styles.tileText, value ? { color: Colors.primary } : null]}>
          {value ? 'Photo Uploaded ✓' : 'Tap to Upload'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#F8FAFB' }}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Feather name="arrow-left" size={20} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Re-submit Documents</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.subtitle}>
          Please upload clear, readable photos of your documents. Your account will be reviewed within 24–48 hours.
        </Text>

        <DocTile label="CNIC Front" value={cnicFront} onPress={() => pickImage(setCnicFront)} required />
        <DocTile label="CNIC Back" value={cnicBack} onPress={() => pickImage(setCnicBack)} required />
        <DocTile label="Land Ownership Document" value={landDoc} onPress={() => pickImage(setLandDoc)} />

        <TouchableOpacity
          style={[styles.submitBtn, submitting ? { opacity: 0.7 } : null]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitBtnText}>Submit for Review</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    gap: 14,
  },
  backBtn: {
    width: 40, height: 40,
    borderRadius: 12,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  content: {
    padding: 24,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 24,
    lineHeight: 20,
  },
  tileWrapper: {
    marginBottom: 20,
  },
  tileLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  tile: {
    height: 96,
    borderRadius: 14,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#d1d5db',
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  tileUploaded: {
    borderColor: Colors.primary,
    backgroundColor: '#f0fdf4',
  },
  tileText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  submitBtn: {
    marginTop: 16,
    backgroundColor: Colors.primary,
    borderRadius: 14,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
