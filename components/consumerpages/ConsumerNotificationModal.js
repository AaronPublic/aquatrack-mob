import React from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView,  StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import AppIcon from '../AppIcon';
import { theme } from '../../src/config/theme';

export default function ConsumerNotificationModal({
  visible,
  onClose,
  notifications = [],
  onNotificationPress,
  onMarkAllAsRead,
}) {
  if (!visible) return null;

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableOpacity
          style={styles.modalContent}
          activeOpacity={1}
          onPress={(e) => e.stopPropagation?.()}
        >
          {/* Top Handle Bar */}
          <View style={styles.dragHandle} />

          {/* Modal Header with Official AquaTrack Logo */}
          <View style={styles.headerContainer}>
            <View style={styles.headerLeft}>
              <View style={styles.logoBadge}>
                <Image
                  source={require('../../assets/adaptive-icon.png')}
                  style={styles.logoImage}
                  contentFit="contain"
                />
              </View>
              <View>
                <Text style={styles.headerTitle}>AquaTrack Alerts</Text>
                <Text style={styles.headerSubtitle}>Real-time updates & notifications</Text>
              </View>
            </View>

            <View style={styles.headerRight}>
              {unreadCount > 0 ? (
                <View style={styles.unreadPill}>
                  <View style={styles.unreadDot} />
                  <Text style={styles.unreadPillText}>{unreadCount} New</Text>
                </View>
              ) : (
                <View style={styles.allCaughtUpPill}>
                  <AppIcon name="checkmark" size={10} color="#10B981" />
                  <Text style={styles.allCaughtUpText}>Caught Up</Text>
                </View>
              )}
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <AppIcon name="close" size={18} color="#64748B" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Notification Items List */}
          {notifications.length === 0 ? (
            <View style={styles.emptyStateContainer}>
              <View style={styles.emptyIconCircle}>
                <AppIcon name="notifications-off-outline" size={32} color="#94A3B8" />
              </View>
              <Text style={styles.emptyStateTitle}>All Caught Up!</Text>
              <Text style={styles.emptyStateDesc}>
                You will receive instant alerts here whenever water advisories or ticket updates occur.
              </Text>
            </View>
          ) : (
            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              {notifications.map((item) => {
                let badgeText = 'NOTICE';
                let badgeColor = '#009FDE';
                let badgeBg = '#E0F2FE';
                let iconName = 'notifications-outline';
                let cardBorderColor = '#E2E8F0';

                if (item.type === 'advisory') {
                  if (item.category === 'warning') {
                    badgeText = 'CRITICAL ADVISORY';
                    badgeColor = '#EF4444';
                    badgeBg = '#FEF2F2';
                    iconName = 'alert-circle';
                    cardBorderColor = '#FECACA';
                  } else {
                    badgeText = 'COMMUNITY BULLETIN';
                    badgeColor = '#F59E0B';
                    badgeBg = '#FEF3C7';
                    iconName = 'megaphone';
                    cardBorderColor = '#FDE68A';
                  }
                } else if (item.type === 'complaint_status') {
                  if (item.status === 'RESOLVED') {
                    badgeText = 'TICKET RESOLVED';
                    badgeColor = '#10B981';
                    badgeBg = '#ECFDF5';
                    iconName = 'checkmark-circle';
                    cardBorderColor = '#A7F3D0';
                  } else if (item.status === 'ONGOING') {
                    badgeText = 'CREW EN ROUTE';
                    badgeColor = '#6366F1';
                    badgeBg = '#EEF2FF';
                    iconName = 'build';
                    cardBorderColor = '#C7D2FE';
                  } else if (item.status === 'DISPATCHED') {
                    badgeText = 'CREW DISPATCHED';
                    badgeColor = '#F97316';
                    badgeBg = '#FFF7ED';
                    iconName = 'paper-plane';
                    cardBorderColor = '#FFEDD5';
                  } else {
                    badgeText = 'UNDER EVALUATION';
                    badgeColor = '#007AFF';
                    badgeBg = '#EFF6FF';
                    iconName = 'search';
                    cardBorderColor = '#BFDBFE';
                  }
                }

                const timeString = item.date
                  ? new Date(item.date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      timeZone: 'Asia/Manila',
                    })
                  : 'Recent';

                return (
                  <TouchableOpacity
                    key={item.id}
                    activeOpacity={0.8}
                    onPress={() => onNotificationPress?.(item)}
                    style={[
                      styles.notificationCard,
                      !item.read && styles.notificationCardUnread,
                      !item.read && { borderColor: cardBorderColor },
                    ]}
                  >
                    {/* Left Colored Accent Strip for Unread */}
                    {!item.read && (
                      <View style={[styles.accentStrip, { backgroundColor: badgeColor }]} />
                    )}

                    <View style={styles.cardHeaderRow}>
                      {/* Category Badge */}
                      <View style={[styles.categoryBadge, { backgroundColor: badgeBg }]}>
                        <AppIcon name={iconName} size={11} color={badgeColor} style={{ marginRight: 4 }} />
                        <Text style={[styles.categoryBadgeText, { color: badgeColor }]}>
                          {badgeText}
                        </Text>
                      </View>

                      {/* Timestamp */}
                      <Text style={styles.timestampText}>{timeString}</Text>
                    </View>

                    {/* Title */}
                    <Text style={styles.cardTitle}>{item.title}</Text>

                    {/* Message Body */}
                    <Text style={styles.cardMessage} numberOfLines={3}>
                      {item.message}
                    </Text>

                    {/* Card Footer with Brand Stamp */}
                    <View style={styles.cardFooter}>
                      <View style={styles.brandStamp}>
                        <Image
                          source={require('../../assets/adaptive-icon.png')}
                          style={{ width: 12, height: 12, marginRight: 4 }}
                          contentFit="contain"
                        />
                        <Text style={styles.brandStampText}>AquaTrack System Notification</Text>
                      </View>
                      <AppIcon name="chevron-forward" size={14} color="#94A3B8" />
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(2, 32, 94, 0.65)', // AquaTrack dark translucent overlay
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 12,
    paddingHorizontal: 20,
    paddingBottom: 36,
    maxHeight: '85%',
    shadowColor: '#0B2240',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 12,
  },
  dragHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
    alignSelf: 'center',
    marginBottom: 14,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoBadge: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoImage: {
    width: 24,
    height: 24,
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: theme.fonts.bold,
    color: '#0B2240',
  },
  headerSubtitle: {
    fontSize: 11,
    fontFamily: theme.fonts.regular,
    color: '#64748B',
    marginTop: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  unreadPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  unreadDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EF4444',
    marginRight: 4,
  },
  unreadPillText: {
    fontSize: 10,
    fontFamily: theme.fonts.bold,
    color: '#EF4444',
  },
  allCaughtUpPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    gap: 4,
  },
  allCaughtUpText: {
    fontSize: 10,
    fontFamily: theme.fonts.semiBold,
    color: '#10B981',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    maxHeight: 460,
  },
  scrollContent: {
    paddingVertical: 6,
    gap: 12,
  },
  notificationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0B2240',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  notificationCardUnread: {
    backgroundColor: '#FAFCFF',
  },
  accentStrip: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingLeft: 4,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  categoryBadgeText: {
    fontSize: 9,
    fontFamily: theme.fonts.extraBold,
    letterSpacing: 0.5,
  },
  timestampText: {
    fontSize: 10,
    fontFamily: theme.fonts.semiBold,
    color: '#94A3B8',
  },
  cardTitle: {
    fontSize: 13,
    fontFamily: theme.fonts.bold,
    color: '#0B2240',
    marginBottom: 4,
    paddingLeft: 4,
    lineHeight: 18,
  },
  cardMessage: {
    fontSize: 12,
    fontFamily: theme.fonts.regular,
    color: '#475569',
    lineHeight: 17,
    paddingLeft: 4,
    marginBottom: 10,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
    paddingTop: 8,
    paddingLeft: 4,
  },
  brandStamp: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandStampText: {
    fontSize: 9,
    fontFamily: theme.fonts.semiBold,
    color: '#94A3B8',
  },
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  emptyStateTitle: {
    fontSize: 16,
    fontFamily: theme.fonts.bold,
    color: '#0B2240',
    marginBottom: 6,
  },
  emptyStateDesc: {
    fontSize: 12,
    fontFamily: theme.fonts.regular,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
  },
});
