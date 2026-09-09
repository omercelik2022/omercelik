import React from 'react';
import {createRoot} from 'react-dom/client';
import { Capacitor } from '@capacitor/core';
import {App} from './App';
import { OfflineMobileApp } from './mobile/OfflineMobileApp';
import './style.css';
const RootApp = Capacitor.isNativePlatform() ? OfflineMobileApp : App;
createRoot(document.getElementById('root')!).render(<React.StrictMode><RootApp/></React.StrictMode>);
