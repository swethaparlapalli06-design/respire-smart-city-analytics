import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import App from '../App';

// Mock WebSocket
class MockWebSocket {
  readyState = 1;
  onopen = null;
  onclose = null;
  onmessage = null;
  onerror = null;

  constructor() {
    setTimeout(() => {
      if (this.onopen) this.onopen();
    }, 0);
  }

  send() {}
  close() {}
}

// Mock WebSocket globally
global.WebSocket = MockWebSocket as any;

// Mock Mapbox
vi.mock('react-map-gl', () => ({
  Map: ({ children }: { children: React.ReactNode }) => <div data-testid="map">{children}</div>,
  Source: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Layer: () => <div />,
  Popup: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

// Mock Mapbox GL CSS
vi.mock('mapbox-gl/dist/mapbox-gl.css', () => ({}));

describe('App', () => {
  it('renders the main application', () => {
    render(<App />);
    
    expect(screen.getByText('Urban Planning Platform')).toBeInTheDocument();
    expect(screen.getByText('Traffic Map')).toBeInTheDocument();
    expect(screen.getByText('Pollution Map')).toBeInTheDocument();
  });

  it('shows traffic map by default', () => {
    render(<App />);
    
    expect(screen.getByText('Traffic Map')).toBeInTheDocument();
  });

  it('can switch to pollution map', () => {
    render(<App />);
    
    const pollutionTab = screen.getByText('Pollution Map');
    pollutionTab.click();
    
    expect(screen.getByText('Pollution Map')).toBeInTheDocument();
  });
});
