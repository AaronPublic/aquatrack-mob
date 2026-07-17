import { StyleSheet } from 'react-native';
import { theme } from '../../src/config/theme';

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  headerBanner: {
    backgroundColor: theme.colors.primary,
    padding: 24,
    paddingTop: 48,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  greeting: {
    fontSize: 22,
    fontWeight: 'bold',
    color: theme.colors.white,
  },
  subgreeting: {
    fontSize: 12,
    color: theme.colors.accent,
    marginTop: 4,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  scrollView: {
    padding: 16,
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: 'black',
    color: theme.colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 12,
    marginTop: 16,
  },
  // Shortcuts Grid
  shortcutsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  shortcutCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: theme.colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 16,
    justifyContent: 'space-between',
    height: 100,
  },
  shortcutTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  shortcutDesc: {
    fontSize: 11,
    color: theme.colors.textMuted,
    marginTop: 4,
  },
  // Advisory Highlight List
  advisoryCard: {
    backgroundColor: theme.colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  advisoryTextContainer: {
    flex: 1,
  },
  advisoryMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  advisoryDate: {
    fontSize: 10,
    color: theme.colors.textMuted,
    fontFamily: theme.fonts.mono,
  },
  advisoryTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
  },
  advisoryType: {
    fontSize: 8,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  advisoryTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  advisoryDesc: {
    fontSize: 11,
    color: theme.colors.textMuted,
    marginTop: 2,
    lineHeight: 14,
  },
  emptyText: {
    fontSize: 12,
    color: theme.colors.textMuted,
    textAlign: 'center',
    fontStyle: 'italic',
    paddingVertical: 12,
  },
  // Alert Feed Banner
  alertBanner: {
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
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
  logoutBtn: {
    alignSelf: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginTop: 16,
    marginBottom: 32,
    backgroundColor: theme.colors.white,
  },
  logoutText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: theme.colors.alert,
  }
});
