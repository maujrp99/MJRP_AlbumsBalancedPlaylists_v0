/** Not app code (F83 TASK-02): a React file that loads another by import and another on demand; the import graph must follow both. */
import { Leaf } from './Leaf'

export const lazyScreen = () => import('./Lazy')
export const Entry = () => <Leaf />
