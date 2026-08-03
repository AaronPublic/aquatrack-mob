import React from 'react';
import { View, Text, TouchableOpacity, Image, ScrollView, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import homeStyles from './SubAdminHome.styles';
import { useTechNotificationStore } from '../../src/store/useTechNotificationStore';

/**
 * Shared header component for all sub-admin / technician screens.
 *
 * Props:
 *  - navigation        — React Navigation prop (required for routing)
 *  - subtitle          — String shown under AQUATRACK branding (e.g. "TECHNICIAN TRIAGE")
 *  - pageTitle         — Large page title shown in greeting row
 *  - pageDesc          — Small description shown under pageTitle
 *  - techName          — Technician display name
 *  - metrics           — { activeJobs, pendingTriage, telemetryAlerts } — pass null to hide bar
 *  - onProfilePress    — Callback for profile pill press
 */
export default function TechHeader({
  navigation,
  subtitle = 'TECHNICIAN PORTAL',
  pageTitle,
  pageDesc,
  techName = 'Technician',
  metrics = null,
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
        colors={['#02205eff', '#325497ff']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.8, y: 1 }}
        style={homeStyles.headerCard}
      >
        {/* ── Brand Row ────────────────────────────────────────────── */}
        <View style={homeStyles.brandRow}>
          {/* Left: Logo */}
          <View style={homeStyles.logoContainer}>
            <Image
              source={require('../../assets/LOGO3.png')}
              style={homeStyles.logoImage}
            />
          </View>

          {/* Middle: Brand Text */}
          <View style={homeStyles.brandTextContainer}>
            <View style={homeStyles.brandTitleRow}>
              <Text style={homeStyles.brandAqua}>AQ</Text>
              <Text style={homeStyles.brandAquaYellow}>U</Text>
              <Text style={homeStyles.brandAquaRed}>A</Text>
              <Text style={homeStyles.brandT}>T</Text>
              <Text style={homeStyles.brandRack}>RACK</Text>
            </View>
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
          <View style={{ marginTop: 12, marginBottom: metrics ? 16 : 0 }}>
            {pageTitle && (
              <Text style={homeStyles.techNameTitle}>{pageTitle}</Text>
            )}
            {pageDesc && (
              <Text style={homeStyles.greetingText}>{pageDesc}</Text>
            )}
          </View>
        )}

        {/* ── Metrics Bar (only on home screen) ────────────────────── */}
        {metrics && (
          <View style={homeStyles.metricsRow}>
            {/* My Active Jobs */}
            <View style={homeStyles.metricColumn}>
              <Text style={homeStyles.metricLabel}>MY JOBS</Text>
              <Text style={[homeStyles.metricNumber, { color: '#00D1FF' }]}>
                {metrics.activeJobs}
              </Text>
            </View>
            <View style={homeStyles.divider} />

            {/* Unassigned / Pending Triage */}
            <View style={homeStyles.metricColumn}>
              <Text style={homeStyles.metricLabel}>UNASSIGNED</Text>
              <Text style={[homeStyles.metricNumber, { color: '#FFCC00' }]}>
                {metrics.pendingTriage}
              </Text>
            </View>
            <View style={homeStyles.divider} />

            {/* IoT Alerts */}
            <View style={homeStyles.metricColumn}>
              <Text style={homeStyles.metricLabel}>IOT ALERTS</Text>
              <Text
                style={[
                  homeStyles.metricNumber,
                  { color: metrics.telemetryAlerts > 0 ? '#FF6B6B' : '#4CD964' },
                ]}
              >
                {metrics.telemetryAlerts}
              </Text>
            </View>
          </View>
        )}
      </LinearGradient>

      {/* ── Notifications Drawer Modal ─────────────────────────────── */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={notificationsVisible}
        onRequestClose={() => setNotificationsVisible(false)}
      >
        <TouchableOpacity
          style={homeStyles.modalOverlay}
          activeOpacity={1}
          onPress={() => setNotificationsVisible(false)}
        >
          <TouchableOpacity
            style={homeStyles.notificationsModalContent}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <View style={homeStyles.modalHeader}>
              <Text style={homeStyles.modalTitle}>Notifications & Updates</Text>
              <TouchableOpacity onPress={() => setNotificationsVisible(false)}>
                <Ionicons name="close" size={20} color="#0B1C3F" />
              </TouchableOpacity>
            </View>

            {/* Notification List */}
            {notifications.length === 0 ? (
              <View style={homeStyles.emptyNotifications}>
                <Ionicons name="notifications-off-outline" size={48} color="#94a3b8" />
                <Text style={homeStyles.emptyNotificationsText}>
                  No new complaints or advisories yet.
                </Text>
              </View>
            ) : (
              <ScrollView showsVerticalScrollIndicator={false}>
                {notifications.map((item) => {
                  let iconName = 'notifications-outline';
                  let iconColor = '#009FDE';
                  let iconBg = 'rgba(0, 159, 222, 0.08)';

                  if (item.type === 'advisory') {
                    if (item.category === 'warning') {
                      iconName = 'alert-circle-outline';
                      iconColor = '#EF4444';
                      iconBg = '#FEF2F2';
                    } else {
                      iconName = 'megaphone-outline';
                      iconColor = '#F59E0B';
                      iconBg = '#FEF3C7';
                    }
                  } else if (item.type === 'new_complaint') {
                    if (item.urgency === 'CRITICAL') {
                      iconName = 'warning-outline';
                      iconColor = '#EF4444';
                      iconBg = '#FEF2F2';
                    } else if (item.urgency === 'HIGH') {
                      iconName = 'chatbubble-ellipses-outline';
                      iconColor = '#F97316';
                      iconBg = '#FFF7ED';
                    } else {
                      iconName = 'chatbubble-outline';
                      iconColor = '#3B82F6';
                      iconBg = '#EFF6FF';
                    }
                  }

                  const timeString = item.date.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  return (
                    <TouchableOpacity
                      key={item.id}
                      activeOpacity={0.7}
                      onPress={() => handleNotificationPress(item)}
                      style={[
                        homeStyles.notificationItem,
                        !item.read && homeStyles.notificationItemUnread,
                      ]}
                    >
                      <View
                        style={[
                          homeStyles.notificationIconContainer,
                          { backgroundColor: iconBg },
                        ]}
                      >
                        <Ionicons name={iconName} size={18} color={iconColor} />
                      </View>
                      <View style={homeStyles.notificationContent}>
                        <Text style={homeStyles.notificationTitle}>{item.title}</Text>
                        <Text style={homeStyles.notificationMessage}>{item.message}</Text>
                        <Text style={homeStyles.notificationTime}>{timeString}</Text>
                      </View>
                      {!item.read && (
                        <View
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: 4,
                            backgroundColor: '#3B82F6',
                            alignSelf: 'center',
                            flexShrink: 0,
                          }}
                        />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </>
  );
}
