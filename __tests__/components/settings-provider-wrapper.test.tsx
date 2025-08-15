import React from 'react'
import { render, screen } from '@testing-library/react'
import SettingsProviderWrapper from '@/components/settings-provider-wrapper'
import { useSettings } from '@/lib/contexts/settings-context'

// Mock the Settings context to avoid external dependencies
jest.mock('@/lib/contexts/settings-context', () => {
  const React = require('react')
  const Context = React.createContext({ value: '' })
  const useSettings = () => React.useContext(Context)
  const SettingsProvider = ({ children }) => (
    <Context.Provider value={{ value: 'context works' }}>{children}</Context.Provider>
  )
  return { SettingsProvider, useSettings }
})

// Mock toast utilities globally
jest.mock('sonner', () => ({
  toast: {
    error: jest.fn(),
    success: jest.fn(),
  },
}))

describe('SettingsProviderWrapper', () => {
  it('renders children within settings context', () => {
    const Child = () => {
      const { value } = useSettings() as { value: string }
      return <div>{value}</div>
    }

    render(
      <SettingsProviderWrapper>
        <Child />
      </SettingsProviderWrapper>
    )

    expect(screen.getByText('context works')).toBeInTheDocument()
  })
})
