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
  
  const { notifications, unreadCount, markAllAsRead, dismissNotification, fetchNotifications } =
    useTechNotificationStore();

  React.useEffect(() => {
    let isMounted = true;
    fetchNotifications();

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

    // Realtime listener to refresh badge count immediately when tasks or advisories change
    const channel = supabase
      .channel('tech-header-realtime-badge')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'Complaint' }, () => {
        fetchNotifications();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'Advisory' }, () => {
        fetchNotifications();
      })
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
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
    } else if (item.type === 'new_complaint' || item.type === 'assigned_task') {
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
            <View style={[homeStyles.logoContainer, { gap: 0 }]}>
              <Image
                source={require('../../assets/MOB-LOGO.png')}
                style={{ width: 44, height: 44, resizeMode: 'contain' }}
              />
              <Text style={homeStyles.brandTitleText}>
                <Text style={{ color: '#FFFFFF' }}>AQ</Text>
                <Text style={{ color: '#ffd800' }}>U</Text>
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
      {notificationsVisible && (
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
              style={[homeStyles.notifModalCard, { borderRadius: 28, paddingHorizontal: 20, paddingTop: 14, paddingBottom: 32 }]}
              onPress={(e) => e.stopPropagation?.()}
            >
              {/* Drag handle */}
              <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: '#CBD5E1', alignSelf: 'center', marginBottom: 14 }} />

              {/* Header */}
              <View style={[homeStyles.notifModalHeader, { paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: '#F1F5F9', marginBottom: 10 }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: '#F0F9FF', borderWidth: 1, borderColor: '#BAE6FD', justifyContent: 'center', alignItems: 'center' }}>
                    <Image
                      source={require('../../assets/adaptive-icon.png')}
                      style={{ width: 22, height: 22 }}
                      resizeMode="contain"
                    />
                  </View>
                  <View>
                    <Text style={{ fontSize: 16, fontFamily: 'PlusJakartaSans_700Bold', color: '#0B2240' }}>Field Dispatch Alerts</Text>
                    <Text style={{ fontSize: 11, fontFamily: 'PlusJakartaSans_400Regular', color: '#64748B' }}>Live tickets & operational bulletins</Text>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={() => setNotificationsVisible(false)}
                  style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center' }}
                >
                  <AppIcon name="close" size={16} color="#64748B" />
                </TouchableOpacity>
              </View>

              {/* List */}
              <ScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingVertical: 4 }}>
                {notifications.length === 0 ? (
                  <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 40, gap: 8 }}>
                    <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center', marginBottom: 6 }}>
                      <AppIcon name="notifications-off-outline" size={28} color="#94A3B8" />
                    </View>
                    <Text style={{ fontSize: 15, fontFamily: 'PlusJakartaSans_700Bold', color: '#0B2240' }}>All Caught Up!</Text>
                    <Text style={{ fontSize: 12, fontFamily: 'PlusJakartaSans_400Regular', color: '#64748B', textAlign: 'center' }}>No pending field notifications or unassigned tickets.</Text>
                  </View>
                ) : (
                  notifications.map((item) => {
                    const isComplaint = item.type === 'new_complaint';
                    const badgeColor = isComplaint ? '#007AFF' : '#F59E0B';
                    const badgeBg = isComplaint ? '#EFF6FF' : '#FEF3C7';
                    const badgeText = isComplaint ? 'NEW FIELD TICKET' : 'OPERATIONAL ADVISORY';
                    const iconName = isComplaint ? 'warning' : 'megaphone';

                    return (
                      <TouchableOpacity
                        key={item.id}
                        style={{
                          backgroundColor: '#FFFFFF',
                          borderRadius: 16,
                          padding: 14,
                          borderWidth: 1,
                          borderColor: item.unread ? '#BFDBFE' : '#E2E8F0',
                          position: 'relative',
                          overflow: 'hidden',
                          shadowColor: '#0B2240',
                          shadowOffset: { width: 0, height: 2 },
                          shadowOpacity: 0.04,
                          shadowRadius: 6,
                          elevation: 1,
                        }}
                        onPress={() => handleNotificationPress(item)}
                        activeOpacity={0.7}
                      >
                        {item.unread && (
                          <View style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, backgroundColor: badgeColor }} />
                        )}
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, paddingLeft: item.unread ? 4 : 0 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: badgeBg, paddingHorizontal: 7, paddingVertical: 2.5, borderRadius: 6 }}>
                            <AppIcon name={iconName} size={10} color={badgeColor} style={{ marginRight: 4 }} />
                            <Text style={{ fontSize: 9, fontFamily: 'PlusJakartaSans_800ExtraBold', color: badgeColor, letterSpacing: 0.5 }}>
                              {badgeText}
                            </Text>
                          </View>
                          <Text style={{ fontSize: 10, fontFamily: 'PlusJakartaSans_600SemiBold', color: '#94A3B8' }}>{item.time}</Text>
                        </View>
                        <Text style={{ fontSize: 13, fontFamily: 'PlusJakartaSans_700Bold', color: '#0B2240', marginBottom: 3, paddingLeft: item.unread ? 4 : 0 }}>
                          {item.title}
                        </Text>
                        <Text style={{ fontSize: 12, fontFamily: 'PlusJakartaSans_400Regular', color: '#475569', lineHeight: 16, paddingLeft: item.unread ? 4 : 0, marginBottom: 8 }}>
                          {item.body}
                        </Text>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#F8FAFC', paddingTop: 6, paddingLeft: item.unread ? 4 : 0 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Image
                              source={require('../../assets/adaptive-icon.png')}
                              style={{ width: 11, height: 11, marginRight: 4 }}
                              resizeMode="contain"
                            />
                            <Text style={{ fontSize: 9, fontFamily: 'PlusJakartaSans_600SemiBold', color: '#94A3B8' }}>AquaTrack Field Dispatch</Text>
                          </View>
                          <AppIcon name="chevron-forward" size={13} color="#94A3B8" />
                        </View>
                      </TouchableOpacity>
                    );
                  })
                )}
              </ScrollView>
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>
      )}

      {/* ── Profile Modal ────────────────────────────────────────────── */}
      {profileModalVisible && (
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
      )}
    </>
  );
}
