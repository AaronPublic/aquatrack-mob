import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
  Platform,
} from 'react-native';
import AppIcon from './AppIcon';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function MobileDataPrivacyModal({
  visible,
  onClose,
  onAgree,
  userRoleLabel = 'Resident Concessionaire',
}) {
  const [agreedNameAddress, setAgreedNameAddress] = useState(false);
  const [agreedContactNotifs, setAgreedContactNotifs] = useState(false);
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [showWarning, setShowWarning] = useState(false);

  const allChecked = agreedNameAddress && agreedContactNotifs && agreedTerms;

  const handleConfirm = () => {
    if (!allChecked) {
      setShowWarning(true);
      return;
    }
    setShowWarning(false);
    onAgree();
  };

  const handleModalClose = () => {
    setShowWarning(false);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleModalClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <View style={styles.iconBadge}>
                <AppIcon name="shield-checkmark" size={22} color="#ffffff" />
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.pillBadge}>
                  <AppIcon name="lock-closed" size={10} color="#001e66" style={{ marginRight: 4 }} />
                  <Text style={styles.pillBadgeText}>DATA PRIVACY &amp; CONSENT</Text>
                </View>
                <Text style={styles.titleText}>Data Privacy Terms</Text>
                <Text style={styles.subtitleText}>
                  City of San Fernando Water District &bull; {userRoleLabel}
                </Text>
              </View>
              <TouchableOpacity
                onPress={handleModalClose}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                style={styles.closeBtn}
              >
                <AppIcon name="close" size={20} color="#64748b" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Body */}
          <ScrollView
            style={styles.scrollBody}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.introParagraph}>
              In compliance with Republic Act No. 10173 (Philippine Data Privacy Act of 2012),{' '}
              <Text style={{ fontWeight: '800', color: '#001e66' }}>AquaTrack</Text> respects and values your privacy. Please review and acknowledge how your personal information is collected and processed:
            </Text>

            {/* Clause 1: Name & Address */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                setAgreedNameAddress(!agreedNameAddress);
                if (showWarning) setShowWarning(false);
              }}
              style={[
                styles.clauseCard,
                agreedNameAddress && styles.clauseCardChecked,
              ]}
            >
              <View
                style={[
                  styles.checkbox,
                  agreedNameAddress && styles.checkboxChecked,
                ]}
              >
                {agreedNameAddress && (
                  <AppIcon name="checkmark" size={13} color="#ffffff" />
                )}
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.clauseTitleRow}>
                  <AppIcon name="person" size={13} color="#0284c7" style={{ marginRight: 4 }} />
                  <Text style={styles.clauseTitle}>
                    Full Name &amp; Complete Address
                  </Text>
                </View>
                <Text style={styles.clauseDescription}>
                  I agree to the collection of my <Text style={styles.boldText}>full name</Text> and <Text style={styles.boldText}>complete address</Text>. This information is strictly used to <Text style={styles.boldText}>verify my identity</Text> and to <Text style={styles.boldText}>map the precise spatial location of submitted water complaints</Text>.
                </Text>
              </View>
            </TouchableOpacity>

            {/* Clause 2: Email & Phone */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                setAgreedContactNotifs(!agreedContactNotifs);
                if (showWarning) setShowWarning(false);
              }}
              style={[
                styles.clauseCard,
                agreedContactNotifs && styles.clauseCardChecked,
              ]}
            >
              <View
                style={[
                  styles.checkbox,
                  agreedContactNotifs && styles.checkboxChecked,
                ]}
              >
                {agreedContactNotifs && (
                  <AppIcon name="checkmark" size={13} color="#ffffff" />
                )}
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.clauseTitleRow}>
                  <AppIcon name="mail" size={13} color="#00aeef" style={{ marginRight: 4 }} />
                  <Text style={styles.clauseTitle}>
                    Email Address &amp; Cellphone Number
                  </Text>
                </View>
                <Text style={styles.clauseDescription}>
                  I agree to the collection of my <Text style={styles.boldText}>email</Text> and <Text style={styles.boldText}>phone number</Text>. This information is strictly used to <Text style={styles.boldText}>send critical notifications, emergency water advisories, and ticket resolution updates</Text>.
                </Text>
              </View>
            </TouchableOpacity>

            {/* Clause 3: Terms & Security */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                setAgreedTerms(!agreedTerms);
                if (showWarning) setShowWarning(false);
              }}
              style={[
                styles.clauseCard,
                agreedTerms && styles.clauseCardChecked,
              ]}
            >
              <View
                style={[
                  styles.checkbox,
                  agreedTerms && styles.checkboxChecked,
                ]}
              >
                {agreedTerms && (
                  <AppIcon name="checkmark" size={13} color="#ffffff" />
                )}
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.clauseTitleRow}>
                  <AppIcon name="shield-checkmark" size={13} color="#10b981" style={{ marginRight: 4 }} />
                  <Text style={styles.clauseTitle}>
                    Data Confidentiality Guarantee
                  </Text>
                </View>
                <Text style={styles.clauseDescription}>
                  I acknowledge that my personal information will be stored securely with encryption, will remain confidential, and will never be disclosed or sold to unauthorized third parties.
                </Text>
              </View>
            </TouchableOpacity>

            {showWarning && (
              <View style={styles.warningBox}>
                <AppIcon name="alert-circle" size={16} color="#d97706" style={{ marginRight: 6 }} />
                <Text style={styles.warningText}>
                  Please check and agree to all terms above before creating your account.
                </Text>
              </View>
            )}
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity
              onPress={handleModalClose}
              style={styles.cancelBtn}
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleConfirm}
              style={[
                styles.agreeBtn,
                !allChecked && styles.agreeBtnDisabled,
              ]}
            >
              <AppIcon name="checkmark-circle" size={16} color="#ffffff" style={{ marginRight: 6 }} />
              <Text style={styles.agreeBtnText}>I Agree &amp; Continue</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 18,
  },
  modalCard: {
    width: '100%',
    maxWidth: 460,
    maxHeight: SCREEN_HEIGHT * 0.85,
    backgroundColor: '#ffffff',
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    backgroundColor: '#f8fafc',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBadge: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#001e66',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  pillBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#e0f2fe',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 999,
    marginBottom: 3,
  },
  pillBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#001e66',
    letterSpacing: 0.5,
  },
  titleText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#001e66',
    letterSpacing: -0.3,
  },
  subtitleText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748b',
    marginTop: 1,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 10,
  },
  scrollBody: {
    paddingHorizontal: 18,
    paddingTop: 14,
  },
  scrollContent: {
    paddingBottom: 16,
  },
  introParagraph: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 18,
    marginBottom: 14,
  },
  clauseCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
  },
  clauseCardChecked: {
    backgroundColor: '#f0f9ff',
    borderColor: '#7dd3fc',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#94a3b8',
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: '#00aeef',
    borderColor: '#00aeef',
  },
  clauseTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  clauseTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: '#001e66',
  },
  clauseDescription: {
    fontSize: 11,
    color: '#64748b',
    lineHeight: 16,
  },
  boldText: {
    fontWeight: '800',
    color: '#0f172a',
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fde68a',
    borderRadius: 12,
    padding: 10,
    marginTop: 4,
  },
  warningText: {
    flex: 1,
    fontSize: 11,
    fontWeight: '700',
    color: '#b45309',
    lineHeight: 15,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    backgroundColor: '#f8fafc',
    gap: 10,
  },
  cancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  cancelBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  agreeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#001e66',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 12,
  },
  agreeBtnDisabled: {
    backgroundColor: '#94a3b8',
    opacity: 0.8,
  },
  agreeBtnText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#ffffff',
  },
});
