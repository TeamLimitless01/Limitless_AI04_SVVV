 "use client"

interface MonthCardProps {
  month: number
  data: {
    Topics: string[]
    Resources: string[]
    Tasks: string[]
  }
}

export default function MonthCard({ month, data }: MonthCardProps) {
  if (!data) {
    return (
      <div className="rounded-lg border border-border bg-card p-5 text-center text-muted-foreground sm:p-8">
        No data available for month {month}
      </div>
    )
  }

  return (
    <div className="relative overflow-hidden rounded-lg border border-border bg-gradient-to-br from-card to-card p-4 sm:p-6 md:p-8">
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-r from-primary via-secondary to-accent"></div>
      </div>

      <div className="relative z-10 space-y-6 sm:space-y-8">
        <div className="mb-4 flex flex-wrap items-baseline gap-3 sm:mb-6 sm:gap-4">
          <h3 className="text-2xl font-bold sm:text-3xl">Month {month}</h3>
          <span className="text-sm font-semibold text-gray-200 bg-secondary bg-opacity-20 px-3 py-1 rounded-full">
            Current Selection
          </span>
        </div>

        {/* Topics Section */}
        <div>
          <p className="text-muted-foreground text-sm uppercase tracking-wider mb-4">Topics to Cover</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {data.Topics.map((topic, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 p-4 bg-background bg-opacity-50 border border-border border-opacity-30 rounded-lg hover:border-opacity-100 transition-all"
              >
                <div className="w-2 h-2 mt-2 rounded-full bg-accent flex-shrink-0"></div>
                <span className="min-w-0 break-words text-foreground font-medium">{topic}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Resources Section */}
        <div>
          <p className="text-muted-foreground text-sm uppercase tracking-wider mb-4">Learning Resources</p>
          <div className="space-y-2">
            {data.Resources.map((resource, idx) => (
              <div key={idx} className="flex items-start gap-3 p-3 bg-background bg-opacity-30 rounded-lg">
                <div className="w-1.5 h-1.5 mt-2 rounded-full bg-gray-300 flex-shrink-0"></div>
                <span className="min-w-0 break-words text-gray-300 text-sm">{resource}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Tasks Section */}
        <div>
          <p className="text-muted-foreground text-sm uppercase tracking-wider mb-4">Practical Tasks</p>
          <div className="space-y-2">
            {data.Tasks.map((task, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 p-3 bg-primary bg-opacity-10 border border-primary border-opacity-20 rounded-lg"
              >
                <div className="w-1.5 h-1.5 mt-2 rounded-full bg-gray-700 flex-shrink-0"></div>
                <span className="min-w-0 break-words text-gray-700 text-sm font-medium">{task}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
