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
  // Search & Filter controls
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 8,
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    height: 48,
    borderWidth: 1,
    borderColor: '#D0D7E2',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 13,
    color: theme.colors.primary,
    backgroundColor: theme.colors.white,
  },
  filterBtn: {
    paddingHorizontal: 16,
    height: 48,
    backgroundColor: theme.colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D0D7E2',
    justifyContent: 'center',
  },
  filterBtnActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  filterBtnText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  filterBtnTextActive: {
    color: theme.colors.white,
  },
  listContainer: {
    padding: 16,
    gap: 12,
  },
  card: {
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  barangayBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  barangayText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: theme.colors.accent,
  },
  urgencyBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  urgencyText: {
    fontSize: 8,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  cardBody: {
    gap: 4,
    marginVertical: 8,
  },
  cardSummary: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  cardDesc: {
    fontSize: 12,
    color: theme.colors.textMuted,
    lineHeight: 16,
  },
  metaText: {
    fontSize: 10,
    fontFamily: theme.fonts.mono,
    color: theme.colors.textMuted,
  },
  // Status Selector
  statusControl: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F0F4F8',
    justifyContent: 'space-between',
  },
  statusLabel: {
    fontSize: 10,
    fontWeight: '900',
    color: theme.colors.primary,
    textTransform: 'uppercase',
  },
  statusBtnRow: {
    flexDirection: 'row',
    gap: 6,
  },
  statusBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.white,
  },
  statusBtnActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  statusTextSmall: {
    fontSize: 10,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  statusTextSmallActive: {
    color: theme.colors.white,
  },
  assignmentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F0F4F8',
  },
  assignedText: {
    fontSize: 11,
    color: theme.colors.textMuted,
  },
  assignedName: {
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  assignBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: theme.colors.accent,
    borderRadius: 8,
  },
  assignBtnText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: theme.colors.white,
  }
});
