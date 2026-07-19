import { StyleSheet } from 'react-native';
import { theme } from '../../src/config/theme';

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    padding: 16,
    paddingBottom: 8,
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
  
  // Segment Tabs
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#DFE7F2',
    borderRadius: 12,
    padding: 4,
    marginHorizontal: 16,
    marginBottom: 8,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabButtonActive: {
    backgroundColor: theme.colors.primary,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  tabText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#001e6699',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tabTextActive: {
    color: theme.colors.white,
  },

  listContainer: {
    padding: 16,
    paddingBottom: 110,
    gap: 12,
  },

  // Ticket Card
  ticketCard: {
    backgroundColor: theme.colors.white,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 16,
    shadowColor: '#0B1C3F',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  ticketCardExpanded: {
    borderColor: '#bdcddc',
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 4,
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  ticketDate: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#94a3b8',
    textTransform: 'uppercase',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  statusText: {
    fontSize: 8,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  ticketSummary: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#0B1C3F',
    marginBottom: 6,
  },
  ticketDescription: {
    fontSize: 11,
    color: '#525f7f',
    lineHeight: 16,
  },

  // Collapsed bottom row
  expandRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  ticketLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ticketLocationText: {
    fontSize: 10,
    color: '#525f7f',
    fontWeight: '600',
  },
  expandToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  expandToggleText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#8E8E93',
  },

  // Expanded content
  expandedContent: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    gap: 12,
  },
  detailSectionTitle: {
    fontSize: 9,
    fontWeight: '900',
    color: '#8E8E93',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },

  // Stepper styles
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    marginVertical: 4,
  },
  stepWrapper: {
    alignItems: 'center',
    gap: 4,
    width: 60,
  },
  stepDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
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
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ffffff',
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
    color: '#94a3b8',
  },
  stepLine: {
    flex: 1,
    height: 2,
    marginTop: -12, // Align with dot centers
  },
  stepLineActive: {
    backgroundColor: theme.colors.accent,
  },
  stepLineInactive: {
    backgroundColor: '#e2e8f0',
  },

  // Metadata block
  metaDivider: {
    height: 1,
    backgroundColor: '#f1f5f9',
  },
  metaRow: {
    flexDirection: 'row',
    gap: 16,
  },
  metaItem: {
    flex: 1,
    gap: 2,
  },
  metaLabel: {
    fontSize: 8,
    fontWeight: '900',
    color: '#8E8E93',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  metaValue: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0B1C3F',
  },
  metaValueMono: {
    fontSize: 10,
    fontFamily: theme.fonts.mono,
    color: '#525f7f',
  },

  // Image block
  imageBlock: {
    gap: 6,
  },
  ticketImage: {
    width: '100%',
    height: 160,
    borderRadius: 12,
    resizeMode: 'cover',
  },

  // Crew assignment detail block
  assignmentBlock: {
    backgroundColor: '#F4F7FA',
    borderRadius: 12,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  assignmentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  assignmentAvatarText: {
    color: theme.colors.white,
    fontSize: 10,
    fontWeight: 'bold',
  },
  assignmentInfo: {
    flex: 1,
  },
  assignmentLabel: {
    fontSize: 8,
    color: '#8E8E93',
    textTransform: 'uppercase',
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  assignmentName: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0B1C3F',
    marginTop: 1,
  },

  // Empty state
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 64,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0B1C3F',
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 11,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 16,
    maxWidth: '80%',
  }
});
