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
    height: 38,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 12,
    color: theme.colors.primary,
    backgroundColor: theme.colors.white,
  },
  filterBtn: {
    paddingHorizontal: 12,
    height: 38,
    backgroundColor: theme.colors.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
    justifyContent: 'center',
  },
  filterBtnActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  filterBtnText: {
    fontSize: 11,
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
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  barangayBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: 'rgba(0, 174, 239, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(0, 174, 239, 0.2)',
  },
  barangayText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: theme.colors.accent,
  },
  urgencyBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    borderWidth: 1,
  },
  urgencyText: {
    fontSize: 8,
    fontWeight: 'black',
    textTransform: 'uppercase',
  },
  cardBody: {
    gap: 4,
    marginVertical: 6,
  },
  cardSummary: {
    fontSize: 13,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  cardDesc: {
    fontSize: 11,
    color: theme.colors.textMuted,
    lineHeight: 15,
  },
  metaText: {
    fontSize: 9,
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
    borderTopColor: theme.colors.border,
    justifyContent: 'space-between',
  },
  statusLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: theme.colors.primary,
    textTransform: 'uppercase',
  },
  statusBtnRow: {
    flexDirection: 'row',
    gap: 4,
  },
  statusBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.card,
  },
  statusBtnActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  statusTextSmall: {
    fontSize: 9,
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
    borderTopColor: theme.colors.border,
  },
  assignedText: {
    fontSize: 10,
    color: theme.colors.textMuted,
  },
  assignedName: {
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  assignBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: theme.colors.accent,
    borderRadius: 6,
  },
  assignBtnText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: theme.colors.white,
  }
});
