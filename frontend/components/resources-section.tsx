 "use client"

interface ResourcesSectionProps {
  resources: {
    [key: string]: string[]
  }
}

export default function ResourcesSection({ resources }: ResourcesSectionProps) {
  return (
    <div className="my-8 sm:my-12">
      <h2 className="mb-5 text-2xl font-bold sm:mb-8 sm:text-3xl">Learning Resources</h2>
      <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6">
        {Object.entries(resources).map(([category, items]) => (
          <div
            key={category}
            className="min-w-0 rounded-lg border border-border bg-card p-4 transition-colors hover:border-secondary sm:p-6"
          >
            <h3 className="text-lg font-bold text-gray-300 mb-4">{category}</h3>
            <ul className="space-y-3">
              {items.map((item, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-3 text-gray-300 hover:text-foreground transition-colors"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-300 flex-shrink-0 mt-1.5"></span>
                  <span className="min-w-0 break-words text-sm leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}
