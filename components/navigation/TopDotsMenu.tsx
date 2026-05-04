import React, { useState } from 'react';
import { TouchableOpacity, Platform } from 'react-native';
import { Menu, IconButton } from 'react-native-paper';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { useAuthStore } from '@/store/authStore';
import { Colors } from '@/constants/colors';

export const TopDotsMenu = () => {
  const [visible, setVisible] = useState(false);
  const router = useRouter();
  const { logout } = useAuth();
  const setRole = useAuthStore((s) => s.setRole);

  const openMenu = () => setVisible(true);
  const closeMenu = () => setVisible(false);

  const handleOrders = () => {
    closeMenu();
    router.push('/(buyer)/orders');
  };

  const handleSwitchToFarmer = () => {
    closeMenu();
    setRole('farmer');
    router.replace('/(farmer)/dashboard');
  };

  const handleLogout = () => {
    closeMenu();
    logout();
  };

  return (
    <Menu
      visible={visible}
      onDismiss={closeMenu}
      anchor={
        <TouchableOpacity 
          onPress={openMenu}
          activeOpacity={0.7}
          style={{ marginRight: 16, padding: 4 }}
        >
          <Feather name="more-vertical" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
      }
      contentStyle={{ backgroundColor: '#fff', borderRadius: 16, paddingVertical: 4 }}
    >
      <Menu.Item 
        onPress={handleOrders} 
        title="My Orders" 
        leadingIcon={() => <Feather name="shopping-bag" size={18} color={Colors.textPrimary} />}
      />
      <Menu.Item 
        onPress={() => { closeMenu(); router.push('/(buyer)/categories'); }} 
        title="Browse categories" 
        leadingIcon={() => <Feather name="grid" size={18} color={Colors.textPrimary} />}
      />
      <Menu.Item 
        onPress={() => { closeMenu(); router.push('/(buyer)/cart'); }} 
        title="My Cart" 
        leadingIcon={() => <Feather name="shopping-cart" size={18} color={Colors.textPrimary} />}
      />
      <Menu.Item 
        onPress={() => { closeMenu(); router.push('/(buyer)/profile'); }} 
        title="My Profile" 
        leadingIcon={() => <Feather name="user" size={18} color={Colors.textPrimary} />}
      />
      <Menu.Item 
        onPress={handleSwitchToFarmer} 
        title="Switch to Farmer" 
        titleStyle={{ color: Colors.primary, fontWeight: '700' }}
        leadingIcon={() => <Feather name="refresh-cw" size={18} color={Colors.primary} />}
      />
      <Menu.Item 
        onPress={handleLogout} 
        title="Log Out" 
        titleStyle={{ color: Colors.error }}
        leadingIcon={() => <Feather name="log-out" size={18} color={Colors.error} />}
      />
    </Menu>
  );
};
