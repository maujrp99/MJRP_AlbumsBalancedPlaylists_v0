/**
 * The root of the app (Expo Router: every file of src/app is a route). The platform wiring runs
 * first, once, before any screen (src/platform/wiring.ts); then the composition root decides the
 * adapters (src/composition.ts) and hands them to the screens.
 */
import { useState } from 'react'
import { LogBox } from 'react-native'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { wirePlatform } from '../platform/wiring'
import { composeServices } from '../composition'
import { AppServicesProvider } from '../ui/AppServicesContext'
import { colors } from '../ui/theme'
import { DemoLaunchRunner } from '../demo/demoLaunch'

wirePlatform()

// React Native's own development-only warning when an animated value updates with no JS listener
// (seen on the simulator, 2026-11-20, on tab changes); not the app's. Development builds only.
LogBox.ignoreLogs(['Sending `onAnimatedValueUpdate` with no listeners registered.'])

export default function RootLayout() {
    const [services] = useState(composeServices)
    return (
        <SafeAreaProvider>
            <AppServicesProvider services={services}>
                <StatusBar style="light" />
                <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
                    <Stack.Screen name="(tabs)" />
                    <Stack.Screen name="sign-in" />
                    <Stack.Screen name="diagnostics" options={{ presentation: 'modal' }} />
                </Stack>
                {services.mode === 'demo' ? <DemoLaunchRunner /> : null}
            </AppServicesProvider>
        </SafeAreaProvider>
    )
}
