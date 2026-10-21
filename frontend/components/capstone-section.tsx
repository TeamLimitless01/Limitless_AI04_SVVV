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
    <div className="my-8 sm:my-12">
      <h2 className="mb-5 text-2xl font-bold sm:mb-8 sm:text-3xl">Capstone Project</h2>
      <div className="rounded-lg border border-border border-opacity-50 bg-gradient-to-br from-secondary via-card to-card p-4 sm:p-6 md:p-8">
        <div className="mb-6 sm:mb-8">
          <p className="text-lg text-foreground leading-relaxed">{capstone["Project Idea"]}</p>
        </div>

        <div className="grid min-w-0 grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-8">
          {/* Features */}
          <div>
            <h4 className="text-lg font-semibold mb-4 text-accent">Key Features:</h4>
            <div className="space-y-2">
              {capstone.Features.map((feature, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-accent"></div>
                  <span className="min-w-0 break-words text-foreground text-sm">{feature}</span>
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
