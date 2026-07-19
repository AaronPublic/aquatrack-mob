import { StyleSheet } from 'react-native';
import { theme } from '../../src/config/theme';

export default StyleSheet.create({
  backgroundImage: {
    flex: 1,
    backgroundColor: '#ffffff02', // Keep background base white
  },
  backgroundImageStyle: {
    opacity: 0.32, // Restored to original opacity
  },
  container: {
    flex: 1,
    backgroundColor: 'transparent', // Transparent container to show background image
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingBottom: 24,
  },
  // 1. Branding Header Panel
  headerPanel: {
    backgroundColor: 'transparent', // Transparent header to show background image
    paddingTop: 36,
    paddingBottom: 12,
    paddingHorizontal: 28,
    alignItems: 'center',
    textAlign: 'center',
  },
  Logo: {
    height: 202,
    width: 220,
    resizeMode: 'contain',
    marginBottom: -30,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.primary,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 9,
    fontWeight: '900',
    color: theme.colors.accent,
    letterSpacing: 1.5,
    marginTop: 1,
    textTransform: 'uppercase',
  },
  supportingText: {
    fontSize: 11,
    color: theme.colors.textMuted,
    textAlign: 'center',
    lineHeight: 16,
    marginTop: 10,
    maxWidth: 280,
  },
  // Form Area Wrapper
  formArea: {
    paddingHorizontal: 20,
    gap: 16,
  },
  // 2. Segmented Authentication Method Selector
  selectorContainer: {
    backgroundColor: '#DFE7F2', // Ice-blue container
    borderRadius: 12,
    padding: 4,
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  selectorButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectorButtonActive: {
    backgroundColor: theme.colors.primary, // Solid dark-blue pill
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  selectorText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#001e6699', // Muted navy text
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  selectorTextActive: {
    color: theme.colors.white, // White text for selected
  },
  // 3. Form Surface (Ice-blue or white)
  formCard: {
    backgroundColor: '#EBF3FC', // Soft ice-blue
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    padding: 20,
    gap: 16,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
  },
  inputGroup: {
    gap: 6,
  },
  label: {
    fontSize: 9,
    fontWeight: '900',
    color: theme.colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  // Input container with left/right icons
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#001e66', // Dark-blue borders
    borderRadius: 10,
    backgroundColor: theme.colors.white,
    height: 50, // Approx 48-52 px
    paddingHorizontal: 12,
  },
  inputField: {
    flex: 1,
    height: '100%',
    color: theme.colors.primary,
    fontSize: 13,
    fontWeight: '600',
    paddingHorizontal: 8,
  },
  leftIconText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: theme.colors.textMuted,
    textTransform: 'uppercase',
    minWidth: 42,
  },
  rightIconText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: theme.colors.textMuted,
    textTransform: 'uppercase',
    paddingHorizontal: 4,
  },
  errorText: {
    color: theme.colors.alert,
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  globalErrorText: {
    color: theme.colors.alert,
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
    backgroundColor: theme.colors.alertBg,
    borderColor: '#fca5a5',
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    lineHeight: 16,
  },
  // 4. Sign-In Button
  submitButton: {
    height: 50, // touch-target height
    backgroundColor: theme.colors.primary, // Dark royal-blue
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
    marginTop: 8,
  },
  submitButtonText: {
    color: theme.colors.white,
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  // Placeholder card for OTP / BILLING ID
  infoCard: {
    backgroundColor: theme.colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    padding: 20,
    alignItems: 'center',
    gap: 8,
  },
  infoCardTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: theme.colors.primary,
    textTransform: 'uppercase',
  },
  infoCardText: {
    fontSize: 11,
    color: theme.colors.textMuted,
    textAlign: 'center',
    lineHeight: 16,
  },
  // 5. Registration Footer
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 30, 102, 0.05)',
    gap: 4,
  },
  footerText: {
    fontSize: 12,
    color: theme.colors.textMuted,
  },
  footerLink: {
    fontSize: 12,
    fontWeight: 'bold',
    color: theme.colors.accent,
  },
  qrScanButton: {
    height: 50,
    backgroundColor: theme.colors.accent, // Azure blue
    borderRadius: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrScanButtonText: {
    color: theme.colors.white,
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  billingGuideBox: {
    height: 50,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  billingGuideText: {
    fontSize: 10,
    color: theme.colors.textMuted,
    lineHeight: 14,
    textAlign: 'center',
  },
  supportText: {
    fontSize: 10,
    color: theme.colors.textMuted,
    textAlign: 'center',
    marginTop: 16,
    fontWeight: '500',
  }
});
