import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Alert } from './Alert';
import { Button } from './Button';
import { newCorrelationId, telemetry } from '@/services/telemetry/telemetry';

interface Props { children:ReactNode }
interface State { error:Error|null; correlationId:string|null }

export class RouteErrorBoundary extends Component<Props,State>{
  state:State={error:null,correlationId:null};
  static getDerivedStateFromError(error:Error):State{return {error,correlationId:newCorrelationId('UI')};}
  componentDidCatch(error:Error,info:ErrorInfo){
    telemetry.error('ui','route.error-boundary',error,{componentStack:info.componentStack?.slice(0,8000)},this.state.correlationId??undefined);
  }
  render(){
    if(!this.state.error)return this.props.children;
    return <main className="mx-auto grid min-h-[55vh] max-w-3xl place-items-center p-6" id="main-content"><div className="w-full"><Alert tone="danger" title="This screen could not be completed"><p>The application protected the rest of your session. Retry the screen or return to your workspace. If the issue repeats, share correlation ID <strong>{this.state.correlationId}</strong> with support.</p></Alert>
    {this.state.error && (
      <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded text-red-800 text-xs font-mono whitespace-pre-wrap">
        <strong>Error:</strong> {this.state.error.message || String(this.state.error)}
        {this.state.error.stack && (
          <details className="mt-2">
            <summary className="cursor-pointer font-sans font-medium text-red-700">View Stack Trace</summary>
            <pre className="mt-1 overflow-x-auto text-[11px] leading-tight">{this.state.error.stack}</pre>
          </details>
        )}
      </div>
    )}
    <div className="mt-4 flex flex-wrap gap-2"><Button onClick={()=>this.setState({error:null,correlationId:null})}>Retry screen</Button><Button variant="secondary" onClick={()=>window.location.assign('/workspace')}>Return to workspace</Button></div></div></main>;
  }
}
