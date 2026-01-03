import { BaseView } from './BaseView.js'
import { MigrationUtility } from '../migration/MigrationUtility.js'
import { getIcon } from '../components/Icons.js'
import toast from '../components/Toast.js'
import { getFirestore } from 'https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js'
import { getAuth } from 'https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js'
import { SafeDOM } from '../utils/SafeDOM.js'

/**
 * SaveAllView
 * Data Migration utility page - moved from HomeView
 */
export class SaveAllView extends BaseView {
  constructor() {
    super()
    const db = getFirestore()
    this.migrationUtil = new MigrationUtility(db, null)
    this.migrationState = 'idle' // idle, running, complete, error
  }

  hasPendingMigration() {
    // Check if there's data to migrate AND migration hasn't been completed
    return !this.migrationUtil.isMigrationComplete() && this.migrationUtil.hasLocalStorageData()
  }

  async render() {
    return this.renderContent()
  }

  renderContent() {
    const hasPending = this.hasPendingMigration()

    const container = SafeDOM.div({ className: 'save-all-view container py-8 max-w-4xl mx-auto' })

    // Header
    const header = SafeDOM.header({ className: 'mb-8' })
    const h1 = SafeDOM.h1({ className: 'text-3xl font-syne font-bold text-white mb-2' })
    h1.appendChild(SafeDOM.fromHTML(getIcon('Database', 'w-8 h-8 inline-block mr-3 text-accent-primary')))
    h1.appendChild(SafeDOM.text(' Data Migration'))
    header.appendChild(h1)
    header.appendChild(SafeDOM.p({ className: 'text-gray-400' }, 'Migrate your local browser data to cloud storage for cross-device sync.'))
    container.appendChild(header)

    // Status Section
    const statusSection = SafeDOM.section({ className: 'glass-panel p-8 mb-8' })

    const statusRow = SafeDOM.div({ className: 'flex items-center gap-4 mb-6' })
    const iconContainer = SafeDOM.div({ className: 'w-16 h-16 rounded-full bg-accent-primary/20 flex items-center justify-center' })
    iconContainer.appendChild(SafeDOM.fromHTML(getIcon('CloudUpload', 'w-8 h-8 text-accent-primary')))
    statusRow.appendChild(iconContainer)

    const infoDiv = SafeDOM.div({})
    infoDiv.appendChild(SafeDOM.h2({ className: 'text-xl font-bold text-white' }, 'Migration Status'))
    infoDiv.appendChild(SafeDOM.p({ className: 'text-gray-400', id: 'migrationStatusText' }, hasPending ? 'Old data detected. Ready to migrate.' : 'No pending migrations.'))
    statusRow.appendChild(infoDiv)
    statusSection.appendChild(statusRow)

    // Progress Bar
    const progressSection = SafeDOM.div({ id: 'migrationProgressSection', className: 'hidden mb-6' })
    const progressLabels = SafeDOM.div({ className: 'flex justify-between text-sm text-gray-400 mb-2' })
    progressLabels.appendChild(SafeDOM.span({ id: 'migrationProgressText' }, 'Processing...'))
    progressLabels.appendChild(SafeDOM.span({ id: 'migrationProgressPercent' }, '0%'))
    progressSection.appendChild(progressLabels)

    const progressTrack = SafeDOM.div({ className: 'w-full bg-gray-700 rounded-full h-2' })
    progressTrack.appendChild(SafeDOM.div({ id: 'migrationProgressBar', className: 'bg-accent-primary h-2 rounded-full transition-all duration-300', style: { width: '0%' } }))
    progressSection.appendChild(progressTrack)
    statusSection.appendChild(progressSection)

    // Buttons
    const btnRow = SafeDOM.div({ className: 'flex gap-4' })
    const startBtn = SafeDOM.button({
      id: 'startMigrationBtn',
      className: 'btn btn-primary',
      disabled: !hasPending
    })
    startBtn.appendChild(SafeDOM.fromHTML(getIcon('Play', 'w-5 h-5 mr-2')))
    startBtn.appendChild(SafeDOM.text(' Start Migration'))
    btnRow.appendChild(startBtn)

    const checkBtn = SafeDOM.button({ id: 'checkMigrationBtn', className: 'btn btn-secondary' })
    checkBtn.appendChild(SafeDOM.fromHTML(getIcon('RefreshCw', 'w-5 h-5 mr-2')))
    checkBtn.appendChild(SafeDOM.text(' Re-check Status'))
    btnRow.appendChild(checkBtn)

    statusSection.appendChild(btnRow)
    container.appendChild(statusSection)

    // Info Section
    const infoSection = SafeDOM.section({ className: 'glass-panel p-8' })
    infoSection.appendChild(SafeDOM.h3({ className: 'text-lg font-bold text-white mb-4' }, 'What gets migrated?'))

    const list = SafeDOM.ul({ className: 'space-y-3 text-gray-300' })
    const items = [
      'Album Series (names, queries, settings)',
      'Playlist Series (curation preferences)',
      'Inventory (owned albums)',
      'Generated Playlists'
    ]
    items.forEach(item => {
      const li = SafeDOM.li({ className: 'flex items-center gap-3' })
      li.appendChild(SafeDOM.fromHTML(getIcon('Check', 'w-5 h-5 text-green-500')))
      li.appendChild(SafeDOM.text(' ' + item))
      list.appendChild(li)
    })
    infoSection.appendChild(list)
    container.appendChild(infoSection)

    return container
  }

  async mount() {
    this.container = document.getElementById('app')

    // Start Migration Button
    const startBtn = this.$('#startMigrationBtn')
    if (startBtn) {
      this.on(startBtn, 'click', () => this.startMigration())
    }

    // Re-check Button
    const checkBtn = this.$('#checkMigrationBtn')
    if (checkBtn) {
      this.on(checkBtn, 'click', () => this.checkMigrationStatus())
    }
  }

  async startMigration() {
    const progressSection = this.$('#migrationProgressSection')
    const startBtn = this.$('#startMigrationBtn')
    const statusText = this.$('#migrationStatusText')

    if (progressSection) progressSection.classList.remove('hidden')
    if (startBtn) startBtn.disabled = true
    if (statusText) statusText.textContent = 'Migration in progress...'

    try {
      const auth = getAuth()
      const userId = auth.currentUser?.uid || 'anonymous-user'

      await this.migrationUtil.migrate(userId, (current, total, message) => {
        this.updateProgress({ current, total, currentItem: message })
      })

      if (statusText) statusText.textContent = 'Migration complete!'
      toast.success('Data migration completed successfully!')
    } catch (error) {
      console.error('Migration failed:', error)
      if (statusText) statusText.textContent = 'Migration failed. Please try again.'
      toast.error('Migration failed: ' + error.message)
    }
  }

  updateProgress(progress) {
    const progressBar = this.$('#migrationProgressBar')
    const progressText = this.$('#migrationProgressText')
    const progressPercent = this.$('#migrationProgressPercent')

    const percent = progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0

    if (progressBar) progressBar.style.width = `${percent}%`
    if (progressText) progressText.textContent = progress.currentItem || 'Processing...'
    if (progressPercent) progressPercent.textContent = `${percent}%`
  }

  checkMigrationStatus() {
    const hasPending = this.hasPendingMigration()
    const statusText = this.$('#migrationStatusText')
    const startBtn = this.$('#startMigrationBtn')

    if (statusText) {
      statusText.textContent = hasPending
        ? 'Old data detected. Ready to migrate.'
        : 'No pending migrations.'
    }

    if (startBtn) {
      startBtn.disabled = !hasPending
    }

    toast.info(hasPending ? 'Pending migration found' : 'No migrations needed')
  }
}
