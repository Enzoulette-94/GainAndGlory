import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock Supabase client globally
vi.mock('../lib/supabase-client', () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      neq: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      lt: vi.fn().mockReturnThis(),
      gt: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      range: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    })),
    channel: vi.fn(() => ({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn(),
    })),
    removeChannel: vi.fn(),
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn().mockResolvedValue({ data: { path: 'test.jpg' }, error: null }),
        getPublicUrl: vi.fn(() => ({ data: { publicUrl: 'https://example.com/test.jpg' } })),
      })),
    },
  },
}));

// Mock Recharts pour éviter les erreurs jsdom (pas de dimensions réelles)
vi.mock('recharts', () => {
  const React = require('react');
  const MockChart = ({ children }: any) => React.createElement('div', { 'data-testid': 'chart' }, children);
  const MockComponent = ({ children }: any) => React.createElement('div', null, children);
  const MockEmpty = () => null;
  return {
    ResponsiveContainer: MockChart,
    BarChart: MockChart,
    LineChart: MockChart,
    AreaChart: MockChart,
    Bar: MockEmpty,
    Line: MockEmpty,
    Area: MockEmpty,
    XAxis: MockEmpty,
    YAxis: MockEmpty,
    CartesianGrid: MockEmpty,
    Tooltip: MockEmpty,
    Legend: MockEmpty,
    Cell: MockEmpty,
    ReferenceLine: MockEmpty,
  };
});

// Mock framer-motion pour éviter les animations dans les tests
vi.mock('framer-motion', () => ({
  motion: new Proxy({}, {
    get: (_target, prop) => {
      const Component = ({ children, ...props }: any) => {
        const React = require('react');
        return React.createElement(String(prop), props, children);
      };
      return Component;
    },
  }),
  AnimatePresence: ({ children }: any) => children,
  useAnimation: () => ({ start: vi.fn() }),
  useInView: () => true,
}));
