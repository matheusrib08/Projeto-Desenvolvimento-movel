import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { ActivityIndicator, Animated, StyleSheet, Text, Vibration, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { DEFAULT_SETTINGS, initDatabase, loadSettings, saveSetting } from '../db/database';
import { colors, radius } from '../theme';

const AppContext = createContext(null);

export function useApp() {
  return useContext(AppContext);
}

const safe = (promiseLike) => {
  try {
    Promise.resolve(promiseLike).catch(() => {});
  } catch (e) {
    /* ignora dispositivos sem suporte */
  }
};

export function AppProvider({ children }) {
  const insets = useSafeAreaInsets();
  const [ready, setReady] = useState(false);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [toast, setToast] = useState(null);
  const anim = useRef(new Animated.Value(0)).current;
  const timer = useRef(null);

  // Inicializa banco + carrega configurações
  useEffect(() => {
    (async () => {
      try {
        await initDatabase();
        setSettings(await loadSettings());
      } catch (e) {
        console.error('Erro ao iniciar o banco', e);
      }
      setReady(true);
    })();
  }, []);

  const updateSetting = useCallback(async (key, value) => {
    setSettings((s) => ({ ...s, [key]: value }));
    await saveSetting(key, value);
  }, []);

  // Feedback visual: toast animado
  const showToast = useCallback(
    (message, type = 'success') => {
      if (timer.current) clearTimeout(timer.current);
      setToast({ message, type });
      Animated.timing(anim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
      timer.current = setTimeout(() => {
        Animated.timing(anim, { toValue: 0, duration: 250, useNativeDriver: true }).start(() =>
          setToast(null)
        );
      }, 2300);
    },
    [anim]
  );

  // Feedback tátil (atuador): vibração
  const feedback = useMemo(
    () => ({
      tap: () => settings.haptics && safe(Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)),
      success: () =>
        settings.haptics &&
        safe(Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)),
      error: () =>
        settings.haptics && safe(Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)),
      rest: () => settings.haptics && Vibration.vibrate([0, 400, 150, 400]),
    }),
    [settings.haptics]
  );

  const value = useMemo(
    () => ({ settings, updateSetting, showToast, feedback }),
    [settings, updateSetting, showToast, feedback]
  );

  if (!ready) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const isError = toast && toast.type === 'error';

  return (
    <AppContext.Provider value={value}>
      {children}
      {toast ? (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.toast,
            {
              top: insets.top + 8,
              backgroundColor: isError ? colors.danger : colors.accent,
              opacity: anim,
              transform: [
                { translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) },
              ],
            },
          ]}
        >
          <Ionicons
            name={isError ? 'alert-circle' : 'checkmark-circle'}
            size={20}
            color={isError ? '#fff' : '#06231D'}
          />
          <Text style={[styles.toastText, { color: isError ? '#fff' : '#06231D' }]}>
            {toast.message}
          </Text>
        </Animated.View>
      ) : null}
    </AppContext.Provider>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' },
  toast: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: radius.md,
    elevation: 10,
    zIndex: 100,
  },
  toastText: { marginLeft: 10, fontWeight: '700', flex: 1 },
});
