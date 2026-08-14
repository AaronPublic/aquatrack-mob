import React from 'react';
import { View, Text, TouchableOpacity, Image, ScrollView, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AppIcon from '../../components/AppIcon';
import homeStyles from './SubAdminHome.styles';
import { useTechNotificationStore } from '../../src/store/useTechNotificationStore';
import { supabase } from '../../src/config/supabase';
import { useAuthStore } from '../../src/store/useAuthStore';

/**
 * Shared header component for all sub-admin / technician screens.
 * Styled to match the Landing Page blue gradient, water droplets, and swirl wave boundary.
 */
export default function TechHeader({
  navigation,
  subtitle = undefined,
  pageTitle,
  pageDesc,
  roleDesc,
  techName = 'Technician',
  metrics = null,
  showSwirl = true,
  showBack = false,
  onProfilePress,
}) {
  const [notificationsVisible, setNotificationsVisible] = React.useState(false);
  const [profileModalVisible, setProfileModalVisible] = React.useState(false);
  const [userProfile, setUserProfile] = React.useState(null);
  
  const { notifications, unreadCount, markAllAsRead, dismissNotification } =
    useTechNotificationStore();

  React.useEffect(() => {
    let isMounted = true;
    const fetchUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user && isMounted) {
          const { data } = await supabase
            .from('User')
            .select('*')
            .eq('id', session.user.id)
            .single();
          if (data && isMounted) {
            setUserProfile(data);
          }
        }
      } catch (err) {
        console.error('Failed to load profile in TechHeader:', err);
      }
    };
    fetchUser();
    return () => { isMounted = false; };
  }, []);

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

  const fullTechName = userProfile?.name || (techName !== 'Technician' ? techName : 'Field Technician');
  const displayTechName = userProfile?.name 
    ? userProfile.name.split(' ')[0] 
    : (techName !== 'Technician' ? techName.split(' ')[0] : 'Technician');

  const handleBack = () => {
    if (navigation && navigation.canGoBack()) {
      navigation.goBack();
    } else if (navigation) {
      navigation.navigate('SubAdminHome');
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

        {/* ── Top Bar ────────────────────────────────────────────── */}
        <View style={homeStyles.brandRow}>
          {/* Logo Container with Back Button */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            {showBack && (
              <TouchableOpacity 
                onPress={handleBack}
                activeOpacity={0.8}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 12,
                  backgroundColor: 'rgba(255, 255, 255, 0.18)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 1,
                  borderColor: 'rgba(255, 255, 255, 0.28)'
                }}
              >
                <AppIcon name="arrow-back" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            )}
            <View style={homeStyles.logoContainer}>
              <AppIcon name="water" size={26} color="#7DD3FC" />
              <Text style={homeStyles.brandTitleText}>
                <Text style={{ color: '#FFFFFF' }}>AQ</Text>
                <Text style={{ color: '#FBBF24' }}>U</Text>
                <Text style={{ color: '#EF4444' }}>A</Text>
                <Text style={{ color: '#FFFFFF' }}>TRACK</Text>
              </Text>
            </View>
          </View>

          {/* Right: Notification Bell + Profile Pill */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            {/* Notification Bell */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleOpenNotifications}
              style={homeStyles.notificationBell}
            >
              <AppIcon name="notifications-outline" size={18} color="#ffffff" />
              {unreadCount > 0 && <View style={homeStyles.notificationBadge} />}
            </TouchableOpacity>

            {/* Profile Pill */}
            <TouchableOpacity
              style={homeStyles.profilePill}
              onPress={onProfilePress || (() => setProfileModalVisible(true))}
              activeOpacity={0.8}
            >
              <Text style={homeStyles.profileName} numberOfLines={1}>
                {displayTechName}
              </Text>
              <View style={homeStyles.avatarContainer}>
                <AppIcon name="person" size={14} color="#ffffff" />
                <View style={homeStyles.activeDot} />
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Page Title / Greeting Row & Role Details ───────────────── */}
        {(pageTitle || pageDesc || subtitle || roleDesc) && (
          <View style={[homeStyles.greetingContainer, { marginTop: showBack ? 6 : 10 }]}>
            {pageTitle && (
              <Text style={[homeStyles.greetingText, showBack && { fontSize: 24, letterSpacing: -0.5 }]}>
                {pageTitle}
              </Text>
            )}

            {pageDesc && (
              <View style={homeStyles.locationPill}>
                {!showBack && <AppIcon name="location-outline" size={13} color="#E0F2FE" />}
                <Text style={[homeStyles.locationText, showBack && { marginLeft: 0 }]}>{pageDesc}</Text>
              </View>
            )}

            {Boolean(subtitle) && (
              <View style={homeStyles.brandSubtitlePill}>
                <Text style={homeStyles.brandSubtitleText}>
                  {subtitle}
                </Text>
              </View>
            )}

            {roleDesc && (
              <Text style={homeStyles.roleDescriptionText}>
                {roleDesc}
              </Text>
            )}
          </View>
        )}

        {/* ── Technician Analytics Banner (Total Logs, Assigned, Triage, Resolved) ───────── */}
        {metrics && (
          <View style={homeStyles.metricsBanner}>
            <View style={homeStyles.metricColumn}>
              <Text style={homeStyles.metricLabel}>TOTAL LOGS</Text>
              <Text style={homeStyles.metricNumber}>{metrics.totalLogs ?? metrics.total ?? 0}</Text>
            </View>
            <View style={homeStyles.divider} />

            <View style={homeStyles.metricColumn}>
              <Text style={[homeStyles.metricLabel, { color: '#E0F2FE' }]}>ASSIGNED</Text>
              <Text style={[homeStyles.metricNumber, { color: '#FFFFFF' }]}>{metrics.assigned ?? metrics.activeJobs ?? 0}</Text>
            </View>
            <View style={homeStyles.divider} />

            <View style={homeStyles.metricColumn}>
              <Text style={[homeStyles.metricLabel, { color: '#E0F2FE' }]}>TRIAGE</Text>
              <Text style={[homeStyles.metricNumber, { color: '#FFFFFF' }]}>{metrics.pendingTriage ?? 0}</Text>
            </View>
            <View style={homeStyles.divider} />

            <View style={homeStyles.metricColumn}>
              <Text style={[homeStyles.metricLabel, { color: '#E0F2FE' }]}>RESOLVED</Text>
              <Text style={[homeStyles.metricNumber, { color: '#FFFFFF' }]}>{metrics.resolved ?? 0}</Text>
            </View>
          </View>
        )}
      </LinearGradient>

      {/* ── Consumer Home Wave Swirl Divider Junction ─────────── */}
      {showSwirl && (
        <View style={homeStyles.swirlWrapper} pointerEvents="none">
          <View style={homeStyles.swirlBlueMaskFill} />
          <View style={homeStyles.smoothWaveCurve1} />
          <View style={homeStyles.smoothWaveCurve2} />
          <Image 
            source={require('../../assets/swirl_accent.png')}
            style={homeStyles.swirlAccentImage}
            resizeMode="stretch"
          />
        </View>
      )}

      {/* ── Notifications Modal ────────────────────────────────────── */}
      <Modal
        visible={notificationsVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setNotificationsVisible(false)}
      >
        <TouchableOpacity
          style={homeStyles.modalOverlay}
          activeOpacity={1}
          onPress={() => setNotificationsVisible(false)}
        >
          <TouchableOpacity 
            activeOpacity={1} 
            style={homeStyles.notifModalCard}
            onPress={(e) => e.stopPropagation?.()}
          >
            {/* Header */}
            <View style={homeStyles.notifModalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <AppIcon name="notifications" size={20} color="#0C4F8B" />
                <Text style={homeStyles.notifModalTitle}>Technician Alerts</Text>
              </View>
              <TouchableOpacity
                onPress={() => setNotificationsVisible(false)}
                style={homeStyles.notifModalCloseBtn}
              >
                <AppIcon name="close" size={18} color="#64748B" />
              </TouchableOpacity>
            </View>

            {/* List */}
            <ScrollView style={{ maxHeight: 380 }} showsVerticalScrollIndicator={false}>
              {notifications.length === 0 ? (
                <View style={homeStyles.notifEmptyBox}>
                  <AppIcon name="notifications-off-outline" size={36} color="#CBD5E1" />
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
                      <AppIcon
                        name={
                          item.type === 'new_complaint'
                            ? 'warning-outline'
                            : 'megaphone-outline'
                        }
                        size={18}
                        color="#0C4F8B"
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
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* ── Profile Modal ────────────────────────────────────────────── */}
      <Modal
        visible={profileModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setProfileModalVisible(false)}
      >
        <TouchableOpacity
          style={homeStyles.modalOverlay}
          activeOpacity={1}
          onPress={() => setProfileModalVisible(false)}
        >
          <TouchableOpacity activeOpacity={1} style={homeStyles.modalContent}>
            <View style={homeStyles.modalHeader}>
              <Text style={homeStyles.modalTitle}>Technician Profile</Text>
              <TouchableOpacity onPress={() => setProfileModalVisible(false)}>
                <AppIcon name="close" size={20} color="#0B1C3F" />
              </TouchableOpacity>
            </View>

            <View style={homeStyles.modalUserSection}>
              <View style={homeStyles.modalAvatarLarge}>
                <AppIcon name="person" size={20} color="#ffffff" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={homeStyles.modalUserName}>{fullTechName}</Text>
                <Text style={homeStyles.modalUserRole}>Field Technician</Text>
              </View>
            </View>

            <View style={homeStyles.modalActions}>
              <TouchableOpacity 
                style={homeStyles.modalBtnPrimary}
                onPress={() => {
                  setProfileModalVisible(false);
                  navigation?.navigate('ManageAccount');
                }}
              >
                <AppIcon name="settings-outline" size={15} color="#ffffff" style={{ marginRight: 6 }} />
                <Text style={homeStyles.modalBtnPrimaryText}>Manage Account</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={homeStyles.modalBtnDanger}
                onPress={async () => {
                  setProfileModalVisible(false);
                  await useAuthStore.getState().signOut();
                  if (navigation) {
                    navigation.reset({
                      index: 0,
                      routes: [{ name: 'Login' }],
                    });
                  }
                }}
              >
                <AppIcon name="log-out-outline" size={15} color="#FF3B30" style={{ marginRight: 6 }} />
                <Text style={homeStyles.modalBtnDangerText}>Log Out Account</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </>
  );
}
