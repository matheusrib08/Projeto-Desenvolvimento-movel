import React from 'react';
import { TouchableOpacity } from 'react-native';
import { DarkTheme, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';

import HomeScreen from '../screens/HomeScreen';
import ExerciseListScreen from '../screens/ExerciseListScreen';
import ExerciseFormScreen from '../screens/ExerciseFormScreen';
import WorkoutSetupScreen from '../screens/WorkoutSetupScreen';
import ActiveWorkoutScreen from '../screens/ActiveWorkoutScreen';
import HistoryScreen from '../screens/HistoryScreen';
import WorkoutDetailScreen from '../screens/WorkoutDetailScreen';
import ProgressScreen from '../screens/ProgressScreen';
import SettingsScreen from '../screens/SettingsScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const navTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: colors.bg,
    card: colors.card,
    text: colors.text,
    border: colors.border,
    primary: colors.primary,
  },
};

const ICONS = {
  Home: ['home', 'home-outline'],
  Exercicios: ['list', 'list-outline'],
  Treinar: ['play-circle', 'play-circle-outline'],
  Historico: ['time', 'time-outline'],
  Progresso: ['trending-up', 'trending-up-outline'],
};

function Tabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerStyle: { backgroundColor: colors.card },
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: '800' },
        tabBarStyle: { backgroundColor: colors.card, borderTopColor: colors.border },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarIcon: ({ focused, color, size }) => (
          <Ionicons name={ICONS[route.name][focused ? 0 : 1]} size={size} color={color} />
        ),
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={({ navigation }) => ({
          title: 'GymLog',
          tabBarLabel: 'Início',
          headerRight: () => (
            <TouchableOpacity onPress={() => navigation.navigate('Configuracoes')} style={{ marginRight: 16 }}>
              <Ionicons name="settings-outline" size={24} color={colors.text} />
            </TouchableOpacity>
          ),
        })}
      />
      <Tab.Screen name="Exercicios" component={ExerciseListScreen} options={{ title: 'Exercícios', tabBarLabel: 'Exercícios' }} />
      <Tab.Screen name="Treinar" component={WorkoutSetupScreen} options={{ title: 'Treinar', tabBarLabel: 'Treinar' }} />
      <Tab.Screen name="Historico" component={HistoryScreen} options={{ title: 'Histórico', tabBarLabel: 'Histórico' }} />
      <Tab.Screen name="Progresso" component={ProgressScreen} options={{ title: 'Meu progresso', tabBarLabel: 'Progresso' }} />
    </Tab.Navigator>
  );
}

export default function Navigation() {
  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: colors.card },
          headerTintColor: colors.text,
          headerTitleStyle: { fontWeight: '800' },
          contentStyle: { backgroundColor: colors.bg },
        }}
      >
        <Stack.Screen name="Tabs" component={Tabs} options={{ headerShown: false }} />
        <Stack.Screen name="FormExercicio" component={ExerciseFormScreen} options={{ title: 'Exercício' }} />
        <Stack.Screen
          name="TreinoAtivo"
          component={ActiveWorkoutScreen}
          options={{ title: 'Treino em andamento', gestureEnabled: false }}
        />
        <Stack.Screen name="DetalheTreino" component={WorkoutDetailScreen} options={{ title: 'Detalhes do treino' }} />
        <Stack.Screen name="Configuracoes" component={SettingsScreen} options={{ title: 'Configurações' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
