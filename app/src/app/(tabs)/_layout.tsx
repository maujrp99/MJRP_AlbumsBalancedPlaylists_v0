/**
 * The bottom tab bar (docs/specs/info-arch.md, «Navegação no celular»): five destinations, Home,
 * Albums, Blend, Playlists, Inventory; the current one in orange; 56 px plus the safe area; 12 px
 * labels. Expo Router's JavaScript `Tabs` (React Navigation's bottom tabs), not the template's
 * `NativeTabs`: the design's own colours and measures, and a bar the component tests can render.
 * Nobody signed in: the sign-in screen.
 */
import { Redirect, Tabs } from 'expo-router'
import { Text, View } from 'react-native'
import type { ColorValue } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useAccount } from '../../ui/AppServicesContext'
import { CenteredState, styles as parts } from '../../ui/parts'
import { colors, size } from '../../ui/theme'

// Glyphs stand in for the 24 px icons until the icon set is chosen (TASK-18, the design round).
function glyph(mark: string) {
    return function TabGlyph({ color }: { color: ColorValue }) {
        return <Text style={{ color, fontSize: 20, lineHeight: 24 }}>{mark}</Text>
    }
}

/** The skeleton opens on Albums, the one destination it builds. */
export const unstable_settings = { anchor: 'albums' } // Expo Router 58: `anchor` (initialRouteName is deprecated)

export const DESTINATIONS = [
    { name: 'index', title: 'Home', mark: '⌂' },
    { name: 'albums', title: 'Albums', mark: '◫' },
    { name: 'blend', title: 'Blend', mark: '◎' },
    { name: 'playlists', title: 'Playlists', mark: '≡' },
    { name: 'inventory', title: 'Inventory', mark: '▤' }
] as const

export default function TabsLayout() {
    const account = useAccount()
    const insets = useSafeAreaInsets()
    if (account === undefined) return <View style={parts.screen}><CenteredState busy title="Opening…" /></View>
    if (account === null) return <Redirect href="/sign-in" />
    return (
        <Tabs
            backBehavior="initialRoute" // Android's back goes to the anchor, Albums (Expo Router 58 asks it with an anchor)
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: colors.accent,
                tabBarInactiveTintColor: colors.textMuted,
                tabBarStyle: { backgroundColor: colors.bar, borderTopColor: colors.border, height: size.bottomBar + insets.bottom, paddingBottom: insets.bottom },
                tabBarLabelStyle: { fontSize: 12, lineHeight: 16, fontWeight: '700' },
                tabBarItemStyle: { minHeight: size.target }
            }}
        >
            {DESTINATIONS.map(({ name, title, mark }) => (
                <Tabs.Screen key={name} name={name} options={{ title, tabBarLabel: title, tabBarIcon: glyph(mark), tabBarAccessibilityLabel: title }} />
            ))}
        </Tabs>
    )
}
