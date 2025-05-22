import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AIAssistant } from '@/components/ai/ai-assistant'; // Assuming this is the correct path

// Mock any external dependencies if necessary, though AIAssistant seems self-contained
// For example, if it used a context or a specific hook that needs mocking.
// For now, let's assume it's straightforward.

// Mocking localStorage if the component uses it for chat history (though not specified)
// const localStorageMock = (() => {
//   let store: { [key: string]: string } = {};
//   return {
//     getItem: (key: string) => store[key] || null,
//     setItem: (key: string, value: string) => {
//       store[key] = value.toString();
//     },
//     removeItem: (key: string) => {
//       delete store[key];
//     },
//     clear: () => {
//       store = {};
//     },
//   };
// })();
// Object.defineProperty(window, 'localStorage', { value: localStorageMock });


describe('AIAssistant Integration Tests', () => {

  beforeEach(() => {
    // Clear any mocks or localStorage before each test if used
    // localStorageMock.clear();
    jest.useFakeTimers(); // AIAssistant uses setTimeout for mock AI response
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('Initial State', () => {
    it('should render correctly with no messages and initial prompt', () => {
      render(<AIAssistant />);

      // Check for initial prompt/placeholder in textarea
      expect(screen.getByPlaceholderText(/Ask me anything.../i)).toBeInTheDocument();
      
      // Check that no messages are displayed initially
      // Messages are typically list items or within a specific container.
      // Let's assume messages have a role like 'listitem' or are within a 'list' role.
      // Or, we can query for specific text patterns that messages might have.
      // If the component renders a specific "no messages" text, that can be checked too.
      // For now, let's assume messages would contain text, and we query for typical message roles.
      const messageList = screen.queryByRole('list', { name: /chat messages/i }); // Assuming an accessible name
      if (messageList) {
        const messages = within(messageList).queryAllByRole('listitem');
        expect(messages.length).toBe(0);
      } else {
        // If no list, check that common message text isn't present.
        // This is less robust. Awaiting structure of AIAssistant.
        // For now, let's assume no messages means no text like "User:" or "Assistant:"
        expect(screen.queryByText(/User:/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/Assistant:/i)).not.toBeInTheDocument();
      }

      // Check if send button is present
      expect(screen.getByRole('button', { name: /send/i })).toBeInTheDocument();
    });
  });

  describe('Sending Messages and AI Response', () => {
    it('should display user message, show loading, and then display AI response', async () => {
      render(<AIAssistant />);

      const inputField = screen.getByPlaceholderText(/Ask me anything.../i);
      const sendButton = screen.getByRole('button', { name: /send/i });

      // Type a message
      const userMessage = 'Hello, AI!';
      fireEvent.change(inputField, { target: { value: userMessage } });
      expect(inputField).toHaveValue(userMessage);

      // Click send
      fireEvent.click(sendButton);

      // Assert user message appears
      await waitFor(() => {
        const userMessageElement = screen.getByText(userMessage);
        expect(userMessageElement).toBeInTheDocument();
        // Check role if possible (depends on how messages are structured)
        // Example: expect(userMessageElement.closest('[data-role="user-message"]')).toBeInTheDocument();
      });

      // Assert loading state (spinner) appears briefly
      // This depends on how the loading indicator is implemented.
      // Let's assume a loading spinner has a specific role or test ID.
      // For the current component, it shows "Assistant is typing..."
      expect(screen.getByText(/Assistant is typing.../i)).toBeInTheDocument();
      
      // Wait for the AI response (component uses setTimeout of 1 second)
      act(() => {
        jest.advanceTimersByTime(1000);
      });
      
      await waitFor(() => {
        // Assert loading state disappears
        expect(screen.queryByText(/Assistant is typing.../i)).not.toBeInTheDocument();

        // Assert AI response appears
        // The mock response is `You said: "${message}". I am a mock AI.`
        const aiResponseText = `You said: "${userMessage}". I am a mock AI.`;
        const aiMessageElement = screen.getByText(aiResponseText);
        expect(aiMessageElement).toBeInTheDocument();
        // Check role if possible
        // Example: expect(aiMessageElement.closest('[data-role="assistant-message"]')).toBeInTheDocument();
      });

      // Assert input field is cleared (will be part of next test suite)
    });
  });

  describe('Input Handling', () => {
    it('should clear the input field after sending a message', async () => {
      render(<AIAssistant />);
      const inputField = screen.getByPlaceholderText(/Ask me anything.../i) as HTMLTextAreaElement;
      const sendButton = screen.getByRole('button', { name: /send/i });

      fireEvent.change(inputField, { target: { value: 'Test message' } });
      fireEvent.click(sendButton);

      // Wait for AI response to ensure message processing is complete
      act(() => {
        jest.advanceTimersByTime(1000);
      });
      await waitFor(() => {
        expect(screen.getByText(/You said: "Test message"/i)).toBeInTheDocument();
      });

      expect(inputField.value).toBe('');
    });

    it('should disable the send button if input is empty', () => {
      render(<AIAssistant />);
      const inputField = screen.getByPlaceholderText(/Ask me anything.../i);
      const sendButton = screen.getByRole('button', { name: /send/i });

      // Initially, button should be disabled as input is empty
      expect(sendButton).toBeDisabled();

      // Type something, button should be enabled
      fireEvent.change(inputField, { target: { value: 'Not empty' } });
      expect(sendButton).not.toBeDisabled();

      // Clear input, button should be disabled again
      fireEvent.change(inputField, { target: { value: '' } });
      expect(sendButton).toBeDisabled();
    });

    it('should disable the send button while loading AI response', async () => {
      render(<AIAssistant />);
      const inputField = screen.getByPlaceholderText(/Ask me anything.../i);
      const sendButton = screen.getByRole('button', { name: /send/i });

      fireEvent.change(inputField, { target: { value: 'Test message' } });
      fireEvent.click(sendButton); // Send the message

      // Button should be disabled immediately after sending (while loading)
      expect(sendButton).toBeDisabled();
      expect(screen.getByText(/Assistant is typing.../i)).toBeInTheDocument();


      // Wait for AI response
      act(() => {
        jest.advanceTimersByTime(1000);
      });
      await waitFor(() => {
        expect(screen.queryByText(/Assistant is typing.../i)).not.toBeInTheDocument();
      });
      
      // After loading, input is cleared, so button should remain disabled
      expect(sendButton).toBeDisabled();
      
      // Type again, it should be enabled
      fireEvent.change(inputField, { target: { value: 'Another message' } });
      expect(sendButton).not.toBeDisabled();
    });
  });

  describe('Multiple Messages', () => {
    it('should display multiple user and AI messages in order', async () => {
      render(<AIAssistant />);
      const inputField = screen.getByPlaceholderText(/Ask me anything.../i);
      const sendButton = screen.getByRole('button', { name: /send/i });

      const messages = [
        { user: 'First message', aiExpected: 'You said: "First message". I am a mock AI.' },
        { user: 'Second message', aiExpected: 'You said: "Second message". I am a mock AI.' },
        { user: 'Third message', aiExpected: 'You said: "Third message". I am a mock AI.' },
      ];

      for (const msg of messages) {
        fireEvent.change(inputField, { target: { value: msg.user } });
        fireEvent.click(sendButton);

        // Wait for user message
        await waitFor(() => {
          expect(screen.getByText(msg.user)).toBeInTheDocument();
        });

        // Wait for AI response
        act(() => {
          jest.advanceTimersByTime(1000); // AI response delay
        });
        await waitFor(() => {
          expect(screen.getByText(msg.aiExpected)).toBeInTheDocument();
        });
      }

      // Verify all messages are present in the document in order.
      // This relies on messages being rendered in a container where order matters.
      const allMessageElements = screen.getAllByText(/message/i); // Get all elements containing "message"
      
      let expectedTextOrder: string[] = [];
      messages.forEach(m => {
        expectedTextOrder.push(m.user);
        expectedTextOrder.push(m.aiExpected);
      });
      
      // Check if the rendered messages appear in the expected order.
      // Note: This is a simplified check. A more robust check would involve
      // querying for specific message roles or wrappers to ensure distinct messages.
      let currentSearchIndex = 0;
      expectedTextOrder.forEach(expectedText => {
        const foundElement = allMessageElements.find((el, idx) => idx >= currentSearchIndex && el.textContent?.includes(expectedText));
        expect(foundElement).toBeInTheDocument();
        if (foundElement) {
            // Update currentSearchIndex to ensure next search starts after this found element
            currentSearchIndex = allMessageElements.indexOf(foundElement) + 1;
        }
      });

      // Optional: Check message count if messages have a specific role
      // e.g., const messageItems = screen.getAllByRole('listitem');
      // expect(messageItems.length).toBe(messages.length * 2); 
    });
  });
});
