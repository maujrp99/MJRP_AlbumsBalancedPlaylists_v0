/**
 * Albums (F78 skeleton, REQ-12 in part): the person's series, newest first, each with its name, how
 * many albums it asks for and the covers its queries keep. Four states, each saying what happened:
 * loading, the list, no series yet, and a failed read with «Try again». Pull to refresh.
 *
 * Not yet (TASK-20): the saved copy for no network («Saved earlier», «No connection»), the 10-second
 * deadline, opening a series.
 */
import { useCallback, useEffect, useState } from 'react'
import { FlatList, Image, RefreshControl, StyleSheet, Text, View } from 'react-native'
import { useServices } from '../ui/AppServicesContext'
import { listSeries } from '../data/seriesList'
import type { SeriesRow } from '../data/seriesList'
import { CenteredState, SecondaryButton, TopBar, styles as parts } from '../ui/parts'
import { colors, size, type } from '../ui/theme'

type State =
    | { kind: 'loading' }
    | { kind: 'ready'; rows: SeriesRow[]; refreshing: boolean }
    | { kind: 'failed'; detail: string }

const albumsLabel = (count: number) => (count === 1 ? '1 album' : `${count} albums`)

function Covers({ covers }: { covers: string[] }) {
    if (covers.length === 0) {
        return <View style={styles.coverPlaceholder} testID="cover-placeholder"><Text style={styles.coverPlaceholderMark}>♪</Text></View>
    }
    const tile = covers.length === 1 ? size.cover : size.cover / 2
    return (
        <View style={styles.coverGrid}>
            {covers.map(url => <Image key={url} source={{ uri: url }} style={{ width: tile, height: tile }} accessibilityIgnoresInvertColors testID="cover" />)}
        </View>
    )
}

function SeriesItem({ row }: { row: SeriesRow }) {
    return (
        <View style={styles.row} accessible accessibilityLabel={`${row.name}, ${albumsLabel(row.albumCount)}`}>
            <Covers covers={row.covers} />
            <View style={styles.rowText}>
                <Text style={styles.rowName} numberOfLines={1}>{row.name}</Text>
                <Text style={styles.rowCount}>{albumsLabel(row.albumCount)}</Text>
            </View>
        </View>
    )
}

export function AlbumsScreen({ userId, onOpenDiagnostics }: { userId: string; onOpenDiagnostics?: () => void }) {
    const { store, usage } = useServices()
    const [state, setState] = useState<State>({ kind: 'loading' })

    // reads and settles the state; the caller says first what is on screen while it reads
    const read = useCallback(() => listSeries(store, userId).then(
        rows => setState({ kind: 'ready', rows, refreshing: false }),
        (error: unknown) => setState({ kind: 'failed', detail: error instanceof Error ? error.message : String(error) })
    ), [store, userId])

    const load = (refreshing: boolean) => {
        setState(previous => (refreshing && previous.kind === 'ready' ? { ...previous, refreshing: true } : { kind: 'loading' }))
        return read()
    }

    useEffect(() => {
        usage.track('screen_viewed', { screen: 'albums' })
        void read() // the first state is already «loading»
    }, [read, usage])

    return (
        <View style={parts.screen}>
            <TopBar title="Albums" onLongPress={onOpenDiagnostics} />
            {state.kind === 'loading' ? <CenteredState busy title="Loading your series…" testID="albums-loading" /> : null}
            {state.kind === 'failed' ? (
                <CenteredState title="Couldn't load your series." detail={`Check the connection and try again. (${state.detail})`} testID="albums-failed">
                    <SecondaryButton label="Try again" onPress={() => void load(false)} />
                </CenteredState>
            ) : null}
            {state.kind === 'ready' && state.rows.length === 0 ? (
                <CenteredState title="No series yet" detail="Series you create on the Album Blender site show up here." testID="albums-empty">
                    <SecondaryButton label="Check again" onPress={() => void load(false)} />
                </CenteredState>
            ) : null}
            {state.kind === 'ready' && state.rows.length > 0 ? (
                <FlatList
                    testID="albums-list"
                    data={state.rows}
                    keyExtractor={row => row.id}
                    renderItem={({ item }) => <SeriesItem row={item} />}
                    ItemSeparatorComponent={() => <View style={styles.separator} />}
                    ListHeaderComponent={<Text style={styles.listHeader}>{`${state.rows.length} series · newest first`}</Text>}
                    refreshControl={<RefreshControl refreshing={state.refreshing} onRefresh={() => void load(true)} tintColor={colors.accent} />}
                    contentContainerStyle={styles.listContent}
                />
            ) : null}
        </View>
    )
}

const styles = StyleSheet.create({
    listContent: { paddingHorizontal: size.margin, paddingBottom: 24 },
    listHeader: { ...type.secondary, color: colors.textSecondary, paddingVertical: 12 },
    row: { flexDirection: 'row', alignItems: 'center', minHeight: 72, gap: 12 },
    rowText: { flex: 1 },
    rowName: { ...type.body, fontWeight: '700', color: colors.text },
    rowCount: { ...type.secondary, color: colors.textSecondary },
    separator: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border },
    coverGrid: { width: size.cover, height: size.cover, flexDirection: 'row', flexWrap: 'wrap', borderRadius: 6, overflow: 'hidden', backgroundColor: colors.panel },
    coverPlaceholder: { width: size.cover, height: size.cover, borderRadius: 6, backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
    coverPlaceholderMark: { ...type.title, color: colors.textMuted }
})
