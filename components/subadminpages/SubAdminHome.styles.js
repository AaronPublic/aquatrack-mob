import { StyleSheet } from 'react-native';
import { theme } from '../../src/config/theme';

const rawStyles = {
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  headerCard: {
    backgroundColor: '#2196F3',
    paddingTop: 44,
    paddingBottom: 65,
    paddingHorizontal: 20,
    position: 'relative',
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
    width: 120,
    height: 36,
  },
  brandSubtitle: {
    fontSize: 9,
    fontFamily: theme.fonts.extraBold,
    color: '#FFFFFF',
    letterSpacing: 1.5,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  greetingContainer: {
    marginTop: 10,
    marginBottom: 10,
  },
  greetingText: {
    fontSize: 18,
    fontFamily: theme.fonts.extraBold,
    color: '#FFFFFF',
  },
  locationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  locationText: {
    fontSize: 12,
    fontFamily: theme.fonts.regular,
    color: '#F0F9FF',
    marginLeft: 4,
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
  // ─── Notification Bell ────────────────────────────────────────────────────
  notificationBell: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: -1,
    right: -1,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#EF4444',
    borderWidth: 1.5,
    borderColor: '#02205e',
  },
  // ─── Notification Drawer ─────────────────────────────────────────────────
  notificationsModalContent: {
    backgroundColor: theme.colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 48,
    maxHeight: '80%',
    shadowColor: '#0B2240',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 8,
  },
  emptyNotifications: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 8,
  },
  emptyNotificationsText: {
    fontSize: 13,
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 8,
  },
  // ─── Notification Item ───────────────────────────────────────────────────
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 14,
    borderRadius: 14,
    marginBottom: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F5',
    gap: 12,
  },
  notificationItemUnread: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
  },
  notificationIconContainer: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  notificationContent: {
    flex: 1,
    gap: 3,
  },
  notificationTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  notificationMessage: {
    fontSize: 11,
    color: theme.colors.textMuted,
    lineHeight: 15,
  },
  notificationTime: {
    fontSize: 9,
    color: '#94a3b8',
    marginTop: 2,
    fontFamily: theme.fonts.mono,
  },
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
    width: 140,
    height: 48,
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
    fontFamily: theme.fonts.extraBold,
    color: '#ffffff',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(255, 255, 255, 0.45)',
    textShadowOffset: { width: 0.25, height: 0.25 },
    textShadowRadius: 0.5,
  },
  brandAquaYellow: {
    fontSize: 17,
    fontFamily: theme.fonts.extraBold,
    color: '#ffd800',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(255, 216, 0, 0.45)',
    textShadowOffset: { width: 0.25, height: 0.25 },
    textShadowRadius: 0.5,
  },
  brandAquaRed: {
    fontSize: 17,
    fontFamily: theme.fonts.extraBold,
    color: '#970006',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(151, 0, 6, 0.45)',
    textShadowOffset: { width: 0.25, height: 0.25 },
    textShadowRadius: 0.5,
  },
  brandT: {
    fontSize: 17,
    fontFamily: theme.fonts.extraBold,
    color: '#ffffff',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(255, 255, 255, 0.45)',
    textShadowOffset: { width: 0.25, height: 0.25 },
    textShadowRadius: 0.5,
  },
  brandRack: {
    fontSize: 17,
    fontFamily: theme.fonts.extraBold,
    color: '#ffffff',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(255, 255, 255, 0.45)',
    textShadowOffset: { width: 0.25, height: 0.25 },
    textShadowRadius: 0.5,
  },
  brandSubtitle: {
    fontSize: 8,
    fontFamily: theme.fonts.extraBold,
    color: 'rgba(255, 255, 255, 0.45)',
    letterSpacing: 1.8,
    marginTop: 2,
    textTransform: 'uppercase',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  greetingText: {
    fontSize: 12,
    fontFamily: theme.fonts.semiBold,
    color: 'rgba(255, 255, 255, 0.75)',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  techNameTitle: {
    fontSize: 20,
    fontFamily: theme.fonts.bold,
    color: theme.colors.white,
    marginTop: 2,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    gap: 4,
  },
  logoutText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: theme.colors.alert,
    textTransform: 'uppercase',
  },

  // Header Metrics
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.10)',
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  metricColumn: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  metricLabel: {
    fontSize: 7,
    fontWeight: '900',
    color: 'rgba(255, 255, 255, 0.40)',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  metricNumber: {
    fontSize: 22,
    fontWeight: 'bold',
    fontFamily: theme.fonts.mono,
    color: '#ffffff',
    lineHeight: 26,
  },
  divider: {
    width: 1,
    height: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
  },

  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 110,
  },
  sectionHeader: {
    fontSize: 10,
    fontWeight: '900',
    color: '#829AB1',
    letterSpacing: 2.0,
    marginBottom: 12,
    marginTop: 14,
    textTransform: 'uppercase',
  },

  // Active Job Tracker Card
  trackerCard: {
    backgroundColor: theme.colors.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 16,
    shadowColor: '#0B2240',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 2,
  },
  trackerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  trackerLabel: {
    fontSize: 8,
    fontWeight: '900',
    color: '#8E8E93',
    textTransform: 'uppercase',
  },
  trackerTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginTop: 2,
  },
  trackerDesc: {
    fontSize: 12,
    color: theme.colors.textMuted,
    lineHeight: 16,
    marginBottom: 12,
  },
  trackerActions: {
    borderTopWidth: 1,
    borderTopColor: '#F0F4F8',
    paddingTop: 12,
  },
  btnAction: {
    height: 48,
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
  },
  btnActionText: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },

  emptyTrackerBox: {
    backgroundColor: theme.colors.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#0B2240',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 2,
  },
  emptyTrackerTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  emptyTrackerDesc: {
    fontSize: 11,
    color: theme.colors.textMuted,
    textAlign: 'center',
    marginTop: 4,
  },

  // Workspace tools grid layout
  gridContainer: {
    gap: 12,
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
    backgroundColor: theme.colors.alert,
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

  // Status Indicator details
  statusBadgeSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 6,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderWidth: 1,
  },
  statusDotSmall: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    marginRight: 4,
  },
  statusTextSmall: {
    fontSize: 8,
    fontWeight: '900',
    textTransform: 'uppercase',
  },

  // Work Order details (merged from SubAdminHome)
  woBody: {
    paddingVertical: 12,
    gap: 12,
  },
  woDetailItem: {
    gap: 2,
  },
  detailLabel: {
    fontSize: 9,
    fontWeight: 'bold',
    color: theme.colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  detailText: {
    fontSize: 12,
    color: theme.colors.textMuted,
    lineHeight: 16,
  },
  instructionsBox: {
    backgroundColor: 'rgba(11, 34, 64, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(11, 34, 64, 0.08)',
    borderRadius: 8,
    padding: 12,
    marginTop: 4,
  },
  instructionsTitle: {
    fontSize: 9,
    fontWeight: 'bold',
    color: theme.colors.primary,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  instructionsText: {
    fontSize: 11,
    fontStyle: 'italic',
    color: theme.colors.textMuted,
    lineHeight: 15,
  },
  woImage: {
    width: '100%',
    height: 160,
    borderRadius: 12,
    resizeMode: 'cover',
    marginTop: 4,
  },
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
};

// Post-process styling variables dynamically to match custom fonts
Object.keys(rawStyles).forEach((key) => {
  const style = rawStyles[key];
  if (style && typeof style === 'object') {
    const hasFontProp = 'fontSize' in style || 'color' in style || 'fontWeight' in style || 'fontFamily' in style;
    const isText = hasFontProp ||
                   key.toLowerCase().includes('text') || 
                   key.toLowerCase().includes('title') || 
                   key.toLowerCase().includes('label') ||
                   key.toLowerCase().includes('desc') || 
                   key.toLowerCase().includes('name') ||
                   key.toLowerCase().includes('btn') ||
                   key.toLowerCase().includes('button');

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
});

export default StyleSheet.create(rawStyles);
