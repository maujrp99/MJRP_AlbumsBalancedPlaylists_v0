/** A box with the bridge and the profile of the ranking window, nothing else: the drag of one list by mouse, to watch what a drop leaves lit (F83 sync 2). */
import { createRoot } from 'react-dom/client'
import { StrictMode, useRef, useState } from 'react'
import { useSortableTracks } from '../../../../../public/js/react-bridge/sortableTracks'
import { RANK_PROFILE } from '../../../../../public/js/screens/albums/RankWindow'

function Box() {
    const box = useRef<HTMLDivElement>(null)
    const [order, setOrder] = useState(['One', 'Two', 'Three', 'Four', 'Five'])
    const [drops, setDrops] = useState(0)
    const fresh = new URLSearchParams(location.search).get('fresh') === '1' // the rows are new elements after a drop
    useSortableTracks(box, {
        handle: '.rank-row',
        profile: RANK_PROFILE,
        onMove: ({ oldIndex, newIndex }) => { setDrops(count => count + 1); setOrder(previous => { const next = [...previous]; const [moved] = next.splice(oldIndex, 1); next.splice(newIndex, 0, moved); return next }) }
    })
    return (
        <div ref={box} style={{ width: 360, padding: 16 }}>
            <div id="rank-track-list" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {order.map(name => <div key={fresh ? `${name}:${drops}` : name} className="rank-row" data-track-id={name} style={{ padding: 12, background: '#222', border: '1px solid #333', cursor: 'grab' }}>{name}</div>)}
            </div>
        </div>
    )
}

createRoot(document.getElementById('root') as HTMLElement).render(<StrictMode><Box /></StrictMode>)
