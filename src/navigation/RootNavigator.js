import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import AppIcon from '../../components/AppIcon';
import { supabase } from '../config/supabase';
import { theme } from '../config/theme';
import { useAuthStore } from '../store/useAuthStore';
import { requestUserPermission, registerNotificationListeners } from '../config/fcm';

// Auth Screens
import Login from '../../components/authpages/Login';
import Register from '../../components/authpages/Register';

// Consumer Screens
import ConsumerHome from '../../components/consumerpages/ConsumerHome';
import FileComplaint from '../../components/consumerpages/FileComplaint';
import TrackComplaints from '../../components/consumerpages/TrackComplaints';
import Announcements from '../../components/consumerpages/Announcements';
import ContactSupport from '../../components/consumerpages/ContactSupport';
import ManageAccount from '../../components/consumerpages/ManageAccount';
import ComplaintHistory from '../../components/consumerpages/ComplaintHistory';

// Sub-Admin Screens
import SubAdminHome from '../../components/subadminpages/SubAdminHome';
import SubAdminComplaints from '../../components/subadminpages/SubAdminComplaints';
import SubAdminTelemetry from '../../components/subadminpages/SubAdminTelemetry';
import SubAdminAdvisories from '../../components/subadminpages/SubAdminAdvisories';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const getTabBarOptions = () => ({
  tabBarActiveTintColor: theme.colors.accent,
  tabBarInactiveTintColor: theme.colors.textMuted,
  tabBarShowLabel: false,
  tabBarStyle: {
    backgroundColor: theme.colors.white,
    borderWidth: 1,
    borderColor: theme.colors.border,
    height: 64,
    borderRadius: 24,
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    paddingBottom: 0,
    shadowColor: '#0B1C3F',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 8,
  },
  headerStyle: {
    backgroundColor: theme.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    elevation: 0,
    shadowOpacity: 0,
  },
  headerTitleStyle: {
    fontSize: 12,
    fontWeight: 'black',
    color: theme.colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});

function ConsumerTabNavigator() {
  return (
    <Tab.Navigator 
      screenOptions={({ route }) => ({
        ...getTabBarOptions(),
        tabBarActiveTintColor: theme.colors.accent,
        tabBarIcon: ({ color, size, focused }) => {
          let iconName;
          if (route.name === 'ConsumerHome') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'FileComplaint') {
            iconName = focused ? 'document-text' : 'document-text-outline';
          } else if (route.name === 'TrackComplaints') {
            iconName = focused ? 'ticket' : 'ticket-outline';
          } else if (route.name === 'Announcements') {
            iconName = focused ? 'megaphone' : 'megaphone-outline';
          }
          
          return (
            <View style={{ alignItems: 'center', justifyContent: 'center', height: '100%', paddingTop: 4 }}>
              <AppIcon name={iconName} size={20} color={color} />
              {focused && (
                <View 
                  style={{ 
                    width: 4, 
                    height: 4, 
                    borderRadius: 2, 
                    backgroundColor: color, 
                    marginTop: 4 
                  }} 
                />
              )}
            </View>
          );
        },
      })}
    >
      <Tab.Screen 
        name="ConsumerHome" 
        component={ConsumerHome} 
        options={{ title: 'Home', headerShown: false }} 
      />
      <Tab.Screen 
        name="FileComplaint" 
        component={FileComplaint} 
        options={{ title: 'Report', headerShown: false }} 
      />
      <Tab.Screen 
        name="TrackComplaints" 
        component={TrackComplaints} 
        options={{ title: 'Tickets', headerShown: false }} 
      />
      <Tab.Screen 
        name="Announcements" 
        component={Announcements} 
        options={{ title: 'Advisories', headerShown: false }} 
      />
      <Tab.Screen 
        name="ManageAccount" 
        component={ManageAccount} 
        options={{ title: 'Account', headerShown: false, tabBarButton: () => null }} 
      />
      <Tab.Screen 
        name="ComplaintHistory" 
        component={ComplaintHistory} 
        options={{ title: 'Archived', headerShown: false, tabBarButton: () => null }} 
      />
    </Tab.Navigator>
  );
}

function SubAdminTabNavigator() {
  return (
    <Tab.Navigator 
      screenOptions={({ route }) => ({
        ...getTabBarOptions(),
        tabBarActiveTintColor: theme.colors.accent,
        tabBarIcon: ({ color, size, focused }) => {
          let iconName;
          if (route.name === 'SubAdminHome') {
            iconName = focused ? 'construct' : 'construct-outline';
          } else if (route.name === 'SubAdminComplaints') {
            iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
          } else if (route.name === 'SubAdminTelemetry') {
            iconName = focused ? 'pulse' : 'pulse-outline';
          } else if (route.name === 'SubAdminAdvisories') {
            iconName = focused ? 'notifications' : 'notifications-outline';
          }
          
          return (
            <View style={{ alignItems: 'center', justifyContent: 'center', height: '100%', paddingTop: 4 }}>
              <AppIcon name={iconName} size={20} color={color} />
              {focused && (
                <View 
                  style={{ 
                    width: 4, 
                    height: 4, 
                    borderRadius: 2, 
                    backgroundColor: color, 
                    marginTop: 4 
                  }} 
                />
              )}
            </View>
          );
        },
      })}
    >
      <Tab.Screen 
        name="SubAdminHome" 
        component={SubAdminHome} 
        options={{ title: 'My Job', headerShown: false }} 
      />
      <Tab.Screen 
        name="SubAdminComplaints" 
        component={SubAdminComplaints} 
        options={{ title: 'Triage', headerShown: false }} 
      />
      <Tab.Screen 
        name="SubAdminTelemetry" 
        component={SubAdminTelemetry} 
        options={{ title: 'Telemetry', headerShown: false }} 
      />
      <Tab.Screen 
        name="SubAdminAdvisories" 
        component={SubAdminAdvisories} 
        options={{ title: 'Advisories', headerShown: false }} 
      />
      <Tab.Screen 
        name="ManageAccount" 
        component={ManageAccount} 
        options={{ title: 'Account', headerShown: false, tabBarButton: () => null }} 
      />
      <Tab.Screen 
        name="ComplaintHistory" 
        component={ComplaintHistory} 
        options={{ title: 'Archived', headerShown: false, tabBarButton: () => null }} 
      />
    </Tab.Navigator>
  );
}

export default function RootNavigator() {
  const { session, profile, loading, setSession, fetchProfile, signOut } = useAuthStore();

  useEffect(() => {
    // Sync initial session on mount
    const syncSession = async () => {
      const { data: { session: activeSession } } = await supabase.auth.getSession();
      if (activeSession) {
        const profileResult = await fetchProfile(activeSession.user.id);
        if (profileResult && profileResult.role === 'ADMIN') {
          await supabase.auth.signOut();
          useAuthStore.setState({ session: null, profile: null });
        } else {
          setSession(activeSession);
          if (profileResult) {
            await requestUserPermission(activeSession.user.id);
          }
        }
      } else {
        setSession(null);
        useAuthStore.setState({ profile: null });
      }
    };
    
    syncSession();

    // Listen to Supabase Auth State changes and sync with Zustand
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (newSession) {
        const fetchedProfile = await fetchProfile(newSession.user.id);
        if (fetchedProfile && fetchedProfile.role === 'ADMIN') {
          await supabase.auth.signOut();
          useAuthStore.setState({ session: null, profile: null });
        } else {
          setSession(newSession);
          if (fetchedProfile) {
            await requestUserPermission(newSession.user.id);
          }
        }
      } else {
        setSession(null);
        useAuthStore.setState({ profile: null });
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Notification handler setup inside navigation stack mount context
  useEffect(() => {
    if (session) {
      const unsubscribe = registerNotificationListeners();
      return unsubscribe;
    }
  }, [session]);

  if (loading && !session) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f1f5f9' }}>
        <ActivityIndicator color="#001e66" size="large" />
      </View>
    );
  }

  const initialRoute = session
    ? profile?.role === 'FIELD_ENGINEER_TECHNICIAN'
      ? 'SubAdminTab'
      : 'ConsumerTab'
    : 'Login';

  return (
    <Stack.Navigator 
      initialRouteName={initialRoute}
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right'
      }}
    >
      {!session ? (
        <>
          <Stack.Screen name="Login" component={Login} />
          <Stack.Screen name="Register" component={Register} />
        </>
      ) : (
        <>
          {profile?.role === 'FIELD_ENGINEER_TECHNICIAN' ? (
            <Stack.Screen name="SubAdminTab" component={SubAdminTabNavigator} />
          ) : (
            <Stack.Screen name="ConsumerTab" component={ConsumerTabNavigator} />
          )}
          <Stack.Screen 
            name="ContactSupport" 
            component={ContactSupport} 
            options={{ 
              headerShown: true, 
              headerTitle: 'CONTACT SUPPORT',
              headerTintColor: theme.colors.primary,
              headerTitleStyle: { fontSize: 13, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1 },
              headerStyle: { backgroundColor: theme.colors.white, borderBottomWidth: 1, borderBottomColor: theme.colors.border }
            }} 
          />
        </>
      )}
    </Stack.Navigator>
  );
}
