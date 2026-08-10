import React from 'react';
import { View, Text, TouchableOpacity, Image, ScrollView, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import homeStyles from './SubAdminHome.styles';
import { useTechNotificationStore } from '../../src/store/useTechNotificationStore';

/**
 * Shared header component for all sub-admin / technician screens.
 * Styled to match the Landing Page blue gradient, water droplets, and swirl wave boundary.
 */
export default function TechHeader({
  navigation,
  subtitle = 'TECHNICIAN PORTAL',
  pageTitle,
  pageDesc,
  techName = 'Technician',
  metrics = null,
  showSwirl = false,
  onProfilePress,
}) {
  const [notificationsVisible, setNotificationsVisible] = React.useState(false);
  const { notifications, unreadCount, markAllAsRead, dismissNotification } =
    useTechNotificationStore();

  const handleOpenNotifications = () => {
    setNotificationsVisible(true);
    markAllAsRead();
  };

  const handleNotificationPress = (item) => {
    setNotificationsVisible(false);
    dismissNotification(item.id);
    if (item.type === 'advisory') {
      navigation.navigate('SubAdminAdvisories');
    } else if (item.type === 'new_complaint') {
      navigation.navigate('SubAdminComplaints');
    }
  };

  return (
    <>
      <LinearGradient 
        colors={['#0C4F8B', '#008CE3']} 
        start={{ x: 0, y: 0 }} 
        end={{ x: 0, y: 1 }} 
        style={[
          homeStyles.headerCard,
          !showSwirl && { paddingBottom: 24, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 }
        ]}
      >
        {/* Background Water Ripple Decorations */}
        <View style={homeStyles.decorCircle1} />
        <View style={homeStyles.decorCircle2} />

        {/* ── Brand Row ────────────────────────────────────────────── */}
        <View style={homeStyles.brandRow}>
          {/* Left: Transparent High-Contrast Logo */}
          <View style={homeStyles.logoContainer}>
            <Image
              source={require('../../assets/Logo.png')}
              style={homeStyles.logoImage}
              resizeMode="contain"
            />
          </View>

          {/* Middle: Subtitle Badge */}
          <View style={homeStyles.brandTextContainer}>
            <Text style={homeStyles.brandSubtitle}>{subtitle}</Text>
          </View>

          {/* Right: Notification Bell + Profile Pill */}
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {/* Notification Bell */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleOpenNotifications}
              style={homeStyles.notificationBell}
            >
              <Ionicons name="notifications-outline" size={16} color="#ffffff" />
              {unreadCount > 0 && <View style={homeStyles.notificationBadge} />}
            </TouchableOpacity>

            {/* Profile Pill */}
            {onProfilePress && (
              <TouchableOpacity
                style={homeStyles.profilePill}
                onPress={onProfilePress}
                activeOpacity={0.8}
              >
                <Text style={homeStyles.profileName} numberOfLines={1}>
                  {techName}
                </Text>
                <View style={homeStyles.avatarContainer}>
                  <Ionicons name="person" size={14} color="#ffffff" />
                  <View style={homeStyles.activeDot} />
                </View>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* ── Page Title Row ───────────────────────────────────────── */}
        {(pageTitle || pageDesc) && (
          <View style={homeStyles.greetingContainer}>
            {pageTitle && (
              <Text style={homeStyles.greetingText}>{pageTitle}</Text>
            )}
            {pageDesc && (
              <View style={homeStyles.locationPill}>
                <Ionicons name="construct-outline" size={13} color="#E0F2FE" />
                <Text style={homeStyles.locationText}>{pageDesc}</Text>
              </View>
            )}
          </View>
        )}

        {/* ── Metrics Summary Bar ──────────────────────────────────── */}
        {metrics && (
          <View style={homeStyles.metricsBanner}>
            <View style={homeStyles.metricColumn}>
              <Text style={homeStyles.metricLabel}>MY JOBS</Text>
              <Text style={homeStyles.metricNumber}>{metrics.activeJobs ?? 0}</Text>
            </View>
            <View style={homeStyles.divider} />
            <View style={homeStyles.metricColumn}>
              <Text style={homeStyles.metricLabel}>PENDING TRIAGE</Text>
              <Text style={homeStyles.metricNumber}>{metrics.pendingTriage ?? 0}</Text>
            </View>
            <View style={homeStyles.divider} />
            <View style={homeStyles.metricColumn}>
              <Text style={homeStyles.metricLabel}>TELEMETRY ALERTS</Text>
              <Text style={homeStyles.metricNumber}>{metrics.telemetryAlerts ?? 0}</Text>
            </View>
          </View>
        )}

        {/* ── Swirl Wave Boundary Junction (Only on Homepage) ─────────── */}
        {showSwirl && (
          <View style={homeStyles.swirlWrapper}>
            <Image 
              source={require('../../assets/swirl_accent.png')}
              style={homeStyles.swirlAccentImage}
              resizeMode="cover"
            />
            <Image 
              source={require('../../assets/swirl_boundary.png')}
              style={homeStyles.swirlBoundaryImage}
              resizeMode="cover"
            />
          </View>
        )}
      </LinearGradient>

      {/* ── Notifications Modal ────────────────────────────────────── */}
      <Modal
        visible={notificationsVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setNotificationsVisible(false)}
      >
        <View style={homeStyles.modalOverlay}>
          <View style={homeStyles.notifModalCard}>
            {/* Header */}
            <View style={homeStyles.notifModalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="notifications" size={18} color="#2196F3" />
                <Text style={homeStyles.notifModalTitle}>Technician Alerts</Text>
              </View>
              <TouchableOpacity
                onPress={() => setNotificationsVisible(false)}
                style={homeStyles.notifModalCloseBtn}
              >
                <Ionicons name="close" size={18} color="#64748B" />
              </TouchableOpacity>
            </View>

            {/* List */}
            <ScrollView style={{ maxHeight: 340 }}>
              {notifications.length === 0 ? (
                <View style={homeStyles.notifEmptyBox}>
                  <Ionicons name="notifications-off-outline" size={32} color="#CBD5E1" />
                  <Text style={homeStyles.notifEmptyText}>No notifications at this time.</Text>
                </View>
              ) : (
                notifications.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      homeStyles.notifItem,
                      item.unread && homeStyles.notifItemUnread,
                    ]}
                    onPress={() => handleNotificationPress(item)}
                    activeOpacity={0.7}
                  >
                    <View style={homeStyles.notifIconContainer}>
                      <Ionicons
                        name={
                          item.type === 'new_complaint'
                            ? 'warning-outline'
                            : 'megaphone-outline'
                        }
                        size={16}
                        color="#2196F3"
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={homeStyles.notifItemTitle}>{item.title}</Text>
                      <Text style={homeStyles.notifItemBody}>{item.body}</Text>
                      <Text style={homeStyles.notifItemTime}>{item.time}</Text>
                    </View>
                    {item.unread && <View style={homeStyles.notifUnreadDot} />}
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}
