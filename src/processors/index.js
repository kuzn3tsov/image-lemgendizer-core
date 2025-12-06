/**
 * Processors index - Export all processor classes
 * @module processors
 */

export { default as LemGendaryResize } from './LemGendaryResize.js';
export { default as LemGendaryCrop } from './LemGendaryCrop.js';
export { default as LemGendaryOptimize } from './LemGendaryOptimize.js';
export { default as LemGendaryRename } from './LemGendaryRename.js';

// Export default object for convenience
export default {
    LemGendaryResize,
    LemGendaryCrop,
    LemGendaryOptimize,
    LemGendaryRename
};