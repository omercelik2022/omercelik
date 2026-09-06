import {defineConfig} from '@playwright/test';
export default defineConfig({testDir:'./e2e',timeout:60000,use:{baseURL:'http://127.0.0.1:4310',trace:'retain-on-failure'},reporter:'list'});
