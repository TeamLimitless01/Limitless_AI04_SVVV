 "use client"

interface CapstoneSectionProps {
  capstone: {
    "Project Idea": string
    Features: string[]
    Technologies: string[]
  }
}

export default function CapstoneSection({ capstone }: CapstoneSectionProps) {
  return (
    <div className="mt-12 mb-12">
      <h2 className="text-3xl font-bold mb-8">Capstone Project</h2>
      <div className="bg-gradient-to-br from-secondary via-card to-card border border-border border-opacity-50 rounded-lg p-8">
        <div className="mb-8">
          <p className="text-lg text-foreground leading-relaxed">{capstone["Project Idea"]}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Features */}
          <div>
            <h4 className="text-lg font-semibold mb-4 text-accent">Key Features:</h4>
            <div className="space-y-2">
              {capstone.Features.map((feature, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-accent"></div>
                  <span className="text-foreground text-sm">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Technologies */}
          <div>
            <h4 className="text-lg font-semibold mb-4 text-gray-300">Tech Stack:</h4>
            <div className="flex flex-wrap gap-2">
              {capstone.Technologies.map((tech, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1.5 bg-secondary bg-opacity-20 text-gray-300 rounded-full text-sm font-medium border border-secondary border-opacity-30"
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
