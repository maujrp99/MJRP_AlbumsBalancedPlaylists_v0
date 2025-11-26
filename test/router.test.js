import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { Router } from '../public/js/router.js'

describe('Router', () => {
    let router
    let mockApp

    beforeEach(() => {
        // Create mock DOM
        mockApp = document.createElement('div')
        mockApp.id = 'app'
        document.body.appendChild(mockApp)

        // Reset history
        window.history.pushState({}, '', '/')

        router = new Router()
    })

    afterEach(() => {
        document.body.removeChild(mockApp)
    })

    describe('register', () => {
        it('should register a route', () => {
            const viewFactory = () => ({ render: () => '<div>Test</div>' })

            router.register('/test', viewFactory)

            expect(router.routes.has('/test')).toBe(true)
        })

        it('should register route with params', () => {
            const viewFactory = () => ({ render: () => '<div>Test</div>' })

            router.register('/albums/:id', viewFactory)

            const route = router.routes.get('/albums/:id')
            expect(route.params).toEqual(['id'])
        })
    })

    describe('navigate', () => {
        it('should change window location', async () => {
            // Register route first
            const viewFactory = () => ({
                render: () => '<div>Test</div>',
                mount: vi.fn()
            })
            router.register('/test', viewFactory)

            router.navigate('/test')

            // Wait for async navigation
            await new Promise(resolve => setTimeout(resolve, 10))

            expect(window.location.pathname).toBe('/test')
        })
        it('should call before navigate hooks', () => {
            const hook = vi.fn(() => true)
            router.beforeNavigate(hook)

            router.navigate('/test')

            expect(hook).toHaveBeenCalledWith('/test', {})
        })

        it('should prevent navigation if hook returns false', () => {
            const hook = vi.fn(() => false)
            router.beforeNavigate(hook)

            const before = window.location.pathname
            router.navigate('/test')

            expect(window.location.pathname).toBe(before)
        })
    })

    describe('route matching', () => {
        it('should match simple routes', () => {
            const viewFactory = vi.fn(() => ({
                render: () => '<div>Home</div>',
                mount: vi.fn()
            }))

            router.register('/home', viewFactory)
            router.navigate('/home')

            expect(viewFactory).toHaveBeenCalled()
        })

        it('should extract route params', () => {
            let capturedParams
            const viewFactory = () => ({
                render: (params) => {
                    capturedParams = params
                    return '<div>Album</div>'
                },
                mount: vi.fn()
            })

            router.register('/albums/:id', viewFactory)
            router.navigate('/albums/123')

            expect(capturedParams.id).toBe('123')
        })

        it('should parse query strings', () => {
            let capturedParams
            const viewFactory = () => ({
                render: (params) => {
                    capturedParams = params
                    return '<div>Test</div>'
                },
                mount: vi.fn()
            })

            router.register('/test', viewFactory)
            router.navigate('/test?foo=bar&baz=qux')

            expect(capturedParams.query.foo).toBe('bar')
            expect(capturedParams.query.baz).toBe('qux')
        })
    })

    describe('view lifecycle', () => {
        it('should call render and mount', async () => {
            const renderFn = vi.fn(() => '<div>Test</div>')
            const mountFn = vi.fn()

            const viewFactory = () => ({
                render: renderFn,
                mount: mountFn
            })

            router.register('/test', viewFactory)
            await router.navigate('/test')

            // Wait for async rendering
            await new Promise(resolve => setTimeout(resolve, 10))

            expect(renderFn).toHaveBeenCalled()
            expect(mountFn).toHaveBeenCalled()
        })

        it('should call destroy on previous view', async () => {
            const destroyFn1 = vi.fn()
            const view1 = () => ({
                render: () => '<div>View 1</div>',
                destroy: destroyFn1
            })

            const view2 = () => ({
                render: () => '<div>View 2</div>'
            })

            router.register('/view1', view1)
            router.register('/view2', view2)

            await router.navigate('/view1')
            await new Promise(resolve => setTimeout(resolve, 10))

            await router.navigate('/view2')
            await new Promise(resolve => setTimeout(resolve, 10))

            expect(destroyFn1).toHaveBeenCalled()
        })
    })

    describe('afterNavigate hooks', () => {
        it('should call after navigate hooks', async () => {
            const hook = vi.fn()
            router.afterNavigate(hook)

            const viewFactory = () => ({
                render: () => '<div>Test</div>',
                mount: vi.fn()
            })

            router.register('/test', viewFactory)
            await router.navigate('/test')

            await new Promise(resolve => setTimeout(resolve, 10))

            expect(hook).toHaveBeenCalledWith('/test', {})
        })
    })

    describe('link interception', () => {
        it('should intercept internal link clicks', () => {
            const link = document.createElement('a')
            link.href = '/test'
            document.body.appendChild(link)

            const viewFactory = () => ({
                render: () => '<div>Test</div>',
                mount: vi.fn()
            })

            router.register('/test', viewFactory)

            link.click()

            expect(window.location.pathname).toBe('/test')

            document.body.removeChild(link)
        })
    })
})
