// __mocks__/lib/supabase-browser.ts

export const mockSupabase = {
  from: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  delete: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  single: jest.fn().mockResolvedValue({ data: {}, error: null }), // Default single() response
  channel: jest.fn().mockReturnThis(),
  on: jest.fn().mockReturnThis(),
  subscribe: jest.fn().mockReturnThis(),
  removeChannel: jest.fn().mockResolvedValue('OK'),
};

export const createClient = jest.fn(() => mockSupabase);

// Helper to reset all mocks
export const resetMocks = () => {
  mockSupabase.from.mockReturnThis();
  mockSupabase.insert.mockReturnThis();
  mockSupabase.select.mockReturnThis();
  mockSupabase.update.mockReturnThis();
  mockSupabase.delete.mockReturnThis();
  mockSupabase.eq.mockReturnThis();
  mockSupabase.single.mockResolvedValue({ data: {}, error: null });
  mockSupabase.channel.mockReturnThis();
  mockSupabase.on.mockReturnThis();
  mockSupabase.subscribe.mockReturnThis();
  mockSupabase.removeChannel.mockResolvedValue('OK');

  // Reset call counts and arguments for chainable methods
  mockSupabase.from.mockClear();
  mockSupabase.insert.mockClear();
  mockSupabase.select.mockClear();
  mockSupabase.update.mockClear();
  mockSupabase.delete.mockClear();
  mockSupabase.eq.mockClear();
  mockSupabase.single.mockClear();
  mockSupabase.channel.mockClear();
  mockSupabase.on.mockClear();
  mockSupabase.subscribe.mockClear();
  mockSupabase.removeChannel.mockClear();
  
  createClient.mockClear();
  createClient.mockImplementation(() => mockSupabase);
};

// Individual mock clear functions for more granular control if needed
export const mockInsert = mockSupabase.insert;
export const mockSelect = mockSupabase.select;
export const mockUpdate = mockSupabase.update;
export const mockDelete = mockSupabase.delete;
export const mockEq = mockSupabase.eq;
export const mockSingle = mockSupabase.single;
export const mockChannel = mockSupabase.channel;
export const mockOn = mockSupabase.on;
export const mockSubscribe = mockSupabase.subscribe;
export const mockRemoveChannel = mockSupabase.removeChannel;
