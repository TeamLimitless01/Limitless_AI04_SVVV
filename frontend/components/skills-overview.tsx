 "use client"

interface SkillsOverviewProps {
  skills: {
    [skillName: string]: string
  }
}

export default function SkillsOverview({ skills }: SkillsOverviewProps) {
  return (
    <div className="mb-8 grid min-w-0 grid-cols-1 gap-4 sm:mb-12 sm:grid-cols-2 sm:gap-6">
      {Object.entries(skills).map(([skillName, description]) => (
        <div
          key={skillName}
          className="min-w-0 break-words rounded-lg border border-border bg-card p-4 transition-all hover:border-primary hover:border-opacity-50 sm:p-6"
        >
          <h3 className="text-xl font-bold mb-3 text-primary capitalize">{skillName}</h3>
          <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
        </div>
      ))}
    </div>
  )
}
