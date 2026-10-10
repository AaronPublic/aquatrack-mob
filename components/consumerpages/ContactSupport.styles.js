import { StyleSheet, Platform } from 'react-native';
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
    paddingTop: 16,
  },

  // Cards
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 18,
    marginBottom: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 10,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  sectionHeaderIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  sectionTitle: {
    fontSize: 13,
    fontFamily: theme.fonts.extraBold,
    color: '#0F172A',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  sectionSubtitle: {
    fontSize: 11,
    fontFamily: theme.fonts.regular,
    color: '#64748B',
    marginTop: 1,
  },
  statusBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  statusBadgeText: {
    fontSize: 10,
    fontFamily: theme.fonts.bold,
    color: '#16A34A',
  },

  // Info Items
  infoBlock: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  infoIconCol: {
    marginTop: 2,
  },
  infoContentCol: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 10,
    fontFamily: theme.fonts.extraBold,
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 13,
    fontFamily: theme.fonts.bold,
    color: '#0F172A',
    lineHeight: 18,
  },
  infoValueLink: {
    fontSize: 13,
    fontFamily: theme.fonts.bold,
    color: '#0284C7',
    textDecorationLine: 'underline',
  },
  infoSubtext: {
    fontSize: 11,
    fontFamily: theme.fonts.regular,
    color: '#64748B',
    marginTop: 2,
  },

  // Hotline Items
  hotlineList: {
    gap: 8,
    marginTop: 4,
  },
  hotlineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  hotlineInfo: {
    flex: 1,
    marginRight: 10,
  },
  hotlineTitle: {
    fontSize: 12,
    fontFamily: theme.fonts.bold,
    color: '#0F172A',
  },
  hotlineNumber: {
    fontSize: 12,
    fontFamily: 'GeistMono-Regular',
    color: '#0284C7',
    marginTop: 1,
  },
  callButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0284C7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  callButtonText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontFamily: theme.fonts.bold,
  },

  // Mobile Hotline Chips Row
  mobileHotlinesRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  mobileHotlineChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E0F2FE',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#BAE6FD',
    gap: 6,
  },
  mobileHotlineText: {
    fontSize: 11,
    fontFamily: theme.fonts.bold,
    color: '#0284C7',
  },

  // Branch Sub-Offices
  branchItem: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    marginBottom: 10,
  },
  branchItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  branchName: {
    fontSize: 13,
    fontFamily: theme.fonts.bold,
    color: '#0F172A',
  },
  branchAddressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginTop: 4,
  },
  branchDetail: {
    fontSize: 12,
    fontFamily: theme.fonts.regular,
    color: '#64748B',
    lineHeight: 18,
    flex: 1,
  },
  branchActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  branchHoursText: {
    fontSize: 11,
    fontFamily: theme.fonts.regular,
    color: '#64748B',
  },

  // Quick Online Ticket Banner
  ticketBanner: {
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  ticketBannerIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#0284C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ticketBannerContent: {
    flex: 1,
  },
  ticketBannerTitle: {
    fontSize: 13,
    fontFamily: theme.fonts.bold,
    color: '#0F172A',
    marginBottom: 2,
  },
  ticketBannerDesc: {
    fontSize: 11,
    fontFamily: theme.fonts.regular,
    color: '#475569',
    lineHeight: 16,
  },
  ticketBannerBtn: {
    backgroundColor: '#0284C7',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    alignSelf: 'center',
  },
  ticketBannerBtnText: {
    fontSize: 11,
    fontFamily: theme.fonts.bold,
    color: '#FFFFFF',
  },
});
