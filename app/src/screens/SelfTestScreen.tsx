/**
 * The self-test of the core (F78, REQ-16): a hidden diagnostics screen (long press on the Albums
 * title, or the link albumblender://diagnostics) that runs the golden corpus on this device's
 * engine and shows «N of N match». The Maestro flow of TASK-23 will open it and read that line.
 */
import { useState } from 'react'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { matchLine, passed } from '../selftest/goldenSelfTest'
import type { SelfTestResult } from '../selftest/goldenSelfTest'
import { PrimaryButton, TopBar, styles as parts } from '../ui/parts'
import { colors, size, type } from '../ui/theme'

type State = { kind: 'idle' } | { kind: 'running' } | { kind: 'done'; result: SelfTestResult } | { kind: 'crashed'; detail: string }

export function SelfTestScreen({ run }: { run: () => SelfTestResult }) {
    const [state, setState] = useState<State>({ kind: 'idle' })

    const start = () => {
        setState({ kind: 'running' })
        // let the «Running» state paint before the heavy, synchronous run
        setTimeout(() => {
            try {
                setState({ kind: 'done', result: run() })
            } catch (error) {
                setState({ kind: 'crashed', detail: error instanceof Error ? error.message : String(error) })
            }
        }, 50)
    }

    return (
        <View style={parts.screen}>
            <TopBar title="Self-test" />
            <ScrollView contentContainerStyle={styles.body}>
                <Text style={styles.lead}>Runs the rules of the Album Blender on this phone over the golden corpus, and compares each case with the reference the site produced.</Text>
                <PrimaryButton label={state.kind === 'running' ? 'Running…' : 'Run the self-test'} onPress={start} disabled={state.kind === 'running'} />
                {state.kind === 'done' ? (
                    <View testID="selftest-result" style={styles.result}>
                        <Text style={[styles.match, { color: passed(state.result) ? colors.text : colors.danger }]}>{matchLine(state.result)}</Text>
                        <Text style={styles.detail}>{`ids made: ${state.result.ids.generated}; not v4: ${state.result.ids.notV4}; repeated: ${state.result.ids.repeated}`}</Text>
                        <Text style={styles.detail}>{`different: ${state.result.different.length}; missing: ${state.result.missing.length}; extra: ${state.result.extra.length}; ${state.result.millis} ms`}</Text>
                        {[...state.result.different, ...state.result.missing].slice(0, 20).map(id => <Text key={id} style={styles.caseId}>{id}</Text>)}
                    </View>
                ) : null}
                {state.kind === 'crashed' ? <Text style={styles.crashed}>{`The self-test stopped: ${state.detail}`}</Text> : null}
            </ScrollView>
        </View>
    )
}

const styles = StyleSheet.create({
    body: { padding: size.margin, gap: 16 },
    lead: { ...type.body, color: colors.textSecondary },
    result: { gap: 6 },
    match: { ...type.title },
    detail: { ...type.secondary, color: colors.textSecondary },
    caseId: { ...type.label, fontWeight: '400', color: colors.textMuted },
    crashed: { ...type.secondary, color: colors.danger }
})
