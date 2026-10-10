import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Linking, Alert, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AppIcon from '../../components/AppIcon';
import styles from './ContactSupport.styles';
import homeStyles from './ConsumerHome.styles';
import { useResponsive } from '../../src/utils/responsive';

export default function ContactSupport({ navigation }) {
  const insets = useSafeAreaInsets();
  const { isSmallDevice } = useResponsive();
  const topPadding = Math.max(insets.top, Platform.OS === 'android' ? 34 : 20) + (isSmallDevice ? 2 : 6);

  const handleDial = (phoneNumber) => {
    const cleanNum = phoneNumber.replace(/[^0-9+]/g, '');
    Linking.openURL(`tel:${cleanNum}`).catch(() => {
      Alert.alert("CSFWD Hotline", `Please dial ${phoneNumber}`);
    });
  };

  const handleEmail = (emailAddr) => {
    Linking.openURL(`mailto:${emailAddr}`).catch(() => {
      Alert.alert("CSFWD Email", `Please send email to ${emailAddr}`);
    });
  };

  const mainOfficeHotlines = [
    { title: "Customer Service", phone: "(045) 961-3546", raw: "0459613546" },
    { title: "Billing Inquiry", phone: "(045) 961-5804", raw: "0459615804" },
    { title: "Follow-up on Service Application", phone: "(045) 961-8837", raw: "0459618837" },
  ];

  const subOffices = [
    {
      name: "Sindalan Sub-office",
      address: "Sindalan Payment Center, Brgy. Sindalan, City of San Fernando, Pampanga",
      phone: "(045) 455-1988",
      rawPhone: "0454551988",
      hours: "8:00 AM - 3:00 PM (Mon-Fri)"
    },
    {
      name: "Bulaon Sub-office",
      address: "Bulaon Payment Center, Brgy. Bulaon, City of San Fernando, Pampanga",
      phone: "(045) 961-5804",
      rawPhone: "0459615804",
      hours: "8:00 AM - 3:00 PM (Mon-Fri)"
    },
    {
      name: "Saguin Sub-office",
      address: "Fortune Square Bldg. (in front of Coke), Saguin, City of San Fernando, Pampanga",
      phone: null,
      hours: "8:00 AM - 5:00 PM (Mon-Fri)"
    }
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      {/* Top Blue Gradient Header */}
      <LinearGradient 
        colors={['#0C4F8B', '#008CE3']} 
        start={{ x: 0, y: 0 }} 
        end={{ x: 0, y: 1 }} 
        style={[homeStyles.headerCard, { paddingTop: topPadding, borderBottomLeftRadius: 24, borderBottomRightRadius: 24, paddingBottom: 20, marginBottom: 12 }]}
      >
        {/* Water Ripple Decor Circles */}
        <View style={homeStyles.decorCircle1} />
        <View style={homeStyles.decorCircle2} />

        {/* AquaTrack Multi-Colored Brand Row */}
        <View style={homeStyles.brandRow}>
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

        {/* Page Greeting & Subtitle */}
        <View style={homeStyles.greetingContainer}>
          <Text style={homeStyles.greetingText}>Contact Support</Text>
          <View style={homeStyles.locationPill}>
            <AppIcon name="call-outline" size={13} color="#E0F2FE" />
            <Text style={homeStyles.locationText}>City Water District hotlines & branch directory</Text>
          </View>
        </View>
      </LinearGradient>

      <View style={styles.contentPadding}>
        
        {/* ================= CARD 1: MAIN OFFICE ================= */}
        <View style={styles.card}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionHeaderLeft}>
              <View style={styles.sectionHeaderIconWrap}>
                <AppIcon name="business-outline" size={18} color="#0284C7" />
              </View>
              <View>
                <Text style={styles.sectionTitle}>Main Office (Sto. Rosario)</Text>
                <Text style={styles.sectionSubtitle}>City of San Fernando Water District</Text>
              </View>
            </View>
            <View style={styles.statusBadge}>
              <Text style={styles.statusBadgeText}>Open Mon-Fri</Text>
            </View>
          </View>

          {/* Location Block */}
          <View style={styles.infoBlock}>
            <View style={styles.infoRow}>
              <View style={styles.infoIconCol}>
                <AppIcon name="location-outline" size={18} color="#0284C7" />
              </View>
              <View style={styles.infoContentCol}>
                <Text style={styles.infoLabel}>OFFICE ADDRESS</Text>
                <Text style={styles.infoValue}>
                  B. Mendoza Street, Sto. Rosario, 2000 San Fernando, Pampanga
                </Text>
                <Text style={styles.infoSubtext}>Operating Hours: 8:00 AM – 5:00 PM</Text>
              </View>
            </View>
          </View>

          {/* Email Block */}
          <TouchableOpacity 
            style={styles.infoBlock}
            activeOpacity={0.75}
            onPress={() => handleEmail('csfwd@yahoo.com')}
          >
            <View style={styles.infoRow}>
              <View style={styles.infoIconCol}>
                <AppIcon name="mail-outline" size={18} color="#0284C7" />
              </View>
              <View style={styles.infoContentCol}>
                <Text style={styles.infoLabel}>OFFICIAL EMAIL</Text>
                <Text style={styles.infoValueLink}>csfwd@yahoo.com</Text>
                <Text style={styles.infoSubtext}>Tap to send direct email inquiry</Text>
              </View>
            </View>
          </TouchableOpacity>

          {/* Direct Landline Hotlines */}
          <Text style={[styles.infoLabel, { marginTop: 4, marginBottom: 8 }]}>MAIN OFFICE HOTLINES</Text>
          <View style={styles.hotlineList}>
            {mainOfficeHotlines.map((hotline, idx) => (
              <View key={idx} style={styles.hotlineItem}>
                <View style={styles.hotlineInfo}>
                  <Text style={styles.hotlineTitle}>{hotline.title}</Text>
                  <Text style={styles.hotlineNumber}>{hotline.phone}</Text>
                </View>
                <TouchableOpacity 
                  style={styles.callButton}
                  activeOpacity={0.8}
                  onPress={() => handleDial(hotline.raw)}
                >
                  <AppIcon name="call" size={13} color="#FFFFFF" />
                  <Text style={styles.callButtonText}>Call</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>

          {/* Mobile Hotlines */}
          <Text style={[styles.infoLabel, { marginTop: 12, marginBottom: 6 }]}>MOBILE HELPLINES</Text>
          <View style={styles.mobileHotlinesRow}>
            <TouchableOpacity 
              style={styles.mobileHotlineChip}
              activeOpacity={0.8}
              onPress={() => handleDial('09688541343')}
            >
              <AppIcon name="phone" size={14} color="#0284C7" />
              <Text style={styles.mobileHotlineText}>0968-854-1343</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.mobileHotlineChip}
              activeOpacity={0.8}
              onPress={() => handleDial('09338146585')}
            >
              <AppIcon name="phone" size={14} color="#0284C7" />
              <Text style={styles.mobileHotlineText}>0933-8146585</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ================= CARD 2: SUB OFFICES ================= */}
        <View style={styles.card}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionHeaderLeft}>
              <View style={styles.sectionHeaderIconWrap}>
                <AppIcon name="building-outline" size={18} color="#0284C7" />
              </View>
              <View>
                <Text style={styles.sectionTitle}>District Sub-Offices</Text>
                <Text style={styles.sectionSubtitle}>Payment Centers & Branch Inquiries</Text>
              </View>
            </View>
          </View>

          {subOffices.map((office, idx) => (
            <View key={idx} style={styles.branchItem}>
              <View style={styles.branchItemHeader}>
                <Text style={styles.branchName}>{office.name}</Text>
                {office.phone && (
                  <TouchableOpacity 
                    style={styles.callButton}
                    activeOpacity={0.8}
                    onPress={() => handleDial(office.rawPhone)}
                  >
                    <AppIcon name="call" size={13} color="#FFFFFF" />
                    <Text style={styles.callButtonText}>{office.phone}</Text>
                  </TouchableOpacity>
                )}
              </View>

              <View style={styles.branchAddressRow}>
                <AppIcon name="location-outline" size={15} color="#64748B" style={{ marginTop: 2 }} />
                <Text style={styles.branchDetail}>{office.address}</Text>
              </View>

              <View style={styles.branchActionRow}>
                <Text style={styles.branchHoursText}>Hours: {office.hours}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* ================= CARD 3: QUICK INCIDENT REPORT BANNER ================= */}
        <View style={styles.ticketBanner}>
          <View style={styles.ticketBannerIconWrap}>
            <AppIcon name="alert-circle" size={20} color="#FFFFFF" />
          </View>
          <View style={styles.ticketBannerContent}>
            <Text style={styles.ticketBannerTitle}>Water Issue or Leak?</Text>
            <Text style={styles.ticketBannerDesc}>
              File a photo and GPS-tagged incident report directly for rapid field technician response.
            </Text>
          </View>
          <TouchableOpacity 
            style={styles.ticketBannerBtn}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('FileComplaint')}
          >
            <Text style={styles.ticketBannerBtnText}>File Ticket</Text>
          </TouchableOpacity>
        </View>

      </View>
    </ScrollView>
  );
}
