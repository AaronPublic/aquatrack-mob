import { StyleSheet } from 'react-native';
import { theme } from '../../src/config/theme';

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.primary,
    letterSpacing: 0.2,
  },
  subtitle: {
    fontSize: 12,
    color: theme.colors.textMuted,
    marginTop: 4,
    lineHeight: 16,
  },
  card: {
    backgroundColor: theme.colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 16,
    marginBottom: 16,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '900',
    color: theme.colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    paddingBottom: 8,
  },
  contactRow: {
    flexDirection: 'row',
    marginBottom: 14,
    alignItems: 'flex-start',
    gap: 12,
  },
  contactLabelColumn: {
    width: 68,
    marginTop: 2,
  },
  contactLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: theme.colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  contactValueColumn: {
    flex: 1,
  },
  contactValue: {
    fontSize: 13,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  contactSubtext: {
    fontSize: 11,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  branchItem: {
    marginBottom: 14,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  branchItemLast: {
    marginBottom: 0,
    paddingBottom: 0,
    borderBottomWidth: 0,
  },
  branchName: {
    fontSize: 13,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: 4,
  },
  branchDetail: {
    fontSize: 11,
    color: theme.colors.textMuted,
    lineHeight: 16,
    marginTop: 2,
  },
  branchDetailBold: {
    fontWeight: 'bold',
    color: theme.colors.primary,
  }
});
