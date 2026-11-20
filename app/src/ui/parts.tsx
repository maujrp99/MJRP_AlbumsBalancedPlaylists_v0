/**
 * The small native parts the skeleton's screens share: the low top bar with the screen's name, the
 * primary button (48 px, orange) and the secondary one (44 px), and a centred state (loading, empty,
 * error, not yet) with a sentence and an optional action. Measures: docs/specs/design-system.md § Celular.
 */
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native'
import type { ReactNode } from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { colors, size, type } from './theme'

/** `inSheet`: the bar of a screen shown as an iOS sheet, which starts below the status bar (no top inset). */
export function TopBar({ title, onLongPress, inSheet = false }: { title: string; onLongPress?: () => void; inSheet?: boolean }) {
    const insets = useSafeAreaInsets()
    const top = inSheet ? 0 : insets.top
    return (
        <View style={[styles.topBar, { paddingTop: top, height: size.topBar + top }]}>
            <Pressable onLongPress={onLongPress} delayLongPress={800} accessibilityRole="header" style={styles.topBarTitleArea}>
                <Text style={styles.topBarTitle} numberOfLines={1}>{title}</Text>
            </Pressable>
        </View>
    )
}

export function PrimaryButton({ label, onPress, disabled }: { label: string; onPress: () => void; disabled?: boolean }) {
    return (
        <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: !!disabled }}
            disabled={disabled}
            onPress={onPress}
            style={({ pressed }) => [styles.primary, (pressed || disabled) && styles.primaryDimmed]}
        >
            <Text style={styles.primaryLabel}>{label}</Text>
        </Pressable>
    )
}

export function SecondaryButton({ label, onPress, disabled }: { label: string; onPress: () => void; disabled?: boolean }) {
    return (
        <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: !!disabled }}
            disabled={disabled}
            onPress={onPress}
            style={({ pressed }) => [styles.secondary, (pressed || disabled) && styles.secondaryDimmed]}
        >
            <Text style={styles.secondaryLabel}>{label}</Text>
        </Pressable>
    )
}

export function CenteredState({ title, detail, busy, children, testID }: { title: string; detail?: string; busy?: boolean; children?: ReactNode; testID?: string }) {
    return (
        <View style={styles.state} testID={testID}>
            {busy ? <ActivityIndicator color={colors.accent} accessibilityLabel={title} /> : null}
            <Text style={styles.stateTitle} accessibilityRole="text">{title}</Text>
            {detail ? <Text style={styles.stateDetail}>{detail}</Text> : null}
            {children ? <View style={styles.stateActions}>{children}</View> : null}
        </View>
    )
}

export const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    topBar: { backgroundColor: colors.bar, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border, justifyContent: 'center', paddingHorizontal: size.margin },
    topBarTitleArea: { minHeight: size.target, justifyContent: 'center' },
    topBarTitle: { ...type.screenTitle, color: colors.text },
    primary: { minHeight: size.primaryButton, borderRadius: 12, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
    primaryDimmed: { opacity: 0.6 },
    primaryLabel: { ...type.body, fontWeight: '700', color: colors.text },
    secondary: { minHeight: size.target, borderRadius: 12, backgroundColor: colors.raised, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 },
    secondaryDimmed: { opacity: 0.6 },
    secondaryLabel: { ...type.secondary, fontWeight: '600', color: colors.text },
    state: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: size.margin * 2, gap: 12 },
    stateTitle: { ...type.title, color: colors.text, textAlign: 'center' },
    stateDetail: { ...type.secondary, color: colors.textSecondary, textAlign: 'center' },
    stateActions: { marginTop: 8, alignSelf: 'stretch', gap: 12 }
})
