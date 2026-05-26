import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { loadUserProfile } from '../supabase';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value.toString();
    }),
    clear: vi.fn(() => {
      store = {};
    })
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock Supabase Client
const mocks = vi.hoisted(() => ({
  mockGetUser: vi.fn().mockResolvedValue({ data: { user: { id: 'test-user-id' } } }),
  mockSingle: vi.fn().mockResolvedValue({
    data: { pdc: 90, max_snc: 20 },
    error: null
  })
}));

vi.mock('../supabase/client', () => ({
  createClient: vi.fn(() => ({
    auth: {
      getUser: mocks.mockGetUser
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: mocks.mockSingle
        }))
      }))
    }))
  }))
}));

describe('Supabase SWR Cache Layer', () => {
  beforeEach(() => {
    localStorageMock.clear();
    mocks.mockGetUser.mockResolvedValue({ data: { user: { id: 'test-user-id' } } });
    mocks.mockSingle.mockResolvedValue({ data: { pdc: 90, max_snc: 20 }, error: null });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('charge le profil depuis Supabase si le cache est vide', async () => {
    const profile = await loadUserProfile();
    expect(profile.pdc).toBe(90);
    expect(profile.maxSnc).toBe(20);
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'forge_user_profile',
      expect.stringContaining('"payload":{"pdc":90')
    );
  });

  it('retourne les données du cache immédiatement sans appel réseau si elles sont fraîches', async () => {
    // Injecter un cache frais (timestamp récent)
    localStorageMock.setItem('forge_user_profile', JSON.stringify({
      timestamp: Date.now(),
      payload: { pdc: 100, maxSnc: 25, prs: {}, age: 25, sleepHours: 8, caloricStatus: 'maintenance', stressLevel: 'moderate' }
    }));

    const profile = await loadUserProfile();
    
    // Le mock supabase renvoie 90, mais le cache doit prévaloir et renvoyer 100
    expect(profile.pdc).toBe(100);
  });

  it('retourne les données périmées (stale) en cas déchec réseau', async () => {
    // Injecter un cache expiré
    vi.useFakeTimers();
    localStorageMock.setItem('forge_user_profile', JSON.stringify({
      timestamp: Date.now() - 10 * 60 * 1000, // 10 minutes ago (stale)
      payload: { pdc: 85, maxSnc: 15, prs: {}, age: 25, sleepHours: 8, caloricStatus: 'maintenance', stressLevel: 'moderate' }
    }));

    // Forcer le mock Supabase à échouer (le client est déjà instancié)
    mocks.mockGetUser.mockRejectedValueOnce(new Error('Network error'));

    const profile = await loadUserProfile();
    
    // On doit retomber sur le cache stale plutôt que de crasher
    expect(profile.pdc).toBe(85);
  });
});
