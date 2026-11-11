import React from 'react'; import {createRoot} from 'react-dom/client'; import {BrowserRouter} from 'react-router-dom';
import {Provider} from 'react-redux';
import {store} from './store/store';
import {assertProductionSafety} from './config/productionSafety';
import {initWebTelemetry} from './services/webTelemetry';
import {OrgApp} from './routes/OrgApp'; import './styles/global.css';
assertProductionSafety();
initWebTelemetry();
createRoot(document.getElementById('root')!).render(<Provider store={store}><BrowserRouter><OrgApp/></BrowserRouter></Provider>);

