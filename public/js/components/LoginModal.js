/**
 * LoginModal
 * Handles user authentication (Google/Apple)
 */
import { authService } from '@shared/services/AuthService.js'
import toast from './Toast.js'
import { getIcon } from './Icons.js'

export function showLoginModal() {
    const modal = document.createElement('div')
    modal.className = 'modal-overlay'
    modal.innerHTML = `
    <div class="modal-container glass-panel max-w-md w-full">
      <div class="modal-header p-6 border-b border-surface-light text-center">
        <h2 class="text-3xl font-bold bg-clip-text text-transparent bg-flame-gradient mb-2">Welcome Back</h2>
        <p class="text-white/60">Sign in to sync your playlists across devices</p>
      </div>

      <div class="modal-content p-8 space-y-4">
        
        <!-- Google Sign In -->
        <button id="googleLoginBtn" class="w-full btn bg-white text-black hover:bg-gray-100 flex items-center justify-center gap-3 relative overflow-hidden group">
            <div class="absolute inset-0 bg-black/5 group-hover:bg-black/10 transition-colors"></div>
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" class="w-6 h-6" alt="Google">
            <span class="font-bold">Sign in with Google</span>
        </button>

        <!-- Apple Sign In -->
        <button id="appleLoginBtn" class="w-full btn bg-black text-white border border-white/20 hover:bg-black/80 flex items-center justify-center gap-3 relative overflow-hidden group">
            <div class="absolute inset-0 bg-white/5 group-hover:bg-white/10 transition-colors"></div>
            ${getIcon('Apple', 'w-6 h-6 fill-current')}
            <span class="font-bold">Sign in with Apple</span>
        </button>

        <div class="relative py-4">
            <div class="absolute inset-0 flex items-center">
                <div class="w-full border-t border-white/10"></div>
            </div>
            <div class="relative flex justify-center">
                <span class="bg-black px-4 text-sm text-white/40">or continue as guest</span>
            </div>
        </div>

        <button class="w-full btn btn-secondary" data-action="cancel">
            Continue as Guest
        </button>

      </div>
      
      <div class="p-4 text-center text-xs text-white/30">
        By signing in, you agree to our Terms and Privacy Policy.
      </div>
    </div>
  `

    const googleBtn = modal.querySelector('#googleLoginBtn')
    const appleBtn = modal.querySelector('#appleLoginBtn')
    const cancelBtn = modal.querySelector('[data-action="cancel"]')

    const handleLogin = async (provider) => {
        try {
            // Disable buttons
            googleBtn.disabled = true
            appleBtn.disabled = true

            // Show loading state on clicked button
            const btn = provider === 'google' ? googleBtn : appleBtn
            const originalContent = btn.innerHTML
            btn.innerHTML = `<span class="animate-spin mr-2">⟳</span> Signing in...`

            if (provider === 'google') {
                await authService.signInWithGoogle()
            } else {
                await authService.signInWithApple()
            }

            // Success - Modal closes automatically? 
            // AuthService triggers UserStore, which triggers UI updates.
            // But we should close the modal.
            toast.success('Successfully signed in!')
            close()

        } catch (error) {
            console.error('Login failed:', error)

            let message = `Login failed: ${error.message}`
            if (error.code === 'auth/operation-not-allowed') {
                message = 'Login provider not enabled. Please enable Google/Apple Sign-In in Firebase Console.'
            } else if (error.code === 'auth/popup-closed-by-user') {
                message = 'Sign-in cancelled'
            }

            toast.error(message)

            // Reset buttons
            googleBtn.disabled = false
            appleBtn.disabled = false
            const btn = provider === 'google' ? googleBtn : appleBtn
            // Restore content (simplified)
            if (provider === 'google') {
                btn.innerHTML = `<img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" class="w-6 h-6" alt="Google"><span class="font-bold">Sign in with Google</span>`
            } else {
                btn.innerHTML = `${getIcon('Apple', 'w-6 h-6 fill-current')}<span class="font-bold">Sign in with Apple</span>`
            }
        }
    }

    const close = () => modal.remove()

    googleBtn.addEventListener('click', () => handleLogin('google'))
    appleBtn.addEventListener('click', () => handleLogin('apple'))
    cancelBtn.addEventListener('click', close)

    modal.addEventListener('click', (e) => {
        if (e.target === modal) close()
    })

    // Add close logic
    document.body.appendChild(modal)
    return modal
}
