/**
 * The honest state of a destination the skeleton does not build yet (Home, Blend, Playlists,
 * Inventory): its name in the top bar and one sentence, no fake content.
 */
import { View } from 'react-native'
import { CenteredState, TopBar, styles as parts } from '../ui/parts'

export function NotInTheAppYet({ name }: { name: string }) {
    return (
        <View style={parts.screen}>
            <TopBar title={name} />
            <CenteredState title="Not in the app yet" detail={`${name} is on the Album Blender site for now. It comes to the app in a later version.`} testID="not-yet" />
        </View>
    )
}
