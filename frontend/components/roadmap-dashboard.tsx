 "use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import SkillsOverview from "./skills-overview"
import MonthCard from "./month-card"
import ResourcesSection from "./resources-section"
import CapstoneSection from "./capstone-section"
import { Button } from "./ui/button"
import { useRouter } from "next/navigation"

interface RoadmapData {
  [key: string]: any
}

export default function RoadmapDashboard({ data, handleDownload, handleGenerateNew }: { data: RoadmapData, handleDownload: () => void, handleGenerateNew: () => void }) {
  const router = useRouter();
  const [selectedMonth, setSelectedMonth] = useState(1)

  const monthRoadmap = data["3. Month-by-Month Roadmap"] || {}
  const totalMonths = Object.keys(monthRoadmap).length

  const getCurrentMonthData = () => {
    const monthKey = `Month ${selectedMonth}`
    return monthRoadmap[monthKey]
  }

  const handlePrevMonth = () => {
    setSelectedMonth((prev) => (prev === 1 ? totalMonths : prev - 1))
  }

  const handleNextMonth = () => {
    setSelectedMonth((prev) => (prev === totalMonths ? 1 : prev + 1))
  }

  return (
    <div className="min-h-screen bg-transparent h-full p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-12">
         <div className=" flex justify-between items-center">
           <h1 className="text-4xl md:text-5xl font-bold text-balance mb-4">{data["title"]}</h1>
           <div className=" flex gap-2">
                 <Button className=" cursor-pointer" onClick={handleDownload}>
                Download
              </Button>
              <Button className=" cursor-pointer" onClick={()=>router.push("/chat")}>
                Chat
              </Button>
                  <Button className=" cursor-pointer" onClick={()=>{
               handleGenerateNew()}}>
                Generate New
              </Button>
           </div>
         </div>
          <p className="text-lg text-muted-foreground">{data["1. Job Role Overview"]}</p>
        </div>

        {/* Skills Overview */}
        <SkillsOverview skills={data["2. Skills Breakdown"]} />

        {/* Month Navigation and Display */}
        <div className="mt-12 mb-12">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold">Month-by-Month Learning Path</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrevMonth}
                className="p-2 rounded-lg bg-card border border-border hover:bg-muted transition-colors"
                aria-label="Previous month"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="text-sm font-semibold bg-primary text-gray-700 px-4 py-2 rounded-lg min-w-fit">
                Month {selectedMonth} of {totalMonths}
              </span>
              <button
                onClick={handleNextMonth}
                className="p-2 rounded-lg bg-card border border-border hover:bg-muted transition-colors"
                aria-label="Next month"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Month Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {Array.from({ length: totalMonths }, (_, i) => {
              const monthNum = i + 1
              const monthData = monthRoadmap[`Month ${monthNum}`]
              return (
                <button
                  key={monthNum}
                  onClick={() => setSelectedMonth(monthNum)}
                  className={`p-4 rounded-lg border-2 transition-all text-left ${
                    selectedMonth === monthNum
                      ? "border-primary bg-primary text-gray-700 bg-opacity-10"
                      : "border-border text-gray-200 bg-card hover:border-primary hover:border-opacity-50"
                  }`}
                >
                  <div className="font-semibold  mb-2">Month {monthNum}</div>
                  <div className="text-sm">{monthData.Topics?.[0]}</div>
                </button>
              )
            })}
          </div>

          {/* Selected Month Detail */}
          <MonthCard month={selectedMonth} data={getCurrentMonthData()} />
        </div>

        {/* Resources Section */}
        <ResourcesSection resources={data["4. Learning Resources"]} />

        {/* Capstone Project */}
        <CapstoneSection capstone={data["5. Capstone Project"]} />

        {/* Extra Tips */}
        <div className="mt-12 bg-card border border-border rounded-lg p-8">
          <h3 className="text-2xl font-bold mb-6">Pro Tips for Success</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Object.entries(data["6. Extra Tips"] || {}).map(([key, value]:any) => (
              <div key={key} className="flex flex-col gap-3">
                <h4 className="font-semibold text-accent text-lg">{key}</h4>
               <p className="text-muted-foreground text-sm leading-relaxed">{value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
