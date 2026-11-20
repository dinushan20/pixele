import {defineConfig} from 'vite';
// Relative asset URLs work both at a domain root and at /pixele/ on GitHub Pages.
export default defineConfig({base:'./',server:{host:'127.0.0.1'}});
