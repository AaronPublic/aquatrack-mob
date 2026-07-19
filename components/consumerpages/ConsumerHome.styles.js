import { StyleSheet } from 'react-native';
import { theme } from '../../src/config/theme';

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F7FA', // Main background: Very light grey/blue
  },
  
  // A. Header Card Component
  headerCard: {
    backgroundColor: '#185de7ff', // Deep Navy Blue
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    paddingTop: 48, // Safe area boundary buffer
    paddingBottom: 24,
    paddingHorizontal: 20,
    shadowColor: '#0B1C3F',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    
  },
  
  // Brand Row
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  logoContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoImage: {
    width: 40,
    height: 40,
    resizeMode: 'contain',
    tintColor: '#ffffff', // Force monochrome white color for the logo
  },
  brandTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  brandTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandAqua: {
    fontSize: 16,
    fontWeight: '900',
    color: '#ffffff', // Clean white brand header
    letterSpacing: 0.5,
  },
  brandT: {
    fontSize: 16,
    fontWeight: '900',
    color: '#00aeef', // Accent azure blue T
    letterSpacing: 0.5,
  },
  brandRack: {
    fontSize: 16,
    fontWeight: '900',
    color: '#ffffff', // Clean white brand header
    letterSpacing: 0.5,
  },
  brandSubtitle: {
    fontSize: 8,
    fontWeight: '800',
    color: 'rgba(255, 255, 255, 0.4)', // Muted white subtitle
    letterSpacing: 1.5,
    marginTop: 2,
    textTransform: 'uppercase',
  },
  
  // Profile Pill
  profilePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)', // Frosted glassmorphism background
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 20,
    paddingVertical: 4,
    paddingLeft: 12,
    paddingRight: 6,
  },
  profileName: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#ffffff',
    marginRight: 8,
    maxWidth: 70,
  },
  avatarContainer: {
    position: 'relative',
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImage: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  activeDot: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10b981', // Dynamic emerald status green
    borderWidth: 1.5,
    borderColor: '#0B1C3F', // Border matching main header background
  },
  
  // Metrics Counter Banner
  metricsBanner: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)', // Unified frosted banner backdrop
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
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
    color: 'rgba(255, 255, 255, 0.4)', // Cohesive muted labeling
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  metricNumber: {
    fontSize: 18,
    fontWeight: '900',
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
    padding: 20,
    paddingBottom: 110,
  },
  
  // Alert Feed Banner
  alertBanner: {
    backgroundColor: '#fef2f2',
    borderColor: '#fee2e2',
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  alertTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#970006',
  },
  alertText: {
    fontSize: 11,
    color: '#525f7f',
    marginTop: 2,
  },

  // B. Quick Services Grid
  sectionHeader: {
    fontSize: 10,
    fontWeight: '900',
    color: '#8E8E93', // Muted grey section header
    letterSpacing: 2.0,
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  gridContainer: {
    gap: 12,
    marginBottom: 24,
  },
  gridRow: {
    flexDirection: 'row',
    gap: 12,
  },
  gridCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0', // Crisp defined border matching other components
    padding: 16,
    minHeight: 124,
    shadowColor: '#0B1C3F',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
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
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeContainer: {
    backgroundColor: '#00D1FF', // Bright Sky Blue badge
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
    color: '#0B1C3F', // Contrast deep navy text inside badge
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0B1C3F', // Deep Navy
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 10,
    color: '#525f7f',
    lineHeight: 13,
  },

  // C. Water Health Consumer Index Card
  indexCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0', // Crisp clean border, replacing heavy solid border
    borderRadius: 20,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#0B1C3F',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
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
    color: '#0B1C3F',
    letterSpacing: 0.5,
  },
  indexHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 122, 255, 0.05)',
    borderRadius: 8,
    paddingVertical: 3,
    paddingHorizontal: 6,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#007AFF', // System Blue live indicator
    marginRight: 4,
  },
  liveLabel: {
    fontSize: 8,
    fontWeight: '800',
    color: '#007AFF', // System Blue live label text
  },
  indexInnerPanel: {
    backgroundColor: '#E6F4FE', // Soft brand azure water theme
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressRing: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 4,
    borderColor: '#007AFF', // System Blue WQI circular tracker ring
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  progressNumber: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0B1C3F',
  },
  progressUnit: {
    fontSize: 7,
    fontWeight: '700',
    color: '#525f7f',
    marginTop: -2,
  },
  indexInfoBlock: {
    flex: 1,
    marginLeft: 14,
  },
  statusPill: {
    backgroundColor: '#007AFF', // System Blue status pill
    borderRadius: 6,
    alignSelf: 'flex-start',
    paddingVertical: 2,
    paddingHorizontal: 8,
    marginBottom: 6,
  },
  statusPillText: {
    fontSize: 8,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  indexDescription: {
    fontSize: 10,
    color: '#525f7f',
    lineHeight: 14,
  },

  // Logout Button
  logoutBtn: {
    alignSelf: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    marginTop: 8,
    marginBottom: 16,
    backgroundColor: '#ffffff',
    width: '100%',
    alignItems: 'center',
    shadowColor: '#0B1C3F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 1,
  },
  logoutText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#FF3B30', // Red logout text
    letterSpacing: 1,
  },
  
  // D. Recent Activity Section
  activityContainer: {
    gap: 12,
    marginBottom: 20,
  },
  activityCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#0B1C3F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#e2e8f0',
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
    color: '#0B1C3F',
    marginBottom: 4,
  },
  activityDesc: {
    fontSize: 10,
    color: '#525f7f',
    lineHeight: 14,
  },
  emptyActivityCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderStyle: 'dashed',
  },
  emptyActivityTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0B1C3F',
    marginBottom: 4,
  },
  emptyActivityDesc: {
    fontSize: 10,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 14,
    maxWidth: '80%',
  },

  // Latest Ticket Tracker styles
  trackerCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingVertical: 12,
    paddingHorizontal: 16,
    shadowColor: '#0B1C3F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
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
    color: '#0B1C3F',
  },

  // Stepper layout styles inside the tracker card
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  stepWrapper: {
    alignItems: 'center',
    gap: 4,
    width: 60,
  },
  stepDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  stepDotActive: {
    borderColor: theme.colors.accent,
    backgroundColor: theme.colors.accent,
  },
  stepDotInactive: {
    borderColor: '#cbd5e1',
  },
  stepDotInner: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#ffffff',
  },
  stepLabel: {
    fontSize: 7,
    fontWeight: '800',
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  stepLabelActive: {
    color: theme.colors.primary,
  },
  stepLabelInactive: {
    color: '#94a3b8',
  },
  stepLine: {
    flex: 1,
    height: 2,
    marginTop: -10, // Centers line alignment with dot
  },
  stepLineActive: {
    backgroundColor: theme.colors.accent,
  },
  stepLineInactive: {
    backgroundColor: '#e2e8f0',
  },

  // Profile Modal Overlay
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(11, 28, 63, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 36,
    shadowColor: '#0B1C3F',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 10,
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
    color: '#0B1C3F',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  modalUserSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 24,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  modalAvatarLarge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#001e66',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalUserName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0B1C3F',
  },
  modalUserRole: {
    fontSize: 10,
    fontWeight: '700',
    color: '#8E8E93',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  modalActions: {
    gap: 10,
  },
  modalBtnPrimary: {
    height: 48,
    backgroundColor: '#001e66',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBtnPrimaryText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: 'bold',
  },
  modalBtnDanger: {
    height: 48,
    backgroundColor: '#fef2f2',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fca5a5',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBtnDangerText: {
    color: '#FF3B30',
    fontSize: 13,
    fontWeight: 'bold',
  },
  modalBtnSecondary: {
    height: 48,
    backgroundColor: '#EBF3FC',
    borderColor: '#00aeef44',
    borderWidth: 1,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBtnSecondaryText: {
    color: '#001e66',
    fontSize: 13,
    fontWeight: 'bold',
  },
});
