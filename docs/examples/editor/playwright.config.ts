import {defineConfig} from '@playwright/test';
export default defineConfig({
 testDir:'./tests', use:{baseURL:'http://127.0.0.1:5193',headless:true},
 webServer:{command:'npm run dev -- --port 5193 --strictPort',url:'http://127.0.0.1:5193',reuseExistingServer:!process.env.CI},
});
