import { StyleSheet } from 'react-native';
import { theme } from '../../src/config/theme';

const rawStyles = {
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
    paddingBottom: 110,
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
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 18,
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  sectionHeaderText: {
    color: '#0C4F8B',
    fontWeight: '800',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  sectionCountBadge: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  sectionCountText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#0C4F8B',
  },
  claimBtn: {
    marginTop: 10,
    backgroundColor: '#0C4F8B',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  claimBtnText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  emptyText: {
    fontSize: 12,
    color: theme.colors.textMuted,
    textAlign: 'center',
    fontStyle: 'italic',
    padding: 32,
  }
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
