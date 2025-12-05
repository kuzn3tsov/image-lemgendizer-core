/**
 * Processors exports
 */

export { LemGendaryResize } from './LemGendaryResize.js'
export { LemGendaryCrop } from './LemGendaryCrop.js'
export { LemGendaryOptimize } from './LemGendaryOptimize.js'
export { LemGendaryRename } from './LemGendaryRename.js'

// Re-export as namespaced
import { LemGendaryResize } from './LemGendaryResize.js'
import { LemGendaryCrop } from './LemGendaryCrop.js'
import { LemGendaryOptimize } from './LemGendaryOptimize.js'
import { LemGendaryRename } from './LemGendaryRename.js'

export const processors = {
    LemGendaryResize,
    LemGendaryCrop,
    LemGendaryOptimize,
    LemGendaryRename
}