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
    marginBottom: 12,
  },
  nodeName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 8,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  // Metrics Grid layout
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  metricItem: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#F5F7FA',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 12,
    gap: 4,
  },
  metricLabel: {
    fontSize: 8,
    fontWeight: '900',
    color: theme.colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '900',
    color: theme.colors.primary,
  },
  metaFooter: {
    marginTop: 10,
    fontSize: 11,
    color: theme.colors.textMuted,
    textAlign: 'right',
  },
  emptyText: {
    fontSize: 12,
    color: theme.colors.textMuted,
    textAlign: 'center',
    fontStyle: 'italic',
    padding: 24,
  }
});
