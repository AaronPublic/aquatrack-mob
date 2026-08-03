import { StyleSheet } from 'react-native';
import { theme } from '../../src/config/theme';

const rawStyles = {
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  
  // A. Header Card Component
  headerCard: {
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    paddingTop: 54, 
    paddingBottom: 28,
    paddingHorizontal: 20,
    shadowColor: '#0B2240',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },
  
  // Brand Row
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  logoContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoImage: {
    width: 38,
    height: 38,
    resizeMode: 'contain',
  },
  brandTextContainer: {
    flex: 1,
    marginLeft: 10,
  },
  brandTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandAqua: {
    fontSize: 17,
    fontWeight: '950',
    color: '#ffffff',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(255, 255, 255, 0.45)',
    textShadowOffset: { width: 0.25, height: 0.25 },
    textShadowRadius: 0.5,
  },
  brandAquaYellow: {
    fontSize: 17,
    fontWeight: '950',
    color: '#ffd800',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(255, 216, 0, 0.45)',
    textShadowOffset: { width: 0.25, height: 0.25 },
    textShadowRadius: 0.5,
  },
  brandAquaRed: {
    fontSize: 17,
    fontWeight: '950',
    color: '#970006',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(151, 0, 6, 0.45)',
    textShadowOffset: { width: 0.25, height: 0.25 },
    textShadowRadius: 0.5,
  },
  brandT: {
    fontSize: 17,
    fontWeight: '950',
    color: '#00D1FF', // Bright Cyan/Azure
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0, 209, 255, 0.45)',
    textShadowOffset: { width: 0.25, height: 0.25 },
    textShadowRadius: 0.5,
  },
  brandRack: {
    fontSize: 17,
    fontWeight: '950',
    color: '#ffffff',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(255, 255, 255, 0.45)',
    textShadowOffset: { width: 0.25, height: 0.25 },
    textShadowRadius: 0.5,
  },
  brandSubtitle: {
    fontSize: 8,
    fontWeight: '800',
    color: 'rgba(255, 255, 255, 0.45)',
    letterSpacing: 1.8,
    marginTop: 2,
    textTransform: 'uppercase',
  },
  
  // Profile Pill
  profilePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 20,
    paddingVertical: 5,
    paddingLeft: 12,
    paddingRight: 6,
  },
  profileName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
    marginRight: 6,
    maxWidth: 70,
  },
  avatarContainer: {
    position: 'relative',
    width: 22,
    height: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeDot: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
    borderWidth: 1.5,
    borderColor: '#0B2240',
  },
  
  // Metrics Counter Banner
  metricsBanner: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 18,
    paddingVertical: 14,
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
    fontWeight: '800',
    color: 'rgba(255, 255, 255, 0.45)',
    letterSpacing: 1,
    marginBottom: 4,
  },
  metricNumber: {
    fontSize: 18,
    fontWeight: '900',
    fontFamily: theme.fonts.mono,
    color: '#ffffff',
  },
  divider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },

  // Main Scrollable Area
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 110,
  },
  
  // Alert Feed Banner
  alertBanner: {
    backgroundColor: theme.colors.alertBg,
    borderColor: '#FEC2C2',
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  alertTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: theme.colors.alert,
  },
  alertText: {
    fontSize: 11,
    color: theme.colors.textMuted,
    marginTop: 2,
  },

  // B. Quick Services Grid
  sectionHeader: {
    fontSize: 10,
    fontWeight: '900',
    color: '#829AB1',
    letterSpacing: 2.0,
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  gridContainer: {
    gap: 12,
    marginBottom: 20,
  },
  gridRow: {
    flexDirection: 'row',
    gap: 12,
  },
  gridCard: {
    flex: 1,
    backgroundColor: theme.colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 16,
    minHeight: 120,
    shadowColor: '#0B2240',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 2,
    position: 'relative',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconWrapper: {
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeContainer: {
    backgroundColor: theme.colors.accent,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: theme.colors.white,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 11,
    color: theme.colors.textMuted,
    lineHeight: 14,
  },

  // C. Water Health Consumer Index Card
  indexCard: {
    backgroundColor: theme.colors.white,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 18,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#0B2240',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 2,
  },
  indexCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  indexHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  indexHeaderTitle: {
    fontSize: 10,
    fontWeight: '900',
    color: theme.colors.primary,
    letterSpacing: 0.5,
  },
  indexHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 159, 222, 0.06)',
    borderRadius: 6,
    paddingVertical: 3,
    paddingHorizontal: 6,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.accent,
    marginRight: 4,
  },
  liveLabel: {
    fontSize: 8,
    fontWeight: '800',
    color: theme.colors.accent,
  },
  indexInnerPanel: {
    backgroundColor: '#F0F8FF', // Ice-blue panel backdrop
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressRing: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 4,
    borderColor: theme.colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  progressNumber: {
    fontSize: 16,
    fontWeight: '900',
    fontFamily: theme.fonts.mono,
    color: theme.colors.primary,
  },
  progressUnit: {
    fontSize: 8,
    fontWeight: '700',
    color: theme.colors.textMuted,
    marginTop: -2,
  },
  indexInfoBlock: {
    flex: 1,
    marginLeft: 12,
  },
  statusPill: {
    backgroundColor: theme.colors.accent,
    borderRadius: 6,
    alignSelf: 'flex-start',
    paddingVertical: 2,
    paddingHorizontal: 8,
    marginBottom: 4,
  },
  statusPillText: {
    fontSize: 8,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  indexDescription: {
    fontSize: 11,
    color: theme.colors.textMuted,
    lineHeight: 15,
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
    borderBottomWidth: 1,
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
