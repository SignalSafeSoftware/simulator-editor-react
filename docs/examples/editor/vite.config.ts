import {defineConfig} from 'vite';
export default defineConfig({base:process.env.PAGES_BASE??'/',build:{outDir:'dist'}});
