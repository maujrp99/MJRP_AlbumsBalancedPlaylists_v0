/**
 * The hidden diagnostics entry (REQ-16): reached by a long press on the Albums title or by the link
 * albumblender://diagnostics (the one the Maestro flow will open). The only route that loads the
 * golden corpus.
 */
import { SelfTestScreen } from '../screens/SelfTestScreen'
import { runGoldenSelfTest } from '../selftest/goldenSelfTest'

export default function Diagnostics() {
    return <SelfTestScreen run={runGoldenSelfTest} />
}
