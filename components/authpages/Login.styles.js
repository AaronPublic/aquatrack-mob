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
    minHeight: SCREEN_HEIGHT * 0.65,
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 52 : 36,
    paddingBottom: 110,
    paddingHorizontal: 24,
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
    marginTop: 18,
  },

  // Extra Large Transparent PNG Logo
  bigLogoImage: {
    width: 380,
    height: 250,
    marginTop: 0,
    marginBottom: 0,
  },

  // ONE Single Shiny Realistic 3D Water Droplet on the Logo
  singleLogoDroplet: {
    position: 'absolute',
    top: 38,
    right: 64,
    width: 32,
    height: 40,
    borderRadius: 20,
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
  brandSubtitle: {
    fontSize: 10,
    fontFamily: theme.fonts.extraBold,
    color: '#FFFFFF',
    letterSpacing: 1.5,
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

  // ================= 30% BOTTOM ACTION SECTION (WHITE) =================
  bottomSection: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
    flex: 1,
  },

  // INITIAL LANDING: ONLY 2 BUTTONS
  idleButtonsContainer: {
    gap: 12,
    marginTop: 12,
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
    marginVertical: 10,
    paddingHorizontal: 12,
  },
  orDividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  orDividerText: {
    fontSize: 13,
    fontFamily: theme.fonts.bold,
    color: '#94A3B8',
    marginHorizontal: 14,
  },

  // Tech Support Text
  techSupportBox: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
    paddingVertical: 4,
  },
  techSupportTitle: {
    fontSize: 11,
    fontFamily: theme.fonts.semiBold,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 2,
  },
  techSupportPhone: {
    fontSize: 12,
    fontFamily: 'GeistMono-Regular',
    color: '#64748B',
    textAlign: 'center',
    letterSpacing: 0.5,
  },

  // Form Header Row with Back Button
  formHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  backBtnText: {
    fontSize: 15,
    fontFamily: theme.fonts.extraBold,
    color: '#2196F3',
    marginLeft: 4,
  },
  formHeaderTitle: {
    fontSize: 15,
    fontFamily: theme.fonts.extraBold,
    color: '#2196F3',
    letterSpacing: 1,
  },

  // Password Login vs Billing ID Login Sub-Selector
  subSelectorContainer: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 3,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  subSelectorBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
  },
  subSelectorBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  subSelectorTxt: {
    fontSize: 11,
    fontFamily: theme.fonts.bold,
    color: '#64748B',
  },
  subSelectorTxtActive: {
    color: '#2196F3',
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
    fontSize: 10,
    fontFamily: theme.fonts.extraBold,
    color: '#1E293B',
    letterSpacing: 1,
    marginBottom: 5,
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
    padding: 4,
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
    backgroundColor: '#2196F3',
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
    shadowColor: '#2196F3',
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
});
