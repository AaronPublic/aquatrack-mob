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
  listContainer: {
    padding: 16,
    gap: 12,
  },
  ticketCard: {
    backgroundColor: theme.colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 16,
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  ticketDate: {
    fontSize: 10,
    color: theme.colors.textMuted,
    fontFamily: theme.fonts.mono,
  },
  ticketId: {
    fontSize: 10,
    color: theme.colors.textMuted,
    fontFamily: theme.fonts.mono,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 9999,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 9999,
  },
  statusText: {
    fontSize: 9,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  ticketSummary: {
    fontSize: 13,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: 4,
  },
  ticketDescription: {
    fontSize: 12,
    color: theme.colors.textMuted,
    lineHeight: 16,
  },
  ticketLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 4,
  },
  ticketLocationText: {
    fontSize: 11,
    color: theme.colors.accent,
    fontWeight: '655',
  },
  // Crew assignment detail block
  assignmentBlock: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  assignmentAvatar: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: theme.colors.accent,
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
    fontSize: 9,
    color: theme.colors.textMuted,
    textTransform: 'uppercase',
    fontWeight: 'bold',
  },
  assignmentName: {
    fontSize: 11,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 13,
    color: theme.colors.textMuted,
    textAlign: 'center',
    fontStyle: 'italic',
  }
});
