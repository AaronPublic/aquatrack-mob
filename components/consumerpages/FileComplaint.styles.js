import { StyleSheet } from 'react-native';
import { theme } from '../../src/config/theme';

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContainer: {
    padding: 16,
    paddingBottom: 110,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  subtitle: {
    fontSize: 12,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  card: {
    backgroundColor: theme.colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 'black',
    color: theme.colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    paddingBottom: 6,
  },
  // Form Fields
  form: {
    gap: 12,
  },
  label: {
    fontSize: 10,
    fontWeight: 'bold',
    color: theme.colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  textArea: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 13,
    color: theme.colors.primary,
    backgroundColor: theme.colors.card,
    height: 80,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    backgroundColor: theme.colors.card,
    height: 44,
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  pickerSelect: {
    color: theme.colors.primary,
    fontSize: 13,
  },
  // Location HUD & Map
  mapContainer: {
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginVertical: 12,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  locationButton: {
    height: 40,
    backgroundColor: theme.colors.primary,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 4,
  },
  locationButtonText: {
    color: theme.colors.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  locationStatus: {
    marginTop: 8,
    padding: 10,
    borderRadius: 8,
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  locationStatusText: {
    fontSize: 11,
    color: theme.colors.primary,
    lineHeight: 16,
  },
  locationStatusLabel: {
    fontWeight: 'bold',
  },
  // Image Upload style
  imagePickerBtn: {
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: theme.colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.infoBg,
  },
  imagePickerText: {
    color: theme.colors.accent,
    fontSize: 12,
    fontWeight: 'bold',
  },
  previewImage: {
    width: '100%',
    height: 180,
    borderRadius: 8,
    resizeMode: 'cover',
    marginTop: 8,
  },
  // AI Diagnostics
  aiCard: {
    backgroundColor: theme.colors.infoBg,
    borderColor: '#bfdbfe',
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  aiTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#1d4ed8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  aiDetailRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  aiDetailLabel: {
    width: 80,
    fontSize: 11,
    fontWeight: 'bold',
    color: '#1e40af',
  },
  aiDetailValue: {
    flex: 1,
    fontSize: 11,
    color: '#1e3a8a',
  },
  // Geofence Out-Of-Scope Alerts
  geofenceWarning: {
    backgroundColor: theme.colors.alertBg,
    borderColor: '#fca5a5',
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginVertical: 8,
  },
  geofenceWarningText: {
    color: theme.colors.alert,
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  // Submit btn
  // Submit Status Indicator
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: theme.colors.infoBg,
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: 10,
    marginTop: 8,
  },
  statusIndicatorText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1d4ed8',
  },
  // Submit Button
  submitBtn: {
    height: 48,
    backgroundColor: theme.colors.primary,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 16,
  },
  submitBtnDisabled: {
    backgroundColor: theme.colors.border,
  },
  submitBtnText: {
    color: theme.colors.white,
    fontSize: 14,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
  }
});
