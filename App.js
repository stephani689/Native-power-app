import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  Image, 
  TouchableOpacity, 
  Alert, 
  ActivityIndicator,
  Linking,
  ScrollView,
  StatusBar
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function App() {
  const [imageUri, setImageUri] = useState(null);
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(false);

  // Ambil data dari AsyncStorage saat aplikasi pertama kali dibuka (Persistensi)
  useEffect(() => {
    loadSavedData();
  }, []);

  const loadSavedData = async () => {
    try {
      const savedPhoto = await AsyncStorage.getItem('@user_photo');
      const savedLocation = await AsyncStorage.getItem('@user_location');
      
      if (savedPhoto) setImageUri(savedPhoto);
      if (savedLocation) setLocation(JSON.parse(savedLocation));
    } catch (error) {
      Alert.alert("Error", "Gagal memuat data pencatatan sebelumnya.");
    }
  };

  // Fungsi untuk meminta izin dan membuka Kamera / Galeri
  const handleSelectImage = () => {
    Alert.alert(
      "Pilih Sumber Foto",
      "Silakan pilih untuk mengambil foto baru atau dari galeri.",
      [
        { text: "Kamera", onPress: openCamera },
        { text: "Galeri", onPress: openLibrary },
        { text: "Batal", style: "cancel" }
      ]
    );
  };

  // 1. Logika Kamera + Permission Flow
  const openCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert(
        "Izin Ditolak", 
        "Aplikasi butuh izin kamera. Buka pengaturan untuk mengaktifkan?",
        [
          { text: "Batal", style: "cancel" },
          { text: "Buka Pengaturan", onPress: () => Linking.openSettings() } // Level 2: Tombol Settings
        ]
      );
      return;
    }

    let result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled) {
      const uri = result.assets[0].uri;
      setImageUri(uri);
      await AsyncStorage.setItem('@user_photo', uri);
      // Setiap kali ambil foto, otomatis perbarui lokasi juga (Gabungan Fitur)
      await getGeoLocation();
    }
  };

  // 2. Logika Galeri + Permission Flow
  const openLibrary = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert("Izin Ditolak", "Aplikasi membutuhkan izin galeri foto.");
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled) {
      const uri = result.assets[0].uri;
      setImageUri(uri);
      await AsyncStorage.setItem('@user_photo', uri);
      await getGeoLocation();
    }
  };

  // 3. Logika GPS Lokasi + Permission Flow
  const getGeoLocation = async () => {
    setLoading(true);
    const { status } = await Location.requestForegroundPermissionsAsync();

    if (status !== 'granted') {
      Alert.alert("Izin GPS Ditolak", "Gagal mendapatkan koordinat karena tidak ada izin.");
      setLoading(false);
      return;
    }

    try {
      let loc = await Location.getCurrentPositionAsync({});
      const coords = {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude
      };
      setLocation(coords);
      await AsyncStorage.setItem('@user_location', JSON.stringify(coords));
    } catch (error) {
      Alert.alert("Error GPS", "Gagal mengunci lokasi kamu. Pastikan GPS HP aktif.");
    } finally {
      setLoading(false);
    }
  };

  // 4. Buka di Google Maps via Linking (Level 2)
  const openInMaps = () => {
    if (!location) return;
    const url = `https://www.google.com/maps/search/?api=1&query=${location.latitude},${location.longitude}`;
    Linking.openURL(url);
  };

  // 5. Reset Data (Tantangan Bonus Level 3)
  const handleReset = async () => {
    setImageUri(null);
    setLocation(null);
    await AsyncStorage.clear();
    Alert.alert("Sukses", "Data portfolio telah direset!");
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#4F46E5" />

      {/* Header gelap dengan aksen warna, jadi ada "brand" di paling atas */}
      <View style={styles.header}>
        <Text style={styles.headerEyebrow}>PORTOFOLIO SISTEM INFORMASI</Text>
        <Text style={styles.headerTitle}>Native Power App</Text>
        <Text style={styles.headerSubtitle}>Check-in foto & lokasi dalam satu tap</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Kartu Foto */}
        <View style={styles.card}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.imagePreview} />
          ) : (
            <View style={[styles.imagePreview, styles.placeholder]}>
              <Text style={styles.placeholderIcon}>🖼️</Text>
              <Text style={styles.placeholderText}>Belum ada foto</Text>
            </View>
          )}

          <View style={styles.statusPill}>
            <View
              style={[
                styles.statusDot,
                { backgroundColor: imageUri ? '#22C55E' : '#CBD5E1' },
              ]}
            />
            <Text style={styles.statusPillText}>
              {imageUri ? 'Foto tersimpan' : 'Menunggu foto'}
            </Text>
          </View>
        </View>

        {/* Kartu Lokasi */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>LOKASI TERKINI</Text>

          {loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="small" color="#4F46E5" />
              <Text style={styles.loadingText}>Mengunci lokasi kamu...</Text>
            </View>
          ) : location ? (
            <View>
              <View style={styles.coordRow}>
                <Text style={styles.coordLabel}>Latitude</Text>
                <Text style={styles.coordValue}>{location.latitude.toFixed(6)}</Text>
              </View>
              <View style={styles.coordRow}>
                <Text style={styles.coordLabel}>Longitude</Text>
                <Text style={styles.coordValue}>{location.longitude.toFixed(6)}</Text>
              </View>

              <TouchableOpacity style={styles.btnMaps} onPress={openInMaps} activeOpacity={0.8}>
                <Text style={styles.btnMapsText}>📍 Lihat di Google Maps</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <Text style={styles.emptyLocationText}>
              Lokasi akan otomatis terekam saat kamu check-in.
            </Text>
          )}
        </View>

        {/* Tombol Utama */}
        <TouchableOpacity
          style={styles.btnPrimary}
          onPress={handleSelectImage}
          activeOpacity={0.85}
        >
          <Text style={styles.btnPrimaryText}>📸  Check-In Sekarang</Text>
        </TouchableOpacity>

        {/* Tombol Reset */}
        {(imageUri || location) && (
          <TouchableOpacity style={styles.btnReset} onPress={handleReset} activeOpacity={0.7}>
            <Text style={styles.btnResetText}>Hapus Data / Reset</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F1F5F9',
  },
  header: {
    backgroundColor: '#4F46E5',
    paddingTop: 60,
    paddingBottom: 28,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  headerEyebrow: {
    color: '#C7D2FE',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '800',
  },
  headerSubtitle: {
    color: '#E0E7FF',
    fontSize: 13,
    marginTop: 4,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  cardLabel: {
    alignSelf: 'flex-start',
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  imagePreview: {
    width: '100%',
    height: 240,
    borderRadius: 14,
  },
  placeholder: {
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
  },
  placeholderIcon: {
    fontSize: 32,
    marginBottom: 6,
  },
  placeholderText: {
    color: '#94A3B8',
    fontWeight: '600',
    fontSize: 13,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginTop: 14,
    backgroundColor: '#F8FAFC',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 7,
  },
  statusPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  loadingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  loadingText: {
    marginLeft: 10,
    fontSize: 13,
    color: '#64748B',
  },
  coordRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    width: '100%',
  },
  coordLabel: {
    fontSize: 13,
    color: '#94A3B8',
    fontWeight: '600',
  },
  coordValue: {
    fontSize: 13,
    color: '#1E293B',
    fontFamily: 'monospace',
    fontWeight: '600',
  },
  emptyLocationText: {
    fontSize: 13,
    color: '#94A3B8',
    lineHeight: 19,
  },
  btnMaps: {
    marginTop: 14,
    backgroundColor: '#EEF2FF',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    width: '100%',
  },
  btnMapsText: {
    color: '#4F46E5',
    fontSize: 13,
    fontWeight: '700',
  },
  btnPrimary: {
    backgroundColor: '#4F46E5',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  btnPrimaryText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  btnReset: {
    marginTop: 16,
    paddingVertical: 8,
    alignItems: 'center',
  },
  btnResetText: {
    color: '#EF4444',
    fontSize: 13,
    fontWeight: '600',
  },
});