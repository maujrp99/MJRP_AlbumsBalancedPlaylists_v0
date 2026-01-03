/**
 * Edit Album Modal
 * Allows editing album metadata (Title, Artist, Year, Cover)
 * Refactored to use BaseModal and SafeDOM (Sprint 16)
 */

import { BaseModal } from './ui/BaseModal.js'
import { SafeDOM } from '../utils/SafeDOM.js'
import toast from './Toast.js'

export function showEditAlbumModal(album, onSave) {
  const modalId = 'edit-album-modal'

  // Inputs
  const titleInput = SafeDOM.input({
    type: 'text',
    id: 'titleInput',
    className: 'form-control w-full',
    value: album.title,
    required: true
  })

  const artistInput = SafeDOM.input({
    type: 'text',
    id: 'artistInput',
    className: 'form-control w-full',
    value: album.artist,
    required: true
  })

  const yearInput = SafeDOM.input({
    type: 'number',
    id: 'yearInput',
    className: 'form-control w-full',
    value: album.year || '',
    placeholder: 'YYYY',
    min: '1900',
    max: new Date().getFullYear() + 1
  })

  const coverUrlInput = SafeDOM.input({
    type: 'url',
    id: 'coverUrlInput',
    className: 'form-control w-full',
    value: album.coverUrl || '',
    placeholder: 'https://...'
  })

  // Form Groups
  const createField = (label, input) => SafeDOM.div({}, [
    SafeDOM.label({ className: 'block mb-2 text-sm font-medium text-gray-300' }, label),
    input
  ])

  const content = SafeDOM.div({ className: 'space-y-4' }, [
    createField('Album Title:', titleInput),
    createField('Artist:', artistInput),
    createField('Year:', yearInput),
    createField('Cover Image URL:', coverUrlInput)
  ])

  // Save Handler
  const handleSave = async (modal) => {
    const title = titleInput.value.trim()
    const artist = artistInput.value.trim()

    // Find buttons in the modal (a bit hacky but standardized via BaseModal)
    // Better: store reference to saveBtn. But BaseModal creates it.
    // We can disable all buttons in footer.
    const saveBtn = modal.querySelector('[data-action="save"]')

    if (!title || !artist) {
      toast.warning('Title and Artist are required.')
      return
    }

    if (saveBtn) {
      saveBtn.disabled = true
      saveBtn.textContent = 'Saving...'
    }

    try {
      const updates = {
        title,
        artist,
        year: yearInput.value ? parseInt(yearInput.value) : null,
        coverUrl: coverUrlInput.value.trim() || null
      }

      await onSave(album.id, updates)
      BaseModal.unmount(modal)
    } catch (error) {
      console.error('Failed to save album:', error)
      if (saveBtn) {
        saveBtn.disabled = false
        saveBtn.textContent = 'Save Changes'
      }
      toast.error(`Failed to save: ${error.message}`)
    }
  }

  // Modal Construction
  const closeModal = () => BaseModal.unmount(modalId)

  const footer = BaseModal.createFooterButtons({
    confirmText: 'Save Changes',
    onCancel: closeModal,
    onConfirm: () => handleSave(document.getElementById(modalId)),
    confirmAction: 'save'
  })

  const modal = BaseModal.render({
    id: modalId,
    title: 'Edit Album Details',
    content,
    footer,
    onClose: closeModal
  })

  BaseModal.mount(modal)

  // Focus title
  setTimeout(() => titleInput.focus(), 100)

  return modal
}
