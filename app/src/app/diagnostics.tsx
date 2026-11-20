/**
 * The hidden diagnostics entry (REQ-16): reached by a long press on the Albums title or by the link
 * albumblender://diagnostics (the one the Maestro flow will open); with `?run=1` it starts at once. The only route that loads the
 * golden corpus.
 */
import { useLocalSearchParams } from 'expo-router'
import { SelfTestScreen } from '../screens/SelfTestScreen'
import { runGoldenSelfTest } from '../selftest/goldenSelfTest'

export default function Diagnostics() {
    const { run } = useLocalSearchParams<{ run?: string }>()
    return <SelfTestScreen run={runGoldenSelfTest} autoRun={run === '1'} />
}
