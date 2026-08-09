import { StyleSheet } from 'react-native';
import { theme } from '../../src/config/theme';

const rawStyles = {
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  
  // A. Header Card Component (32px Curved Bottom Corners & Soft Blue Border)
  headerCard: {
    backgroundColor: '#2196F3',
    paddingTop: 46,
    paddingBottom: 24,
    paddingHorizontal: 20,
    position: 'relative',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    borderBottomWidth: 2,
    borderBottomColor: '#1E88E5',
    overflow: 'hidden',
  },
  waterDropletsOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    opacity: 0.85,
  },
  decorCircle1: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    top: -70,
    right: -60,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  decorCircle2: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    top: 100,
    left: -80,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  logoImage: {
    width: 155,
    height: 52,
    resizeMode: 'contain',
  },
  brandSubtitle: {
    fontSize: 9,
    fontFamily: theme.fonts.extraBold,
    color: '#FFFFFF',
    letterSpacing: 1.5,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  greetingContainer: {
    marginTop: 10,
    marginBottom: 14,
  },
  greetingText: {
    fontSize: 20,
    fontFamily: theme.fonts.extraBold,
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  locationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  locationText: {
    fontSize: 11,
    fontFamily: theme.fonts.semiBold,
    color: '#F0F9FF',
    marginLeft: 5,
  },
  swirlWrapper: {
    position: 'absolute',
    bottom: -1,
    left: 0,
    right: 0,
    height: 55,
  },
  swirlAccentImage: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    height: 55,
    opacity: 0.6,
  },
  swirlBoundaryImage: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    height: 55,
  },
  
  // Brand Row
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  logoContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandTextContainer: {
    flex: 1,
    marginLeft: 10,
  },
  
  // Profile Pill (iOS Capsule Style)
  profilePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 22,
    paddingVertical: 5,
    paddingLeft: 12,
    paddingRight: 6,
  },
  profileName: {
    fontSize: 12,
    fontFamily: theme.fonts.bold,
    color: '#ffffff',
    marginRight: 6,
    maxWidth: 75,
  },
  avatarContainer: {
    position: 'relative',
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeDot: {
    position: 'absolute',
    right: -1,
    bottom: -1,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#34C759', // Apple Vibrant Green
    borderWidth: 1.5,
    borderColor: '#2196F3',
  },
  
  // Metrics Counter Banner (iOS Segmented Widget Bar)
  metricsBanner: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginTop: 4,
  },
  metricColumn: {
    alignItems: 'center',
    flex: 1,
  },
  metricLabel: {
    fontSize: 8,
    fontFamily: theme.fonts.extraBold,
    color: 'rgba(255, 255, 255, 0.75)',
    letterSpacing: 1.2,
    marginBottom: 3,
    textTransform: 'uppercase',
  },
  metricNumber: {
    fontSize: 18,
    fontFamily: theme.fonts.extraBold,
    color: '#ffffff',
  },
  divider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },

  // Main Scrollable Area
  scrollView: {
    flex: 1,
    backgroundColor: '#F2F2F7', // Apple System Grouped Background
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 110,
  },
  
  // Alert Feed Banner (iOS Callout Box)
  alertBanner: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FCA5A5',
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
    marginBottom: 18,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  alertTitle: {
    fontSize: 12,
    fontFamily: theme.fonts.extraBold,
    color: '#DC2626',
  },
  alertText: {
    fontSize: 11,
    fontFamily: theme.fonts.semiBold,
    color: '#64748B',
    marginTop: 2,
  },

  // B. Quick Services Grid (iOS App Tile Matrix)
  sectionHeader: {
    fontSize: 11,
    fontFamily: theme.fonts.extraBold,
    color: '#6E6E73', // Apple Secondary Label Color
    letterSpacing: 1.2,
    marginBottom: 12,
    marginTop: 4,
    textTransform: 'uppercase',
    paddingLeft: 4,
  },
  gridContainer: {
    gap: 14,
    marginBottom: 22,
  },
  gridRow: {
    flexDirection: 'row',
    gap: 14,
  },
  gridCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 22, // Apple Squircle Corner Radius
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.04)',
    padding: 16,
    minHeight: 125,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
    position: 'relative',
    justifyContent: 'space-between',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  iconWrapper: {
    width: 38,
    height: 38,
    borderRadius: 12, // iOS Squircle Icon Badge
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeContainer: {
    backgroundColor: '#FF9500',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 5,
  },
  badgeText: {
    fontSize: 10,
    fontFamily: theme.fonts.extraBold,
    color: '#FFFFFF',
  },
  cardTitle: {
    fontSize: 14,
    fontFamily: theme.fonts.bold,
    color: '#1C1C1E',
    marginBottom: 3,
  },
  cardDesc: {
    fontSize: 11,
    fontFamily: theme.fonts.regular,
    color: '#8E8E93',
    lineHeight: 15,
  },

  // C. Water Health Consumer Index Card (iOS Health Widget)
  indexCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.04)',
    borderRadius: 22,
    padding: 18,
    marginBottom: 22,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
  indexCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  indexHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  indexHeaderTitle: {
    fontSize: 11,
    fontFamily: theme.fonts.extraBold,
    color: '#1C1C1E',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  indexHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(52, 199, 89, 0.1)',
    borderRadius: 14,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: 'rgba(52, 199, 89, 0.2)',
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#34C759',
    marginRight: 5,
  },
  liveLabel: {
    fontSize: 9,
    fontFamily: theme.fonts.extraBold,
    color: '#34C759',
    letterSpacing: 0.5,
  },
  indexInnerPanel: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressRing: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 4,
    borderColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  progressNumber: {
    fontSize: 18,
    fontFamily: theme.fonts.monoBold,
    color: '#1C1C1E',
  },
  progressUnit: {
    fontSize: 8,
    fontFamily: theme.fonts.bold,
    color: '#8E8E93',
    marginTop: -2,
  },
  indexInfoBlock: {
    flex: 1,
    marginLeft: 14,
  },
  statusPill: {
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    borderRadius: 12,
    alignSelf: 'flex-start',
    paddingVertical: 3,
    paddingHorizontal: 10,
    marginBottom: 6,
  },
  statusPillText: {
    fontSize: 9,
    fontFamily: theme.fonts.extraBold,
    color: '#007AFF',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  indexDescription: {
    fontSize: 11,
    fontFamily: theme.fonts.regular,
    color: '#6E6E73',
    lineHeight: 16,
  },

  // Logout Button
  logoutBtn: {
    alignSelf: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginTop: 8,
    marginBottom: 16,
    backgroundColor: theme.colors.white,
    width: '100%',
    alignItems: 'center',
  },
  logoutText: {
    fontSize: 11,
    fontWeight: '900',
    color: theme.colors.alert,
    letterSpacing: 1,
  },
  
  // D. Recent Activity Section
  activityContainer: {
    gap: 12,
    marginBottom: 20,
  },
  activityCard: {
    backgroundColor: theme.colors.white,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#0B2240',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  activityDate: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#94a3b8',
    textTransform: 'uppercase',
  },
  statusBadgeSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 6,
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  statusDotSmall: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    marginRight: 4,
  },
  statusTextSmall: {
    fontSize: 8,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  activityTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: 4,
  },
  activityDesc: {
    fontSize: 11,
    color: theme.colors.textMuted,
    lineHeight: 15,
  },
  emptyActivityCard: {
    backgroundColor: theme.colors.white,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderStyle: 'dashed',
  },
  emptyActivityTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: 4,
  },
  emptyActivityDesc: {
    fontSize: 11,
    color: theme.colors.textMuted,
    textAlign: 'center',
    lineHeight: 15,
    maxWidth: '80%',
  },

  // Latest Ticket Tracker styles
  trackerCard: {
    backgroundColor: theme.colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingVertical: 14,
    paddingHorizontal: 16,
    shadowColor: '#0B2240',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 2,
  },
  trackerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  trackerTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },

  // Stepper layout styles inside the tracker card
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  stepWrapper: {
    alignItems: 'center',
    gap: 4,
    width: 60,
  },
  stepDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
  },
  stepDotActive: {
    borderColor: theme.colors.accent,
    backgroundColor: theme.colors.accent,
  },
  stepDotInactive: {
    borderColor: '#CBD5E1',
  },
  stepDotInner: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.colors.white,
  },
  stepLabel: {
    fontSize: 8,
    fontWeight: '800',
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  stepLabelActive: {
    color: theme.colors.primary,
  },
  stepLabelInactive: {
    color: '#94A3B8',
  },
  stepLine: {
    flex: 1,
    height: 2,
    marginTop: -12, 
  },
  stepLineActive: {
    backgroundColor: theme.colors.accent,
  },
  stepLineInactive: {
    backgroundColor: '#E2E8F5',
  },

  // Profile Modal Overlay
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(11, 34, 64, 0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: theme.colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 36,
    shadowColor: '#0B2240',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: theme.colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  modalUserSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 24,
    paddingBottom: 20,
    borderBottomWidth: 4,
    borderBottomColor: theme.colors.border,
  },
  modalAvatarLarge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalUserName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  modalUserRole: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  modalActions: {
    gap: 10,
  },
  modalBtnPrimary: {
    height: 48,
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBtnPrimaryText: {
    color: theme.colors.white,
    fontSize: 13,
    fontWeight: 'bold',
  },
  modalBtnDanger: {
    height: 48,
    backgroundColor: theme.colors.alertBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FEC2C2',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBtnDangerText: {
    color: theme.colors.alert,
    fontSize: 13,
    fontWeight: 'bold',
  },
  modalBtnSecondary: {
    height: 48,
    backgroundColor: '#EFF6FF',
    borderColor: 'rgba(0, 159, 222, 0.15)',
    borderWidth: 1,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBtnSecondaryText: {
    color: theme.colors.primary,
    fontSize: 13,
    fontWeight: 'bold',
  },
  notificationBell: {
    position: 'relative',
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444', 
    borderWidth: 1.5,
    borderColor: '#02205e', 
  },
  notificationsModalContent: {
    backgroundColor: theme.colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 36,
    maxHeight: '80%', 
    shadowColor: '#0B2240',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 8,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    paddingHorizontal: 12,
  },
  notificationItemUnread: {
    backgroundColor: 'rgba(0, 159, 222, 0.04)', 
  },
  notificationIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: 2,
  },
  notificationMessage: {
    fontSize: 11,
    color: theme.colors.textMuted,
    lineHeight: 14,
  },
  notificationTime: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#94a3b8',
    textTransform: 'uppercase',
    marginTop: 4,
  },
  emptyNotifications: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 8,
  },
  emptyNotificationsText: {
    fontSize: 12,
    color: theme.colors.textMuted,
  },
};

// Post-process rawStyles to apply correct fontFamily and remove conflicting fontWeight on Android
Object.keys(rawStyles).forEach(key => {
  const style = rawStyles[key];
  if (style) {
    // If it has font family already (like GeistMono), map weights correctly
    if (style.fontFamily === 'GeistMono-Regular' || style.fontFamily === theme.fonts.mono) {
      if (style.fontWeight === 'bold' || style.fontWeight === '700' || style.fontWeight === '800' || style.fontWeight === '950' || style.fontWeight === '900') {
        style.fontFamily = theme.fonts.monoBold;
      }
      delete style.fontWeight;
    } else if (style.fontFamily === theme.fonts.monoBold) {
      delete style.fontWeight;
    } else {
      // If it defines text-like properties (fontSize, color, letterSpacing, lineHeight, textTransform, etc.), apply Plus Jakarta Sans!
      const isText = style.fontSize !== undefined || 
                     style.letterSpacing !== undefined || 
                     style.lineHeight !== undefined || 
                     style.textTransform !== undefined ||
                     key.toLowerCase().includes('text') || 
                     key.toLowerCase().includes('title') || 
                     key.toLowerCase().includes('label') ||
                     key.toLowerCase().includes('desc') || 
                     key.toLowerCase().includes('name') ||
                     key.toLowerCase().includes('brand') ||
                     key.toLowerCase().includes('btn') ||
                     key.toLowerCase().includes('button') ||
                     key.toLowerCase().includes('input');

      if (isText && !style.fontFamily) {
        if (style.fontWeight === 'bold' || style.fontWeight === '700') {
          style.fontFamily = theme.fonts.bold;
        } else if (style.fontWeight === '800' || style.fontWeight === '900' || style.fontWeight === '950') {
          style.fontFamily = theme.fonts.extraBold;
        } else if (style.fontWeight === '500' || style.fontWeight === '600') {
          style.fontFamily = theme.fonts.semiBold;
        } else {
          style.fontFamily = theme.fonts.regular;
        }
        delete style.fontWeight;
      }
    }
  }
});

export default StyleSheet.create(rawStyles);
