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
    marginBottom: 8,
  },
  date: {
    fontSize: 10,
    color: theme.colors.textMuted,
    fontFamily: theme.fonts.mono,
    fontWeight: 'bold',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 8,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: 6,
  },
  cardText: {
    fontSize: 12,
    color: theme.colors.textMuted,
    lineHeight: 18,
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 12,
    color: theme.colors.textMuted,
    textAlign: 'center',
    fontStyle: 'italic',
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
