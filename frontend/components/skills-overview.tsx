 "use client"

interface SkillsOverviewProps {
  skills: {
    [skillName: string]: string
  }
}

export default function SkillsOverview({ skills }: SkillsOverviewProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
      {Object.entries(skills).map(([skillName, description]) => (
        <div
          key={skillName}
          className="bg-card border border-border rounded-lg p-6 hover:border-primary hover:border-opacity-50 transition-all"
        >
          <h3 className="text-xl font-bold mb-3 text-primary capitalize">{skillName}</h3>
          <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
        </div>
      ))}
    </div>
  )
}
