import { StyleSheet, Platform, Dimensions } from 'react-native';
import { theme } from '../../src/config/theme';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default StyleSheet.create({
  outerContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    backgroundColor: '#FFFFFF',
  },

  // ================= 70% TOP BRANDING SECTION (BLUE GRADIENT) =================
  topSection: {
    minHeight: Math.min(SCREEN_HEIGHT * 0.58, 480),
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 48 : 32,
    paddingBottom: 95,
    paddingHorizontal: 24,
    position: 'relative',
    overflow: 'hidden',
  },

  // Compact Header Section for Form Input Screens (Responsive for Keyboard)
  topSectionCompact: {
    minHeight: 180,
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 40 : 20,
    paddingBottom: 72,
    paddingHorizontal: 20,
    position: 'relative',
    overflow: 'hidden',
  },

  // Reduced Water Droplets Overlay Texture (Clean & Uncluttered)
  waterDropletsOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    opacity: 0.22,
  },

  // Logo Wrapper Container
  logoWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
  },
  logoWrapperCompact: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },

  // Extra Large Transparent PNG Logo (Responsive to screen width)
  bigLogoImage: {
    width: Math.min(Dimensions.get('window').width * 0.85, 340),
    height: Math.min(Dimensions.get('window').width * 0.85 * (220 / 340), 220),
    resizeMode: 'contain',
    marginTop: 0,
    marginBottom: 0,
  },
  bigLogoImageCompact: {
    width: Math.min(Dimensions.get('window').width * 0.55, 200),
    height: Math.min(Dimensions.get('window').width * 0.55 * (100 / 200), 100),
    resizeMode: 'contain',
    marginTop: 0,
    marginBottom: 0,
  },

  // ONE Single Shiny Realistic 3D Water Droplet on the Logo
  singleLogoDroplet: {
    position: 'absolute',
    top: 34,
    right: 58,
    width: 28,
    height: 36,
    borderRadius: 18,
    borderTopLeftRadius: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    transform: [{ rotate: '-22deg' }],
    shadowColor: '#001030',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.28,
    shadowRadius: 8,
    elevation: 5,
  },
  singleLogoDropletCompact: {
    position: 'absolute',
    top: 16,
    right: 34,
    width: 16,
    height: 22,
    borderRadius: 11,
    borderTopLeftRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    transform: [{ rotate: '-22deg' }],
    shadowColor: '#001030',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 3,
  },

  // Specular Reflection Glare Spot inside Single Droplet
  dropletHighlight: {
    position: 'absolute',
    top: 4,
    left: 5,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
    opacity: 0.95,
  },
  dropletHighlightCompact: {
    position: 'absolute',
    top: 2,
    left: 3,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#FFFFFF',
    opacity: 0.95,
  },

  // Water Ripple Micro-Decorations
  decorCircle1: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    top: -80,
    right: -70,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  decorCircle2: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    top: 140,
    left: -90,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },

  // City Subtitle Badge
  cityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  cityBadgeCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 14,
    marginTop: 2,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  brandSubtitle: {
    fontSize: 10,
    fontFamily: theme.fonts.extraBold,
    color: '#FFFFFF',
    letterSpacing: 1.5,
  },
  brandSubtitleCompact: {
    fontSize: 8.5,
    fontFamily: theme.fonts.extraBold,
    color: '#FFFFFF',
    letterSpacing: 1.2,
  },
  brandDescription: {
    fontSize: 13,
    fontFamily: theme.fonts.regular,
    color: '#F0F9FF',
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 8,
    maxWidth: 320,
    opacity: 0.95,
  },
  brandDescriptionCompact: {
    fontSize: 11,
    fontFamily: theme.fonts.regular,
    color: '#F0F9FF',
    textAlign: 'center',
    lineHeight: 15,
    marginTop: 3,
    maxWidth: 280,
    opacity: 0.9,
  },

  // Swirl Wave Boundary Junction
  swirlWrapper: {
    position: 'absolute',
    bottom: -1,
    left: 0,
    right: 0,
    height: 95,
  },
  swirlAccentImage: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    height: 95,
    opacity: 0.6,
  },
  swirlBoundaryImage: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    height: 95,
  },

  // Compact Swirl Wave Boundary Junction
  swirlWrapperCompact: {
    position: 'absolute',
    bottom: -1,
    left: 0,
    right: 0,
    height: 65,
  },
  swirlAccentImageCompact: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    height: 65,
    opacity: 0.6,
  },
  swirlBoundaryImageCompact: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    height: 65,
  },

  // ================= 30% BOTTOM ACTION SECTION (WHITE) =================
  bottomSection: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingTop: 22,
    paddingBottom: 32,
    flex: 1,
  },

  // INITIAL LANDING: ONLY 2 BUTTONS
  idleButtonsContainer: {
    gap: 14,
    marginTop: 26,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  idleLoginBtn: {
    height: 54,
    backgroundColor: '#2196F3',
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2196F3',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 5,
  },
  idleLoginBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: theme.fonts.extraBold,
    letterSpacing: 1.5,
  },
  idleRegisterBtn: {
    height: 54,
    backgroundColor: '#F8FAFC',
    borderWidth: 2,
    borderColor: '#2196F3',
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  idleRegisterBtnText: {
    color: '#2196F3',
    fontSize: 15,
    fontFamily: theme.fonts.extraBold,
    letterSpacing: 1.5,
  },

  // "or" Divider Styles
  orDividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 12,
    paddingHorizontal: 12,
  },
  orDividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  orDividerText: {
    fontSize: 12,
    fontFamily: theme.fonts.bold,
    color: '#94A3B8',
    marginHorizontal: 14,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },

  // Tech Support Card
  techSupportCard: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  techSupportLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  techSupportIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  techSupportTitle: {
    fontSize: 12,
    fontFamily: theme.fonts.bold,
    color: '#0F172A',
    marginBottom: 2,
  },
  techSupportPhone: {
    fontSize: 11,
    fontFamily: theme.fonts.regular,
    color: '#64748B',
  },
  techSupportPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  techSupportPillText: {
    fontSize: 11,
    fontFamily: theme.fonts.bold,
    color: '#0284C7',
    marginRight: 2,
  },

  // Form Header Row with Back Button
  formHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginBottom: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: '#F0F9FF',
  },
  backBtnText: {
    fontSize: 13,
    fontFamily: theme.fonts.bold,
    color: '#0284C7',
    marginLeft: 4,
  },
  formHeaderTitle: {
    fontSize: 16,
    fontFamily: theme.fonts.extraBold,
    color: '#0F172A',
    letterSpacing: 0.8,
  },

  // Password Login vs Billing ID Login Sub-Selector
  subSelectorContainer: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  subSelectorBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    paddingHorizontal: 6,
    borderRadius: 9,
  },
  subSelectorBtnActive: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  subSelectorTxt: {
    fontSize: 12,
    fontFamily: theme.fonts.bold,
    color: '#64748B',
    marginLeft: 5,
  },
  subSelectorTxtActive: {
    color: '#0284C7',
  },

  // QR Scan Button
  qrScanBtn: {
    height: 46,
    backgroundColor: '#0284C7',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  qrScanBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: theme.fonts.bold,
    letterSpacing: 0.5,
  },

  // Global Error Box
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderColor: '#FEC2C2',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
  },
  errorBoxText: {
    color: '#D32F2F',
    fontSize: 12,
    fontFamily: theme.fonts.semiBold,
    flex: 1,
    lineHeight: 16,
  },

  // Form Container
  formContainer: {
    gap: 2,
  },

  // Form Field Styles
  fieldGroup: {
    marginBottom: 12,
  },
  fieldLabel: {
    fontSize: 11,
    fontFamily: theme.fonts.bold,
    color: '#1E293B',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  fieldInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    height: 48,
    paddingHorizontal: 14,
  },
  fieldInputWrapperFocused: {
    borderColor: '#0284C7',
    backgroundColor: '#FFFFFF',
  },
  fieldInput: {
    flex: 1,
    height: '100%',
    color: '#0F172A',
    fontSize: 14,
    fontFamily: theme.fonts.regular,
  },
  fieldIconLeft: {
    marginRight: 10,
  },
  fieldIconRight: {
    padding: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fieldErrorText: {
    color: '#D32F2F',
    fontSize: 11,
    fontFamily: theme.fonts.semiBold,
    marginTop: 4,
  },
  passwordHintText: {
    fontSize: 10,
    fontFamily: theme.fonts.regular,
    color: '#64748B',
    marginTop: 4,
  },

  // Primary Action Button
  primaryActionButton: {
    height: 52,
    backgroundColor: '#0284C7',
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 5,
  },
  primaryActionText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: theme.fonts.extraBold,
    letterSpacing: 1,
    marginRight: 6,
  },

  // Modal Directory Styles
  supportModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(11, 34, 64, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 30,
  },
  supportModalContent: {
    backgroundColor: '#FFFFFF',
    width: '100%',
    maxHeight: '90%',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#0B2240',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 10,
  },
  supportModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    marginBottom: 14,
  },
  supportModalTitle: {
    fontSize: 16,
    fontFamily: theme.fonts.extraBold,
    color: '#0F172A',
  },
  supportModalCloseBtn: {
    padding: 4,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
  },
  supportModalSection: {
    marginBottom: 14,
  },
  supportModalSectionTitle: {
    fontSize: 11,
    fontFamily: theme.fonts.extraBold,
    color: '#0284C7',
    letterSpacing: 1,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  supportModalCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    gap: 8,
  },
  supportInfoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  supportInfoText: {
    fontSize: 12,
    fontFamily: theme.fonts.regular,
    color: '#334155',
    flex: 1,
    lineHeight: 18,
  },
  supportInfoTextBold: {
    fontFamily: theme.fonts.bold,
    color: '#0F172A',
  },
  supportActionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 4,
    gap: 4,
  },
  supportActionChipText: {
    fontSize: 11,
    fontFamily: theme.fonts.bold,
    color: '#0284C7',
  },
});
