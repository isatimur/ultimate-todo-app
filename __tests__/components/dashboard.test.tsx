import { render, screen } from '@testing-library/react'
import Dashboard from '@/components/dashboard'

const noopFn = () => {}
const chartData: { name: string; value: number }[] = []

describe('Dashboard metrics', () => {
  it('renders productivity score and streak', () => {
    render(
      <Dashboard
        chartData={chartData}
        aiSuggestion=""
        getAISuggestions={noopFn}
        applyAISuggestion={noopFn}
        productivityScore={20}
        streak={3}
      />
    )
    expect(screen.getByTestId('productivity-score').textContent).toBe('20')
    expect(screen.getByText('3 day streak')).toBeInTheDocument()
  })

  it('updates score and shows milestone badge', () => {
    const { rerender } = render(
      <Dashboard
        chartData={chartData}
        aiSuggestion=""
        getAISuggestions={noopFn}
        applyAISuggestion={noopFn}
        productivityScore={10}
        streak={4}
      />
    )
    rerender(
      <Dashboard
        chartData={chartData}
        aiSuggestion=""
        getAISuggestions={noopFn}
        applyAISuggestion={noopFn}
        productivityScore={50}
        streak={5}
      />
    )
    expect(screen.getByTestId('productivity-score').textContent).toBe('50')
    expect(screen.getByText('5 day streak 🎉')).toBeInTheDocument()
  })
})
