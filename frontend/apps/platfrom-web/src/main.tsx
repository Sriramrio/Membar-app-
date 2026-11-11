import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { PlatformAdminApp } from '@/app/PlatformAdminApp';
import { BootstrapProvider } from '@/bootstrap/BootstrapContext';
import '@/shared/tailwind.generated.css';
import '@/shared/styles.css';
ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode><BrowserRouter><BootstrapProvider><PlatformAdminApp/></BootstrapProvider></BrowserRouter></React.StrictMode>);
