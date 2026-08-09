import { StyleSheet } from 'react-native';
import { theme } from '../../src/config/theme';

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F5FA',
  },
  scrollContent: {
    paddingBottom: 110,
  },
  contentPadding: {
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 18,
    marginBottom: 16,
    shadowColor: '#2196F3',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 10,
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: theme.fonts.extraBold,
    color: '#0F172A',
    textTransform: 'uppercase',
    letterSpacing: 1,
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
    fontSize: 10,
    fontFamily: theme.fonts.extraBold,
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  contactValueColumn: {
    flex: 1,
  },
  contactValue: {
    fontSize: 13,
    fontFamily: theme.fonts.bold,
    color: '#2196F3',
  },
  contactSubtext: {
    fontSize: 11,
    fontFamily: theme.fonts.regular,
    color: '#64748B',
    marginTop: 2,
  },
  branchItem: {
    marginBottom: 14,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  branchItemLast: {
    marginBottom: 0,
    paddingBottom: 0,
    borderBottomWidth: 0,
  },
  branchName: {
    fontSize: 13,
    fontFamily: theme.fonts.bold,
    color: '#0F172A',
    marginBottom: 4,
  },
  branchDetail: {
    fontSize: 12,
    fontFamily: theme.fonts.regular,
    color: '#64748B',
    lineHeight: 18,
    marginTop: 2,
  },
  branchDetailBold: {
    fontFamily: theme.fonts.bold,
    color: '#2196F3',
  }
});
