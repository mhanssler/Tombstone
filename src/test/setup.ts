import 'fake-indexeddb/auto';
import { vi } from 'vitest';

// Mock window for node environment
const windowMock = {
  matchMedia: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
  localStorage: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
    length: 0,
    key: vi.fn(),
  },
};

// Mock navigator.storage
const navigatorMock = {
  storage: {
    persist: vi.fn().mockResolvedValue(true),
    persisted: vi.fn().mockResolvedValue(true),
    estimate: vi.fn().mockResolvedValue({ quota: 0, usage: 0 }),
  },
};

// Set globals if in node environment
if (typeof window === 'undefined') {
  (global as any).window = windowMock;
  (global as any).navigator = navigatorMock;
}
