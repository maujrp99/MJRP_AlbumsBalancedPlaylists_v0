/**
 * The services of the composition root (../composition.ts), handed to the screens by context, and the
 * signed-in account, followed through the account port.
 */
import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import type { AppServices } from '../composition'
import type { Account } from '../auth/authPort'

const ServicesContext = createContext<AppServices | null>(null)

export function AppServicesProvider({ services, children }: { services: AppServices; children: ReactNode }) {
    return <ServicesContext.Provider value={services}>{children}</ServicesContext.Provider>
}

export function useServices(): AppServices {
    const services = useContext(ServicesContext)
    if (!services) throw new Error('useServices(): no AppServicesProvider above this screen')
    return services
}

/** The signed-in account (null when nobody is), and `undefined` until the port has answered. */
export function useAccount(): Account | null | undefined {
    const { auth } = useServices()
    const [account, setAccount] = useState<Account | null | undefined>(undefined)
    useEffect(() => auth.onChange(setAccount), [auth])
    return account
}
